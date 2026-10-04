import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { STATUS_COLOR } from '../../lib/constants';
import { TaskCard } from './TaskCard';

export function KanbanColumn({
  status,
  label,
  tasks,
  projectKey,
  onTaskClick,
  onAddClick,
}) {
  return (
    <div className="flex flex-col shrink-0 w-[300px]">
      <div className="flex items-center gap-2 px-2 mb-3">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: STATUS_COLOR[status] }}
        />
        <span className="text-overline text-ink-600 uppercase">{label}</span>
        <span className="text-caption text-ink-500 font-mono ml-1">
          {tasks.length}
        </span>
        <button
          type="button"
          onClick={onAddClick}
          className={cn(
            'ml-auto w-6 h-6 rounded flex items-center justify-center',
            'text-ink-500 hover:text-ink-800 hover:bg-paper-150 transition-colors'
          )}
          aria-label={`Add task to ${label}`}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 bg-paper-150 rounded-xl p-2 space-y-2 min-h-[200px]">
        {tasks.length === 0 ? (
          <div className="border-2 border-dashed border-paper-300 rounded-md p-4 text-center">
            <p className="text-caption text-ink-500">No cards yet</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectKey={projectKey}
              onClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
