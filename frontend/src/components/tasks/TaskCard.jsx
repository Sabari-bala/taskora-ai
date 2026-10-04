import { useDraggable } from '@dnd-kit/core';
import { Calendar } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { PriorityPill } from '../../features/tasks/pills';
import { cn, formatDate, shortTaskId } from '../../lib/utils';

export function TaskCard({ task, projectKey, onClick, overlay }) {
  const draggable = useDraggable({ id: task.id, data: { task } });
  const { attributes, listeners, setNodeRef, transform, isDragging } = draggable;

  const style = transform && !overlay
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const overdue = task.is_overdue;

  const card = (
    <div
      className={cn(
        'w-full text-left bg-paper-100 border border-paper-300 rounded-md',
        'p-3 transition-colors duration-fast',
        'hover:border-paper-400 hover:shadow-sm',
        isDragging && !overlay && 'opacity-30',
        overlay && 'shadow-lg border-signal-500 cursor-grabbing',
        !overlay && 'cursor-grab active:cursor-grabbing'
      )}
      onClick={!overlay ? () => onClick?.(task) : undefined}
    >
      <p className="text-caption font-mono text-ink-500 mb-1">
        {shortTaskId(projectKey, task.id)}
      </p>

      <p className="text-body-sm text-ink-800 font-medium leading-snug line-clamp-2">
        {task.title}
      </p>

      {task.labels?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 px-1.5 h-5 rounded-sm text-caption bg-paper-150 text-ink-600"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <PriorityPill priority={task.priority} />

        <div className="flex items-center gap-2">
          {task.due_date && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-caption',
                overdue ? 'text-[var(--danger-text)]' : 'text-ink-500'
              )}
            >
              <Calendar size={11} />
              {formatDate(task.due_date, { year: undefined })}
            </span>
          )}
          {task.assignee && (
            <Avatar
              name={task.assignee.display_name}
              src={task.assignee.avatar}
              size="xs"
            />
          )}
        </div>
      </div>
    </div>
  );

  if (overlay) return card;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {card}
    </div>
  );
}
