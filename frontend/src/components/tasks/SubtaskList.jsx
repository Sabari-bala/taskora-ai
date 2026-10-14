import { Check, ListTree, Plus } from 'lucide-react';
import { useState } from 'react';
import { StatusPill, PriorityPill } from '../../features/tasks/pills';
import { Skeleton } from '../ui/Skeleton';
import { cn } from '../../lib/utils';

/**
 * Renders the child tasks of a parent task.
 * Click a subtask → caller decides what to do (usually opens a drawer).
 */
export function SubtaskList({ subtasks, isLoading, onSubtaskClick, onAdd }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
    );
  }

  const total = subtasks?.length || 0;
  const done = subtasks?.filter((t) => t.status === 'done').length || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTree size={14} className="text-ink-500" />
          <span className="text-overline text-ink-500">SUBTASKS</span>
          <span className="text-caption text-ink-500 font-mono">
            {done}/{total}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-caption text-signal-500 hover:text-signal-600 font-medium"
        >
          <Plus size={12} />
          Add subtask
        </button>
      </div>

      {total > 0 && (
        <div className="h-1 rounded-full bg-paper-150 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: pct === 100 ? 'var(--success)' : 'var(--signal-500)',
            }}
          />
        </div>
      )}

      {total === 0 ? (
        <p className="text-body-sm text-ink-500 py-2">
          No subtasks yet. Break this task into smaller pieces, or use{' '}
          <span className="text-ember-600 font-medium">Break down with AI</span>{' '}
          above.
        </p>
      ) : (
        <ul className="space-y-1">
          {subtasks.map((sub) => (
            <li key={sub.id}>
              <button
                type="button"
                onClick={() => onSubtaskClick(sub)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-2 rounded-md text-left',
                  'hover:bg-paper-50 transition-colors text-body-sm'
                )}
              >
                <span
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                    sub.status === 'done'
                      ? 'bg-[var(--success)] border-[var(--success)] text-white'
                      : 'border-paper-400 bg-paper-100'
                  )}
                >
                  {sub.status === 'done' && <Check size={10} strokeWidth={3} />}
                </span>
                <span
                  className={cn(
                    'flex-1 truncate',
                    sub.status === 'done'
                      ? 'text-ink-500 line-through'
                      : 'text-ink-800'
                  )}
                >
                  {sub.title}
                </span>
                <PriorityPill priority={sub.priority} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
