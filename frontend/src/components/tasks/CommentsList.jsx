import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { useDeleteComment } from '../../features/tasks/mutations';
import { useToast } from '../ui/Toast';
import { formatRelative } from '../../lib/utils';

export function CommentsList({ comments, currentUserId, taskId }) {
  const toast = useToast();
  const deleteMutation = useDeleteComment(taskId);
  const [pendingDelete, setPendingDelete] = useState(null);

  async function handleConfirmDelete() {
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      toast('Comment deleted', { variant: 'success' });
      setPendingDelete(null);
    } catch {
      toast('Could not delete comment.', { variant: 'error' });
    }
  }

  if (!comments || comments.length === 0) {
    return (
      <p className="text-body-sm text-ink-500 py-3">
        No comments yet. Start the conversation below.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {comments.map((c) => {
          const isMine = c.author?.id === currentUserId;
          return (
            <li key={c.id} className="flex gap-3 group">
              <Avatar
                name={c.author?.display_name || 'Unknown'}
                src={c.author?.avatar}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-body-sm font-medium text-ink-800">
                    {c.author?.display_name || 'Unknown'}
                    {isMine && (
                      <span className="ml-1.5 text-caption text-ink-500 font-normal">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-caption text-ink-500">
                    {formatRelative(c.created_at)}
                  </p>
                  {isMine && (
                    <button
                      type="button"
                      onClick={() => setPendingDelete(c)}
                      className="ml-auto p-1 rounded text-ink-500 opacity-0 group-hover:opacity-100 hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-all"
                      aria-label="Delete comment"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-body-sm text-ink-800 whitespace-pre-wrap break-words">
                  {c.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <DeleteConfirmModal
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this comment?"
        onConfirm={handleConfirmDelete}
        isConfirming={deleteMutation.isPending}
      />
    </>
  );
}
