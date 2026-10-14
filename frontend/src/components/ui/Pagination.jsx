import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Pagination control.
 * Props:
 *   page, pageSize, count, onPageChange
 * `count` is the total number of items (from DRF's response.count).
 * Renders nothing if there's only one page.
 */
export function Pagination({ page, pageSize, count, onPageChange }) {
  if (!count || count <= pageSize) return null;

  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) return null;

  const pages = pageRange(page, totalPages);

  return (
    <nav
      className="flex items-center justify-between gap-3 mt-6 flex-wrap"
      aria-label="Pagination"
    >
      <p className="text-caption text-ink-500">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count)} of {count}
      </p>

      <div className="flex items-center gap-1">
        <PagerButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </PagerButton>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`gap-${i}`} className="px-2 text-ink-500 text-body-sm">
              …
            </span>
          ) : (
            <PagerButton
              key={p}
              onClick={() => onPageChange(p)}
              active={p === page}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </PagerButton>
          )
        )}

        <PagerButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </PagerButton>
      </div>
    </nav>
  );
}

function PagerButton({ active, disabled, children, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'min-w-[32px] h-8 px-2 rounded-md text-body-sm transition-colors',
        'inline-flex items-center justify-center',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500',
        active
          ? 'bg-signal-500 text-white font-medium'
          : 'text-ink-600 hover:bg-paper-150',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* Show: 1 … 4 5 6 … 20  style page list */
function pageRange(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('...');
  pages.push(total);
  return pages;
}
