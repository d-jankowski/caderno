import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEntriesStore } from '../stores';
import { MarkdownViewer } from '../components/entries';
import { Button, Alert } from '../components/ui';

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat(undefined, DATE_FORMAT_OPTIONS).format(new Date(dateString));
}

export function EntryViewPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentEntry,
    isLoading,
    error,
    fetchEntry,
    clearCurrentEntry,
    clearError,
  } = useEntriesStore();

  useEffect(() => {
    clearCurrentEntry();
    if (id) {
      fetchEntry(id);
    }

    return () => {
      clearCurrentEntry();
      clearError();
    };
  }, [id, fetchEntry, clearCurrentEntry, clearError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!currentEntry) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 transition-colors break-words">
            {currentEntry.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400 transition-colors">
            <time dateTime={currentEntry.createdAt}>
              {formatDate(currentEntry.createdAt)}
            </time>
            {currentEntry.updatedAt !== currentEntry.createdAt && (
              <span>
                {t('entries.updatedAt', { date: formatDate(currentEntry.updatedAt) })}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" onClick={() => navigate('/entries')}>
            {t('common.back')}
          </Button>
          <Button onClick={() => navigate(`/entries/${id}/edit`)}>
            {t('common.edit')}
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Tags */}
      {currentEntry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentEntry.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Location */}
      {currentEntry.locationName && (
        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 transition-colors">
          <svg aria-hidden="true" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span>{currentEntry.locationName}</span>
        </div>
      )}

      {/* Safety Timer indicator */}
      {currentEntry.includeInSafetyTimer && (
        <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 transition-colors">
          <svg aria-hidden="true" className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          <span>{t('entries.includedInSafetyTimer')}</span>
        </div>
      )}

      {/* Divider */}
      <hr className="border-slate-200 dark:border-slate-700 transition-colors" />

      {/* Content */}
      <MarkdownViewer key={currentEntry.id} content={currentEntry.content} />
    </div>
  );
}
