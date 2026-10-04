import { Avatar } from '../ui/Avatar';
import { formatRelative } from '../../lib/utils';

export function CommentsList({ comments, currentUserId }) {
  if (!comments || comments.length === 0) {
    return (
      <p className="text-body-sm text-ink-500 py-3">
        No comments yet. Start the conversation below.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className="flex gap-3">
          <Avatar
            name={c.author?.display_name || 'Unknown'}
            src={c.author?.avatar}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="text-body-sm font-medium text-ink-800">
                {c.author?.display_name || 'Unknown'}
                {c.author?.id === currentUserId && (
                  <span className="ml-1.5 text-caption text-ink-500 font-normal">
                    (you)
                  </span>
                )}
              </p>
              <p className="text-caption text-ink-500">
                {formatRelative(c.created_at)}
              </p>
            </div>
            <p className="mt-1 text-body-sm text-ink-800 whitespace-pre-wrap break-words">
              {c.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
