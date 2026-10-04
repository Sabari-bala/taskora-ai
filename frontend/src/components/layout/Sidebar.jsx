import { NavLink } from 'react-router-dom';
import { Home, CheckSquare, Folder, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { UserMenu } from './UserMenu';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/projects', label: 'Projects', icon: Folder },
];

export function Sidebar({ className }) {
  return (
    <aside
      className={cn(
        'w-[280px] h-screen bg-paper-150 border-r border-paper-300 flex-col shrink-0',
        className
      )}
    >
      <div className="h-14 flex items-center px-5 border-b border-paper-300">
        <span className="w-7 h-7 rounded-md bg-signal-500 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="white" />
          </svg>
        </span>
        <span className="ml-2 text-h4 font-semibold text-ink-900">Taskora</span>
      </div>

      <div className="p-3 border-b border-paper-300">
        <WorkspaceSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}

        <div className="px-5 mt-6 mb-2">
          <p className="text-overline text-ink-500">Projects</p>
        </div>
        <p className="px-5 py-2 text-body-sm text-ink-500 italic">
          No projects yet
        </p>
      </nav>

      <div className="border-t border-paper-300 p-3">
        <SidebarLink to="/settings" label="Settings" icon={Settings} />
        <div className="mt-2">
          <UserMenu />
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 px-4 mx-2 h-9 rounded-md text-body-sm',
          'transition-colors duration-fast',
          isActive
            ? 'bg-paper-100 text-ink-900 font-medium shadow-xs'
            : 'text-ink-600 hover:bg-paper-100 hover:text-ink-800'
        )
      }
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );
}
