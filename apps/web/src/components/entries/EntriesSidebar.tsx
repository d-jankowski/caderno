import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEntriesStore } from '../../stores';
import { Button, Input } from '../ui';

interface EntriesSidebarProps {
  isOpen: boolean;
}

export function EntriesSidebar({ isOpen }: EntriesSidebarProps) {
  const { t } = useTranslation();
  const { filters, setFilters, isSearching, setIsSearching } = useEntriesStore();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (searchInput !== filters.search && searchInput.length >= 3) {
      setIsSearching(true);
      debounceTimerRef.current = setTimeout(() => {
        setFilters({ search: searchInput });
      }, 1000);
    } else if (searchInput !== filters.search && searchInput.length < 3 && filters.search) {
      setIsSearching(true);
      debounceTimerRef.current = setTimeout(() => {
        setFilters({ search: '' });
      }, 1000);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput, filters.search, setFilters, setIsSearching]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setIsSearching(true);
    setFilters({ search: searchInput });
  };

  return (
    <aside
      className={`flex-shrink-0 overflow-hidden transition-all duration-200 ${
        isOpen ? 'w-56' : 'w-0'
      }`}
    >
      <div className="w-56 space-y-4">
        <Link to="/entries/new" className="block">
          <Button className="w-full">
            <svg aria-hidden="true" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('entries.newEntry')}
          </Button>
        </Link>

        <form onSubmit={handleSearch}>
          <div className="relative">
            <Input
              placeholder={t('entries.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pr-8"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              </div>
            )}
          </div>
        </form>

        <div className="overflow-hidden rounded-sm border border-paper-300">
          <button
            type="button"
            onClick={() => setFilters({ sortOrder: 'desc' })}
            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
              filters.sortOrder === 'desc'
                ? 'bg-paper-200 text-ink font-medium'
                : 'text-ink-500 hover:bg-paper-200 hover:text-ink'
            }`}
          >
            {t('entries.sortDesc')}
          </button>
          <button
            type="button"
            onClick={() => setFilters({ sortOrder: 'asc' })}
            className={`w-full border-t border-paper-300 px-3 py-2 text-left text-sm transition-colors ${
              filters.sortOrder === 'asc'
                ? 'bg-paper-200 text-ink font-medium'
                : 'text-ink-500 hover:bg-paper-200 hover:text-ink'
            }`}
          >
            {t('entries.sortAsc')}
          </button>
        </div>
      </div>
    </aside>
  );
}
