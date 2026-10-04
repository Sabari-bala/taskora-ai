import { Activity } from 'lucide-react';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { formatRelative } from '../../lib/utils';

export function RecentActivity({ activities = [] }) {
  return (
    <Card className="flex flex-col">
      <div className="px-5 py-4 border-b border-paper-200">
        <h2 className="text-h4 font-semibold text-ink-900">Recent activity</h2>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Quiet so far"
          description="Actions on your tasks will show up here."
        />
      ) : (
        <ul className="px-5 py-4 space-y-4">
          {activities.slice(0, 6).map((a) => (
            <li key={a.id} className="flex gap-3">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-signal-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-body-sm text-ink-800 leading-snug">
                  {a.human_readable}
                </p>
                <p className="text-caption text-ink-500 mt-0.5">
                  {formatRelative(a.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
