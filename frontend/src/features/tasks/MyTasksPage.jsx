import { Link } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import { useTasks } from './hooks';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PriorityPill, StatusPill } from './pills';
import { cn, formatDate, shortTaskId } from '../../lib/utils';

export default function MyTasksPage() {
  const { data, isLoading, error, refetch } = useTasks({ mine: 'true' });
  const tasks = data?.results || [];

  /* Group by project for readability */
  const grouped = tasks.reduce((acc, t) => {
    const key = t.project || 'unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h1 font-semibold text-ink-900">My Tasks</h1>
        <p className="mt-1 text-body-lg text-ink-600">
          Everything assigned to you across all projects.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <ErrorState
            title="Could not load tasks"
            description="Check that your backend is running."
            onRetry={refetch}
          />
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckSquare}
            title="Nothing assigned to you"
            description="Tasks you're assigned will show up here."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([projectId, list]) => (
            <Card key={projectId} className="overflow-hidden">
              <div className="px-5 py-3 border-b border-paper-200 bg-paper-50 flex items-center justify-between">
                <p className="text-overline text-ink-500">
                  {list.length} task{list.length === 1 ? '' : 's'}
                </p>
                <Link
                  to={`/projects/${projectId}`}
                  className="text-caption text-signal-500 hover:text-signal-600 font-medium"
                >
                  Open project →
                </Link>
              </div>
              <ul className="divide-y divide-paper-200">
                {list.map((task) => (
                  <li key={task.id}>
                    <Link
                      to={`/projects/${task.project}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-paper-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-caption font-mono text-ink-500 mb-0.5">
                          {shortTaskId('', task.id)}
                        </p>
                        <p className="text-body-sm text-ink-800 truncate">
                          {task.title}
                        </p>
                      </div>
                      <StatusPill status={task.status} />
                      <PriorityPill priority={task.priority} />
                      {task.due_date && (
                        <span
                          className={cn(
                            'text-caption shrink-0',
                            task.is_overdue
                              ? 'text-[var(--danger-text)]'
                              : 'text-ink-500'
                          )}
                        >
                          {formatDate(task.due_date, { year: undefined })}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
