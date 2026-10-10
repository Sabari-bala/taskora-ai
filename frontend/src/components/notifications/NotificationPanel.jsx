import { Bell, CheckCheck } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useUnreadCount,
} from '../../features/notifications/hooks';
import { cn, formatRelative } from '../../lib/utils';

export function NotificationPanel() {
  const { data: unread } = useUnreadCount();
  const { data: list, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = list?.results || [];
  const count = unread?.unread_count || 0;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-md flex items-center justify-center text-ink-600 hover:bg-paper-150 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500"
        >
          <Bell size={16} />
          {count > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-ember-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={6}
          className="z-50 w-[360px] bg-paper-100 border border-paper-300 rounded-md shadow-lg overflow-hidden animate-slide-up"
        >
          <div className="flex items-center justify-between px-4 h-11 border-b border-paper-200">
            <p className="text-body-sm font-semibold text-ink-900">Notifications</p>
            {count > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="inline-flex items-center gap-1 text-caption text-signal-500 hover:text-signal-600 font-medium"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Spinner size={20} className="text-signal-500" />
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="You're all caught up"
                description="Notifications about your tasks will appear here."
              />
            ) : (
              <ul className="divide-y divide-paper-200">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => !n.is_read && markRead.mutate(n.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-paper-50 transition-colors',
                        !n.is_read && 'bg-signal-50/50'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-signal-500 shrink-0" />
                        )}
                        <div className={cn('flex-1 min-w-0', n.is_read && 'ml-4')}>
                          <p className="text-body-sm text-ink-800 leading-snug">
                            {n.message || n.verb.replace('_', ' ')}
                          </p>
                          <p className="text-caption text-ink-500 mt-0.5">
                            {formatRelative(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
