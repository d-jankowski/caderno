import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEntriesStore } from '../stores';
import { EntriesSidebar, EntryList } from '../components/entries';

function SidebarToggleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function EntriesPage() {
  const { t } = useTranslation();
  const { filters, setFilters } = useEntriesStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Always sort by creation date
  useEffect(() => {
    if (filters.sortBy !== 'entryDate') {
      setFilters({ sortBy: 'entryDate' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-start gap-6">
      <EntriesSidebar isOpen={sidebarOpen} />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="rounded-sm p-1.5 text-ink-400 transition-colors hover:bg-paper-200 hover:text-ink"
            aria-label={sidebarOpen ? t('common.closeSidebar') : t('common.openSidebar')}
          >
            <SidebarToggleIcon />
          </button>
        </div>

        <EntryList />
      </div>
    </div>
  );
}
