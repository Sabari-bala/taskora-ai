import { useState } from 'react';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md',
            'hover:bg-paper-100 transition-colors duration-fast text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500'
          )}
        >
          <Avatar name={user.display_name} src={user.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-medium text-ink-800 truncate">
              {user.display_name}
            </p>
          </div>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={4}
          className="z-50 w-[240px] bg-paper-100 border border-paper-300 rounded-md shadow-md p-1 animate-slide-up"
        >
          <div className="px-3 py-2">
            <p className="text-body-sm font-medium text-ink-800">
              {user.display_name}
            </p>
            <p className="text-caption text-ink-500 truncate">{user.email}</p>
          </div>
          <DropdownMenu.Separator className="h-px bg-paper-200 my-1" />
          <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded text-body-sm text-ink-600 hover:bg-paper-150 outline-none cursor-pointer">
            <UserIcon size={14} />
            Profile
          </DropdownMenu.Item>
          <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded text-body-sm text-ink-600 hover:bg-paper-150 outline-none cursor-pointer">
            <Settings size={14} />
            Settings
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-paper-200 my-1" />
          <DropdownMenu.Item
            onSelect={() => logout()}
            className="flex items-center gap-2 px-3 py-2 rounded text-body-sm text-[var(--danger-text)] hover:bg-[var(--danger-bg)] outline-none cursor-pointer"
          >
            <LogOut size={14} />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
