import { formatRelative } from '../../lib/utils';

export function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <p className="text-body-sm text-ink-500 py-3">
        No activity yet.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-paper-300 ml-2 space-y-4">
      {activities.map((a) => (
        <li key={a.id} className="pl-4">
          <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-paper-100 border-2 border-paper-400" />
          <p className="text-body-sm text-ink-800">
            {a.human_readable}
          </p>
          <p className="text-caption text-ink-500 mt-0.5">
            {formatRelative(a.created_at)}
          </p>
        </li>
      ))}
    </ol>
  );
}
