import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Entry } from '../../lib/api';
import { MarkdownViewer } from './MarkdownViewer';

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat(undefined, DATE_FORMAT_OPTIONS).format(new Date(dateString));
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function EntryMeta({ entry, t }: { entry: Entry; t: (key: string) => string }) {
  return (
    <div className="space-y-2 pt-1">
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-sm bg-paper-200 px-2.5 py-0.5 text-xs font-medium text-ink-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {entry.locationName && (
        <div className="flex items-center gap-1.5 text-sm text-ink-500">
          <svg aria-hidden="true" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <span>{entry.locationName}</span>
        </div>
      )}

      {entry.includeInSafetyTimer && (
        <div className="flex items-center gap-1.5 text-sm text-ink-500">
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
    </div>
  );
}

interface EntryPresentationProps {
  entry: Entry;
  /**
   * List mode: header row navigates to view, title toggles expand/collapse,
   * pencil navigates to edit. Full mode (default): all content always visible.
   */
  preview?: boolean;
}

export function EntryPresentation({ entry, preview = false }: EntryPresentationProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (preview) {
    return (
      <div className="card" role="article">
        {/* Header: date navigates to view, pencil navigates to edit */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/entries/${entry.id}/view`)}
            className="text-sm text-ink-400 hover:text-primary-600 transition-colors text-left"
          >
            <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/entries/${entry.id}/edit`)}
            className="rounded-sm p-1 text-ink-300 hover:text-ink-600 transition-colors"
            aria-label={t('common.edit')}
          >
            <PencilIcon />
          </button>
        </div>

        {/* Title */}
        <h2 className="mt-3 text-xl font-semibold text-ink break-words">
          {entry.title}
        </h2>

        {/* Content: capped at ~30 lines when collapsed, full when expanded */}
        <div className="mt-4">
          {expanded ? (
            <MarkdownViewer key={entry.id} content={entry.content} />
          ) : (
            <>
              <div className="relative max-h-[52rem] overflow-hidden">
                <MarkdownViewer key={entry.id} content={entry.content} />
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-paper-100 to-transparent" />
              </div>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="mt-3 flex w-full items-center justify-center border-y border-paper-300 py-2 text-ink-300 hover:text-ink-500 transition-colors"
                aria-label="Show more"
              >
                <DotsIcon />
              </button>
            </>
          )}
        </div>

        {/* Tags / location / safety timer: only when expanded */}
        {expanded && <EntryMeta entry={entry} t={t} />}
      </div>
    );
  }

  /* ── Full / view-page mode ── */
  return (
    <div className="card space-y-4">
      {/* Header: date (static) + pencil navigates to edit */}
      <div className="flex items-center justify-between">
        <time
          className="text-sm text-ink-400"
          dateTime={entry.createdAt}
        >
          {formatDate(entry.createdAt)}
        </time>

        <button
          type="button"
          onClick={() => navigate(`/entries/${entry.id}/edit`)}
          className="rounded-sm p-1 text-ink-300 hover:text-ink-600 transition-colors"
          aria-label={t('common.edit')}
        >
          <PencilIcon />
        </button>
      </div>

      <h2 className="text-xl font-semibold text-ink break-words">
        {entry.title}
      </h2>

      <MarkdownViewer key={entry.id} content={entry.content} />

      <EntryMeta entry={entry} t={t} />
    </div>
  );
}
