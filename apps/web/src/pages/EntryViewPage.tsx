import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEntriesStore } from '../stores';
import { EntryPresentation } from '../components/entries';
import { Button, Alert } from '../components/ui';

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
    <div className="space-y-4">
      <div>
        <Button variant="ghost" onClick={() => navigate('/entries')}>
          {t('common.back')}
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <EntryPresentation entry={currentEntry} />
    </div>
  );
}
