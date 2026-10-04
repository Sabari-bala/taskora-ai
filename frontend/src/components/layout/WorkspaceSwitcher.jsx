import { useState } from 'react';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '../../lib/utils';
import { useWorkspace } from '../../hooks/useWorkspace';

export function WorkspaceSwitcher() {
  const { workspaces, current, select } = useWorkspace();
  const [open, setOpen] = useState(false);

  const label = current?.name || 'Select workspace';
  const sub = current
    ? `${current.member_count} member${current.member_count === 1 ? '' : 's'}`
    : 'No workspaces yet';

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center gap-2 px-2.5 py-2 rounded-md',
            'hover:bg-paper-100 transition-colors duration-fast text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500'
          )}
        >
          <span
            className="w-7 h-7 rounded-md flex items-center justify-center text-body-sm font-semibold shrink-0"
            style={{ backgroundColor: 'var(--signal-50)', color: 'var(--signal-700)' }}
          >
            {label.charAt(0).toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-medium text-ink-800 truncate">{label}</p>
            <p className="text-caption text-ink-500 truncate">{sub}</p>
          </div>
          <ChevronsUpDown size={14} className="text-ink-500 shrink-0" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-[252px] bg-paper-100 border border-paper-300 rounded-md shadow-md p-1 animate-slide-up"
        >
          {workspaces.length === 0 && (
            <p className="px-3 py-2 text-body-sm text-ink-500">No workspaces yet</p>
          )}

          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => { select(w.id); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded text-body-sm',
                'hover:bg-paper-150 transition-colors text-left'
              )}
            >
              <span className="w-6 h-6 rounded flex items-center justify-center text-caption font-semibold bg-signal-50 text-signal-700">
                {w.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 truncate text-ink-800">{w.name}</span>
              {w.id === current?.id && (
                <Check size={14} className="text-signal-500 shrink-0" />
              )}
            </button>
          ))}

          <div className="border-t border-paper-200 mt-1 pt-1">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-body-sm text-ink-600 hover:bg-paper-150 transition-colors text-left"
            >
              <Plus size={14} />
              New workspace
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
