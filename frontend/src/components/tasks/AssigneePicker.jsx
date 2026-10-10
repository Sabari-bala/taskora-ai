import { useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, UserCircle2, X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Spinner } from '../ui/Spinner';
import { cn } from '../../lib/utils';
import { useWorkspaceMembers } from '../../features/workspaces/useWorkspaceMembers';

/**
 * Popover dropdown for choosing a task assignee.
 *
 * IMPORTANT: when this picker is rendered inside a Radix Dialog (Modal or
 * Drawer), Radix blocks pointer events outside the dialog tree. A plain
 * Popover.Portal renders to document.body — which is outside — so clicks
 * on the dropdown silently do nothing. We pass `container` to render the
 * popover INSIDE the dialog whenever one is present.
 */
export function AssigneePicker({ workspaceId, value, onChange, disabled }) {
  const { data: members, isLoading } = useWorkspaceMembers(workspaceId);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  /* The Modal and Drawer both render Dialog.Content with this id.
   * When there is no dialog, we let Radix use the default (body). */
  const portalContainer =
    typeof document !== 'undefined'
      ? document.getElementById('taskora-dialog-content')
      : undefined;

  const filtered = useMemo(() => {
    const list = members || [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((m) => {
      const name = (m.user?.display_name || '').toLowerCase();
      const email = (m.user?.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [members, query]);

  function pick(user) {
    onChange?.(user);
    setOpen(false);
    setQuery('');
  }

  function clear(e) {
    e.stopPropagation();
    onChange?.(null);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'w-full flex items-center gap-2 h-9 px-2 rounded-md border bg-paper-100 text-left',
            'border-paper-300 hover:border-paper-400 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-signal-500',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          {value ? (
            <>
              <Avatar name={value.display_name} src={value.avatar} size="xs" />
              <span className="text-body-sm text-ink-800 truncate flex-1">
                {value.display_name}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={clear}
                onKeyDown={(e) => { if (e.key === 'Enter') clear(e); }}
                className="p-0.5 rounded hover:bg-paper-150 text-ink-500 hover:text-ink-800 cursor-pointer"
                aria-label="Clear assignee"
              >
                <X size={12} />
              </span>
            </>
          ) : (
            <>
              <UserCircle2 size={16} className="text-ink-500" />
              <span className="text-body-sm text-ink-500 flex-1">
                Unassigned
              </span>
            </>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal container={portalContainer}>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-[60] w-[260px] bg-paper-100 border border-paper-300 rounded-md shadow-md p-1 animate-slide-up"
        >
          <div className="p-1.5 border-b border-paper-200">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members…"
              className="w-full h-8 px-2 rounded text-body-sm border border-paper-300 focus:outline-none focus:ring-2 focus:ring-signal-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto mt-1">
            {isLoading ? (
              <div className="p-3 flex justify-center">
                <Spinner size={16} className="text-signal-500" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-3 text-body-sm text-ink-500">
                {members?.length ? 'No matches' : 'No members yet'}
              </p>
            ) : (
              filtered.map((member) => {
                const isCurrent = value?.id === member.user.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => pick(member.user)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-body-sm',
                      'hover:bg-paper-150 transition-colors text-left'
                    )}
                  >
                    <Avatar
                      name={member.user.display_name}
                      src={member.user.avatar}
                      size="xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-ink-800 truncate">
                        {member.user.display_name}
                      </p>
                      <p className="text-caption text-ink-500 truncate">
                        {member.role}
                      </p>
                    </div>
                    {isCurrent && <Check size={14} className="text-signal-500 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
