import { useState } from 'react';
import { Check, ListTree, Plus, Trash2, X, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { Skeleton } from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import { PriorityPill } from '../../features/tasks/pills';
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from '../../features/tasks/mutations';
import { cn } from '../../lib/utils';

/**
 * Subtask section for the task drawer.
 *
 * Features:
 *  - Inline add: click "+ Add", type a title, press Enter.
 *  - Toggle done: checkbox flips between 'todo' and 'done'.
 *  - Delete: hover a row, click the trash icon, confirm in modal.
 *  - Progress bar reflects completed/total.
 */
export function SubtaskList({
  parentTaskId,
  projectId,
  subtasks,
  isLoading,
  onOpenBreakdown,
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const createMutation = useCreateTask(projectId);
  const deleteMutation = useDeleteTask(projectId);
  const updateMutation = useUpdateTask();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const total = subtasks?.length || 0;
  const done = subtasks?.filter((t) => t.status === 'done').length || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['subtasks', parentTaskId] });
    qc.invalidateQueries({ queryKey: ['task', parentTaskId] });
    qc.invalidateQueries({ queryKey: ['task-activity', parentTaskId] });
  }

  async function handleAdd(e) {
    if (e) e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    try {
      await createMutation.mutateAsync({
        project: projectId,
        parent_task: parentTaskId,
        title,
        status: 'backlog',
        priority: 'medium',
      });
      invalidate();
      setDraft('');
      setAdding(false);
      toast('Subtask added', { variant: 'success' });
    } catch {
      toast('Could not add subtask.', { variant: 'error' });
    }
  }

  function handleToggle(sub) {
    const nextStatus = sub.status === 'done' ? 'todo' : 'done';
    updateMutation.mutate(
      { id: sub.id, status: nextStatus },
      {
        onSuccess: () => invalidate(),
        onError: () => toast('Could not update subtask.', { variant: 'error' }),
      }
    );
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      invalidate();
      setPendingDelete(null);
      toast('Subtask deleted', { variant: 'success' });
    } catch {
      toast('Could not delete subtask.', { variant: 'error' });
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setAdding(false);
      setDraft('');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ListTree size={14} className="text-ink-500 shrink-0" />
          <span className="text-overline text-ink-500">SUBTASKS</span>
          {total > 0 && (
            <span className="text-caption text-ink-500 font-mono">
              {done}/{total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 text-caption text-signal-500 hover:text-signal-600 font-medium"
            >
              <Plus size={12} />
              Add
            </button>
          )}
          {onOpenBreakdown && (
            <button
              type="button"
              onClick={onOpenBreakdown}
              className="inline-flex items-center gap-1 text-caption text-ember-600 hover:text-ember-500 font-medium"
            >
              <Sparkles size={12} />
              Break down with AI
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
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

      {/* Empty prompt */}
      {total === 0 && !adding && (
        <p className="text-body-sm text-ink-500 py-2">
          No subtasks yet. Add one below, or use{' '}
          <span className="text-ember-600 font-medium">Break down with AI</span>{' '}
          to generate them.
        </p>
      )}

      {/* Subtask rows */}
      {total > 0 && (
        <ul className="space-y-0.5">
          {subtasks.map((sub) => (
            <li
              key={sub.id}
              className="group flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-paper-50 transition-colors"
            >
              <button
                type="button"
                onClick={() => handleToggle(sub)}
                aria-label={sub.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                  sub.status === 'done'
                    ? 'bg-[var(--success)] border-[var(--success)] text-white'
                    : 'border-paper-400 bg-paper-100 hover:border-signal-500'
                )}
              >
                {sub.status === 'done' && <Check size={10} strokeWidth={3} />}
              </button>

              <span
                className={cn(
                  'flex-1 truncate text-body-sm',
                  sub.status === 'done'
                    ? 'text-ink-500 line-through'
                    : 'text-ink-800'
                )}
              >
                {sub.title}
              </span>

              <PriorityPill priority={sub.priority} />

              <button
                type="button"
                onClick={() => setPendingDelete(sub)}
                aria-label="Delete subtask"
                className="p-1 rounded text-ink-500 opacity-0 group-hover:opacity-100 hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-all shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Inline add input */}
      {adding && (
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Subtask title…  (Enter to save, Esc to cancel)"
            className="flex-1 h-9 rounded-md border border-paper-300 bg-paper-100 px-3 text-body-sm text-ink-800 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-signal-500"
            disabled={createMutation.isPending}
          />
          <button
            type="submit"
            disabled={!draft.trim() || createMutation.isPending}
            className="h-9 px-3 rounded-md bg-signal-500 text-white text-body-sm font-medium hover:bg-signal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? '…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setDraft(''); }}
            className="h-9 w-9 rounded-md text-ink-500 hover:bg-paper-150 flex items-center justify-center shrink-0"
            aria-label="Cancel"
          >
            <X size={14} />
          </button>
        </form>
      )}

      <DeleteConfirmModal
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={pendingDelete ? `Delete "${pendingDelete.title}"?` : ''}
        description="The subtask will be permanently removed."
        onConfirm={handleDelete}
        isConfirming={deleteMutation.isPending}
        confirmLabel="Delete subtask"
      />
    </div>
  );
}
