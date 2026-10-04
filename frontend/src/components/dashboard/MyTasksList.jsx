import { Link } from 'react-router-dom';
import { Calendar, CheckSquare } from 'lucide-react';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { PriorityPill } from '../../features/tasks/pills';
import { cn, formatDate, shortTaskId } from '../../lib/utils';

export function MyTasksList({ tasks = [] }) {
  return (
    <Card className="flex flex-col">
      <div className="px-5 py-4 border-b border-paper-200 flex items-center justify-between">
        <h2 className="text-h4 font-semibold text-ink-900">My tasks</h2>
        <Link
          to="/tasks"
          className="text-caption text-signal-500 hover:text-signal-600 font-medium"
        >
          View all
        </Link>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks assigned"
          description="Tasks assigned to you will appear here."
        />
      ) : (
        <ul className="divide-y divide-paper-200">
          {tasks.slice(0, 6).map((task) => (
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
                <PriorityPill priority={task.priority} />
                {task.due_date && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-caption shrink-0',
                      task.is_overdue
                        ? 'text-[var(--danger-text)]'
                        : 'text-ink-500'
                    )}
                  >
                    <Calendar size={11} />
                    {formatDate(task.due_date, { year: undefined })}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
