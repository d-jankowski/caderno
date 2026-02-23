import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEntriesStore, useSettingsStore } from '../stores';
import { Editor, LocationPicker } from '../components/entries';
import { Button, Input, Alert } from '../components/ui';
import { api } from '../lib/api';

export function EntryEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { preferences } = useSettingsStore();
  const {
    currentEntry,
    isLoading,
    error,
    fetchEntry,
    createEntry,
    updateEntry,
    deleteEntry,
    clearCurrentEntry,
    clearError,
  } = useEntriesStore();

  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [includeInSafetyTimer, setIncludeInSafetyTimer] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number; longitude: number; locationName: string;
  } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Tracks images queued locally (blob URL → File) — uploaded on save, never before
  const pendingUploads = useRef<Map<string, File>>(new Map());

  // Revoke any unreleased blob URLs when the page unmounts
  useEffect(() => {
    return () => {
      for (const blobUrl of pendingUploads.current.keys()) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      fetchEntry(id);
    }

    return () => {
      clearCurrentEntry();
      clearError();
    };
  }, [id, isNew, fetchEntry, clearCurrentEntry, clearError]);

  useEffect(() => {
    if (currentEntry && !isNew) {
      setTitle(currentEntry.title);
      setContent(currentEntry.content);
      setTags(currentEntry.tags);
      setIncludeInSafetyTimer(currentEntry.includeInSafetyTimer);
      if (currentEntry.locationLatitude != null && currentEntry.locationLongitude != null) {
        setLocation({
          latitude: currentEntry.locationLatitude,
          longitude: currentEntry.locationLongitude,
          locationName: currentEntry.locationName ?? '',
        });
      }
    }
  }, [currentEntry, isNew]);

  const handleEditorChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
    },
    []
  );

  const handleImageQueued = useCallback((blobUrl: string, file: File) => {
    pendingUploads.current.set(blobUrl, file);
  }, []);

  // Upload all pending images for entryId, returns content with blob URLs swapped for real URLs.
  // Images removed from the editor before saving are skipped (blob URL not in content).
  const uploadPendingImages = useCallback(async (entryId: string, rawContent: string): Promise<string> => {
    if (pendingUploads.current.size === 0) return rawContent;
    let resolved = rawContent;
    for (const [blobUrl, file] of Array.from(pendingUploads.current.entries())) {
      if (!rawContent.includes(blobUrl)) {
        URL.revokeObjectURL(blobUrl);
        continue;
      }
      const result = await api.uploadImage(entryId, file);
      resolved = resolved.replaceAll(blobUrl, result.url);
      URL.revokeObjectURL(blobUrl);
    }
    pendingUploads.current.clear();
    return resolved;
  }, []);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 20) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      if (isNew) {
        // Create with empty content first — we need the ID to upload images
        const entry = await createEntry({
          title: title.trim(),
          content: content,
          tags,
          includeInSafetyTimer,
          locationLatitude: location?.latitude,
          locationLongitude: location?.longitude,
          locationName: location?.locationName,
        });
        const finalContent = await uploadPendingImages(entry.id, content);
        await updateEntry(entry.id, {
          title: title.trim(),
          content: finalContent,
          tags,
          includeInSafetyTimer,
          locationLatitude: location?.latitude,
          locationLongitude: location?.longitude,
          locationName: location?.locationName,
        });
        navigate(`/entries/${entry.id}`, { replace: true });
      } else if (id) {
        const finalContent = await uploadPendingImages(id, content);
        await updateEntry(id, {
          title: title.trim(),
          content: finalContent,
          tags,
          includeInSafetyTimer,
          locationLatitude: location?.latitude,
          locationLongitude: location?.longitude,
          locationName: location?.locationName,
        });
      }
    } catch {
      // Error handled by store
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;

    try {
      await deleteEntry(id);
      navigate('/entries', { replace: true });
    } catch {
      // Error handled by store
    }
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors">
          {isNew ? t('entries.newEntry') : t('entries.editEntry')}
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/entries')}>
            {t('common.cancel')}
          </Button>
          {!isNew && (
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t('common.delete')}
            </Button>
          )}
          <Button onClick={handleSave} isLoading={isSaving} disabled={!title.trim()}>
            {t('common.save')}
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="space-y-4">
        <Input
          placeholder={t('entries.titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold"
        />

        {(isNew || currentEntry) && (
          <Editor
            key={id}
            initialContent={isNew ? undefined : currentEntry?.content}
            onChange={handleEditorChange}
            placeholder={t('entries.contentPlaceholder')}
            fontSize={preferences.editorFontSize}
            onImageQueued={handleImageQueued}
            onLocationClick={() => setShowLocationPicker(true)}
          />
        )}

        {location && (
          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 transition-colors">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>
              {location.locationName || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
            </span>
            <button
              onClick={() => setLocation(null)}
              className="ml-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              aria-label="Remove location"
            >
              &times;
            </button>
          </div>
        )}

        <div className="space-y-2">
          <label className="label">{t('entries.tags')}</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 transition-colors"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-primary-900 dark:hover:text-primary-100 transition-colors"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t('entries.addTag')}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1"
            />
            <Button variant="secondary" onClick={handleAddTag}>
              {t('common.add')}
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeInSafetyTimer}
            onChange={(e) => setIncludeInSafetyTimer(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300 transition-colors">
            {t('entries.includeInSafetyTimer')}
          </span>
        </label>
      </div>

      {showLocationPicker && (
        <LocationPicker
          initialLocation={location ?? undefined}
          onSave={(loc) => { setLocation(loc); setShowLocationPicker(false); }}
          onCancel={() => setShowLocationPicker(false)}
        />
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-slate-900 transition-colors">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 transition-colors">
              {t('entries.deleteConfirm')}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
              {t('entries.deleteWarning')}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
