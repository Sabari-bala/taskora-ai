import { useEffect, useState } from 'react';
import { Sparkles, Check, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { useBreakdownTask } from './hooks';
import { tasksApi } from '../tasks/api';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../lib/utils';

export function BreakdownModal({ task, open, onOpenChange, projectId }) {
  const toast = useToast();
  const qc = useQueryClient();
  const breakdown = useBreakdownTask();

  const [subtasks, setSubtasks] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState('');

  /* Fire the AI request when the modal opens */
  useEffect(() => {
    if (!open || !task?.id) return;
    setError('');
    setSubtasks([]);
    setSelected(new Set());

    breakdown.mutateAsync(task.id)
      .then((res) => {
        const list = res.proposal?.subtasks || [];
        setSubtasks(list);
        setSelected(new Set(list.map((_, i) => i)));
      })
      .catch((err) => {
        const detail =
          err?.response?.data?.detail ||
          'Could not break down this task right now.';
        setError(detail);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?.id]);

  function toggle(i) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  async function handleCommit() {
    if (selected.size === 0) return;
    setCommitting(true);

    const toCreate = subtasks.filter((_, i) => selected.has(i));
    let succeeded = 0;

    try {
      for (const st of toCreate) {
        await tasksApi.create({
          project: projectId,
          parent_task: task.id,
          title: st.title,
          description: st.description || '',
          priority: st.priority || 'medium',
          estimate_hours: st.estimated_hours || null,
          status: 'backlog',
        });
        succeeded += 1;
      }
      qc.invalidateQueries({ queryKey: ['board', projectId] });
      qc.invalidateQueries({ queryKey: ['task', task.id] });
      qc.invalidateQueries({ queryKey: ['task-activity', task.id] });
      toast(
        `Created ${succeeded} subtask${succeeded === 1 ? '' : 's'}`,
        { variant: 'success' }
      );
      onOpenChange(false);
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        `Could not create subtask ${succeeded + 1}.`;
      toast(detail, { variant: 'error' });
    } finally {
      setCommitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles size={16} className="text-ember-500" />
          Break down with AI
        </span>
      }
      description={task ? `Proposed subtasks for "${task.title}"` : ''}
    >
      {breakdown.isPending && (
        <div className="py-12 flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-ember-500 animate-spin" />
          <p className="text-body-sm text-ink-600">Thinking…</p>
          <p className="text-caption text-ink-500">
            Usually 5-15 seconds
          </p>
        </div>
      )}

      {error && !breakdown.isPending && (
        <div className="py-8 flex flex-col items-center gap-3">
          <AlertCircle size={24} className="text-[var(--danger)]" />
          <p className="text-body-sm text-ink-800 text-center max-w-sm">
            {error}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setError('');
              breakdown.reset();
              breakdown.mutateAsync(task.id)
                .then((res) => {
                  const list = res.proposal?.subtasks || [];
                  setSubtasks(list);
                  setSelected(new Set(list.map((_, i) => i)));
                })
                .catch((err) => {
                  setError(
                    err?.response?.data?.detail ||
                    'Could not break down this task right now.'
                  );
                });
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {!breakdown.isPending && !error && subtasks.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-body-sm text-ink-600">
              {selected.size} / {subtasks.length} selected
            </p>
            <button
              type="button"
              onClick={() =>
                setSelected(
                  selected.size === subtasks.length
                    ? new Set()
                    : new Set(subtasks.map((_, i) => i))
                )
              }
              className="text-caption text-signal-500 hover:text-signal-600 font-medium"
            >
              {selected.size === subtasks.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <ul className="space-y-1 max-h-[50vh] overflow-y-auto mb-4">
            {subtasks.map((st, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className={cn(
                    'w-full flex items-start gap-2 text-left px-2 py-2 rounded',
                    'hover:bg-paper-50 transition-colors',
                    selected.has(i) ? 'text-ink-800' : 'text-ink-500'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      selected.has(i)
                        ? 'bg-ember-500 border-ember-500 text-white'
                        : 'border-paper-400 bg-paper-100'
                    )}
                  >
                    {selected.has(i) && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="text-body-sm">{st.title}</span>
                    <span className="ml-2 text-caption text-ink-500 capitalize">
                      {st.priority || 'medium'}
                      {st.estimated_hours ? ` · ${st.estimated_hours}h` : ''}
                    </span>
                    {st.description && (
                      <span className="block text-caption text-ink-500 mt-0.5">
                        {st.description}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex justify-end gap-2 pt-3 border-t border-paper-200">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="ai"
              onClick={handleCommit}
              isLoading={committing}
              disabled={selected.size === 0}
            >
              Create {selected.size} subtask{selected.size === 1 ? '' : 's'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
