import { useState } from 'react';
import { Flag, Plus, Check, MoreVertical, Trash2, Calendar } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { useToast } from '../ui/Toast';
import {
  useMilestones,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
} from '../../features/projects/hooks';
import { cn, formatDate } from '../../lib/utils';

export function MilestonePanel({ projectId }) {
  const toast = useToast();
  const { data, isLoading } = useMilestones(projectId);
  const create = useCreateMilestone(projectId);
  const update = useUpdateMilestone(projectId);
  const remove = useDeleteMilestone(projectId);

  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  // Backend paginates, so guard against both shapes
  const milestones = Array.isArray(data)
    ? data
    : data?.results || [];

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await create.mutateAsync({
        title: title.trim(),
        due_date: dueDate || null,
      });
      toast('Milestone added', { variant: 'success' });
      setAddOpen(false);
      setTitle('');
      setDueDate('');
    } catch {
      toast('Could not add milestone.', { variant: 'error' });
    }
  }

  function handleToggle(milestone) {
    update.mutate({
      id: milestone.id,
      is_completed: !milestone.is_completed,
    });
  }

  async function handleDelete() {
    try {
      await remove.mutateAsync(pendingDelete.id);
      toast('Milestone removed', { variant: 'success' });
      setPendingDelete(null);
    } catch {
      toast('Could not remove milestone.', { variant: 'error' });
    }
  }

  const total = milestones.length;
  const done = milestones.filter((m) => m.is_completed).length;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flag size={15} className="text-ink-500" />
          <h2 className="text-h4 font-semibold text-ink-900">Milestones</h2>
          {total > 0 && (
            <span className="text-caption text-ink-500 font-mono">
              {done}/{total}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={Plus}
          onClick={() => setAddOpen(true)}
        >
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      ) : total === 0 ? (
        <p className="text-body-sm text-ink-500 py-2">
          No milestones yet. Add checkpoints to track progress against.
        </p>
      ) : (
        <ul className="space-y-1">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-paper-50 group"
            >
              <button
                type="button"
                onClick={() => handleToggle(m)}
                aria-label={m.is_completed ? 'Mark incomplete' : 'Mark complete'}
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                  m.is_completed
                    ? 'bg-[var(--success)] border-[var(--success)] text-white'
                    : 'border-paper-400 bg-paper-100 hover:border-signal-500'
                )}
              >
                {m.is_completed && <Check size={10} strokeWidth={3} />}
              </button>

              <span
                className={cn(
                  'flex-1 truncate text-body-sm',
                  m.is_completed
                    ? 'text-ink-500 line-through'
                    : 'text-ink-800'
                )}
              >
                {m.title}
              </span>

              {m.due_date && (
                <span className="text-caption text-ink-500 inline-flex items-center gap-1 shrink-0">
                  <Calendar size={11} />
                  {formatDate(m.due_date, { year: undefined })}
                </span>
              )}

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="p-1 rounded text-ink-500 opacity-0 group-hover:opacity-100 hover:bg-paper-150 transition-all"
                    aria-label="Milestone actions"
                  >
                    <MoreVertical size={14} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    className="z-50 w-[160px] bg-paper-100 border border-paper-300 rounded-md shadow-md p-1 animate-slide-up"
                  >
                    <DropdownMenu.Item
                      onSelect={() => setPendingDelete(m)}
                      className="flex items-center gap-2 px-3 py-2 rounded text-body-sm text-[var(--danger-text)] hover:bg-[var(--danger-bg)] outline-none cursor-pointer"
                    >
                      <Trash2 size={13} />
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add milestone"
        description="A checkpoint with an optional due date."
        size="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Title"
            placeholder="Foundation complete"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
          <Input
            type="date"
            label="Due date (optional)"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={create.isPending}>
              Add milestone
            </Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={pendingDelete ? `Delete "${pendingDelete.title}"?` : ''}
        onConfirm={handleDelete}
        isConfirming={remove.isPending}
        confirmLabel="Delete milestone"
      />
    </Card>
  );
}
