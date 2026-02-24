import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Entry } from '../../lib/api';
import { Card } from '../ui';

interface EntryCardProps {
  entry: Entry;
}

export function EntryCard({ entry }: EntryCardProps) {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Link to={`/entries/${entry.id}/view`}>
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate transition-colors">
              {entry.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 transition-colors">
              {truncateText(entry.content, 150)}
            </p>
          </div>
          <time className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap transition-colors">
            {formatDate(entry.createdAt)}
          </time>
        </div>

        {entry.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {entry.includeInSafetyTimer && (
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 transition-colors">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t('entries.includedInSafetyTimer')}</span>
          </div>
        )}

        {entry.locationName && (
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 transition-colors">
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>{entry.locationName}</span>
          </div>
        )}
      </Card>
    </Link>
  );
}
