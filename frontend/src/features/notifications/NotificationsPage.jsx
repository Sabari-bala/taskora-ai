import { Bell, CheckCheck, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Avatar } from '../../components/ui/Avatar';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useUnreadCount,
} from './hooks';
import { cn, formatRelative } from '../../lib/utils';

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const { data: unread } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.results || [];
  const count = unread?.unread_count || 0;

  /* Group by day for readability */
  const grouped = notifications.reduce((acc, n) => {
    const d = new Date(n.created_at);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h1 font-semibold text-ink-900">Notifications</h1>
          <p className="mt-1 text-body-lg text-ink-600">
            {count > 0 ? `${count} unread` : "You're all caught up."}
          </p>
        </div>
        {count > 0 && (
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={CheckCheck}
            onClick={() => markAllRead.mutate()}
            isLoading={markAllRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Updates about your tasks, mentions, and deadlines will show up here."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([label, items]) => (
            <div key={label}>
              <p className="text-overline text-ink-500 mb-2 px-1">{label.toUpperCase()}</p>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-paper-200">
                  {items.map((n) => (
                    <li key={n.id}>
                      <div
                        className={cn(
                          'flex items-start gap-3 px-4 sm:px-5 py-4',
                          !n.is_read && 'bg-signal-50/40'
                        )}
                      >
                        <div className="shrink-0 mt-0.5">
                          {n.actor ? (
                            <Avatar
                              name={n.actor.display_name}
                              src={n.actor.avatar}
                              size="sm"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-paper-150 flex items-center justify-center">
                              <Bell size={12} className="text-ink-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm text-ink-800 leading-snug">
                            {n.message || n.verb.replace(/_/g, ' ')}
                          </p>
                          <p className="text-caption text-ink-500 mt-1">
                            {formatRelative(n.created_at)}
                          </p>
                        </div>
                        {!n.is_read && (
                          <button
                            type="button"
                            onClick={() => markRead.mutate(n.id)}
                            className="shrink-0 p-1.5 rounded text-ink-500 hover:text-signal-600 hover:bg-paper-100 transition-colors"
                            aria-label="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
