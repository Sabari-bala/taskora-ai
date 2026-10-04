import { useEffect, useState } from 'react';
import { Drawer } from '../ui/Drawer';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { CommentsList } from './CommentsList';
import { CommentComposer } from './CommentComposer';
import { ActivityTimeline } from './ActivityTimeline';
import { AssigneePicker } from './AssigneePicker';
import { StatusPill, PriorityPill } from '../../features/tasks/pills';
import {
  useTask,
  useTaskActivity,
  useTaskComments,
} from '../../features/tasks/hooks';
import {
  useUpdateTask,
  useAddComment,
} from '../../features/tasks/mutations';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useToast } from '../ui/Toast';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '../../lib/constants';
import { formatDate } from '../../lib/utils';

export function TaskDetailDrawer({ taskId, open, onOpenChange }) {
  const { user } = useAuth();
  const { current: currentWorkspace } = useWorkspace();
  const toast = useToast();
  const enabled = open && !!taskId;

  const { data: task, isLoading } = useTask(enabled ? taskId : null);
  const { data: activity } = useTaskActivity(enabled ? taskId : null);
  const { data: commentsPage } = useTaskComments(enabled ? taskId : null);
  const updateMutation = useUpdateTask();
  const commentMutation = useAddComment(taskId);

  const [titleDraft, setTitleDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');

  useEffect(() => {
    if (task) {
      setTitleDraft(task.title);
      setDescDraft(task.description || '');
    }
  }, [task?.id]);

  const comments = commentsPage?.results || [];

  /* Fallback chain — we only need a valid workspace UUID here.
   * 1. Whatever the task detail endpoint returned (preferred).
   * 2. The currently-selected workspace (safe because every task the user
   *    is looking at belongs to a workspace they're a member of, and in
   *    our UI they're already inside one). */
  const resolvedWorkspaceId = task?.workspace || currentWorkspace?.id;

  function updateField(field, value) {
    updateMutation.mutate(
      { id: taskId, [field]: value },
      { onError: () => toast('Could not save change.', { variant: 'error' }) }
    );
  }

  function handleTitleBlur() {
    if (!task || titleDraft === task.title) return;
    if (!titleDraft.trim()) {
      setTitleDraft(task.title);
      return;
    }
    updateField('title', titleDraft.trim());
  }

  function handleDescBlur() {
    if (!task) return;
    if ((descDraft || '') === (task.description || '')) return;
    updateField('description', descDraft);
  }

  async function handleComment(body) {
    try {
      await commentMutation.mutateAsync(body);
    } catch {
      toast('Could not post comment.', { variant: 'error' });
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {isLoading || !task ? (
        <div className="h-full flex items-center justify-center">
          <Spinner size={24} className="text-signal-500" />
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="sticky top-0 bg-paper-100 border-b border-paper-200 px-6 py-4 flex items-start justify-between gap-4 z-10">
            <div className="flex-1 min-w-0">
              <p className="text-caption font-mono text-ink-500 mb-2">
                {task.project?.key
                  ? `${task.project.key}-${task.id.slice(0, 6).toUpperCase()}`
                  : task.id.slice(0, 8)}
              </p>
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                className="w-full text-h3 font-semibold text-ink-900 bg-transparent border-none focus:outline-none focus:bg-paper-50 focus:ring-0 rounded px-1 -mx-1 py-0.5"
              />
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded text-ink-500 hover:text-ink-800 hover:bg-paper-150 transition-colors shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select
                    value={task.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full h-9 rounded-md border border-paper-300 bg-paper-100 px-2 text-body-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-signal-500"
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    value={task.priority}
                    onChange={(e) => updateField('priority', e.target.value)}
                    className="w-full h-9 rounded-md border border-paper-300 bg-paper-100 px-2 text-body-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-signal-500"
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Assignee">
                  <AssigneePicker
                    workspaceId={resolvedWorkspaceId}
                    value={task.assignee}
                    onChange={(user) => updateField('assignee', user?.id || null)}
                  />
                </Field>

                <Field label="Due date">
                  <input
                    type="date"
                    value={task.due_date || ''}
                    onChange={(e) => updateField('due_date', e.target.value || null)}
                    className="w-full h-9 rounded-md border border-paper-300 bg-paper-100 px-2 text-body-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-signal-500"
                  />
                </Field>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status={task.status} />
                <PriorityPill priority={task.priority} />
                {task.assignee && (
                  <span className="inline-flex items-center gap-1.5 text-caption text-ink-600">
                    <Avatar
                      name={task.assignee.display_name}
                      src={task.assignee.avatar}
                      size="xs"
                    />
                    {task.assignee.display_name}
                  </span>
                )}
                {task.estimate_hours && (
                  <span className="text-caption text-ink-500">
                    {task.estimate_hours}h estimate
                  </span>
                )}
                {task.due_date && (
                  <span className="text-caption text-ink-500">
                    · Due {formatDate(task.due_date)}
                  </span>
                )}
              </div>

              <div>
                <p className="text-overline text-ink-500 mb-2">DESCRIPTION</p>
                <textarea
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onBlur={handleDescBlur}
                  placeholder="Add a description…"
                  className="w-full min-h-[100px] rounded-md border border-paper-300 bg-paper-100 px-3 py-2 text-body-sm text-ink-800 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-signal-500 focus:border-signal-500 resize-y"
                />
              </div>

              <div>
                <p className="text-overline text-ink-500 mb-3">
                  COMMENTS · {comments.length}
                </p>
                <CommentsList comments={comments} currentUserId={user?.id} />
                <div className="mt-4">
                  <CommentComposer
                    onSubmit={handleComment}
                    isSubmitting={commentMutation.isPending}
                  />
                </div>
              </div>

              <div>
                <p className="text-overline text-ink-500 mb-3">ACTIVITY</p>
                <ActivityTimeline activities={activity || []} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-overline text-ink-500 mb-1.5">{label}</p>
      {children}
    </div>
  );
}
