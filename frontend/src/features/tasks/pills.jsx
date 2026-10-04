import { cn } from '../../lib/utils';
import { STATUS_COLOR, PRIORITY_COLOR } from '../../lib/constants';

export function StatusPill({ status }) {
  const label = status.replace('_', ' ');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 h-6 rounded-sm',
        'text-caption font-medium bg-paper-150 text-ink-600'
      )}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: STATUS_COLOR[status] || 'var(--ink-500)' }}
      />
      <span className="capitalize">{label}</span>
    </span>
  );
}

export function PriorityPill({ priority }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 h-6 rounded-sm',
        'text-caption font-medium bg-paper-150 text-ink-600 capitalize'
      )}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: PRIORITY_COLOR[priority] || 'var(--ink-500)' }}
      />
      {priority}
    </span>
  );
}
