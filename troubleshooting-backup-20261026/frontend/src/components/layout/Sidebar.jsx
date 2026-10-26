import { NavLink } from 'react-router-dom';
import { Home, CheckSquare, Folder, Plus, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { UserMenu } from './UserMenu';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useProjects } from '../../features/projects/hooks';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/tasks', label: 'My Tasks', icon: CheckSquare },
  { to: '/projects', label: 'All Projects', icon: Folder },
  { to: '/members', label: 'Members', icon: Users },
];

export function Sidebar({ className }) {
  const { current } = useWorkspace();
  const { data } = useProjects(current ? { workspace: current.id } : {});
  const projects = data?.results || [];

  return (
    <aside className={cn('w-[280px] h-full bg-paper-150 border-r border-paper-300 flex flex-col shrink-0', className)}>
      
      {/* 1. Header (Never scrolls) */}
      <div className="h-14 flex items-center px-5 border-b border-paper-300 shrink-0">
        <span className="w-7 h-7 rounded-md bg-signal-500 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="white" />
          </svg>
        </span>
        <span className="ml-2 text-h4 font-semibold text-ink-900">Taskora</span>
      </div>

      {/* 2. Workspace (Never scrolls) */}
      <div className="p-3 border-b border-paper-300 shrink-0">
        <WorkspaceSwitcher />
      </div>

      {/* 3. Navigation (THIS is the only part that scrolls) */}
      <nav className="flex-1 overflow-y-auto min-h-0 py-3">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}

        <div className="flex items-center justify-between px-5 mt-6 mb-2">
          <p className="text-overline text-ink-500">PROJECTS</p>
          <NavLink to="/projects" aria-label="New project" className="text-ink-500 hover:text-ink-800 transition-colors">
            <Plus size={14} />
          </NavLink>
        </div>

        {projects.length === 0 ? (
          <p className="px-5 py-1 text-body-sm text-ink-500">No projects yet</p>
        ) : (
          <ul className="space-y-0.5 pb-4">
            {projects.map((p) => (
              <li key={p.id}><ProjectLink project={p} /></li>
            ))}
          </ul>
        )}
      </nav>

      {/* 4. Footer / User Menu (Never scrolls) */}
      <div className="border-t border-paper-300 p-3 shrink-0">
        <UserMenu />
      </div>
    </aside>
  );
}

function SidebarLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn('flex items-center gap-2.5 px-4 mx-2 h-9 rounded-md text-body-sm transition-colors duration-fast',
          isActive ? 'bg-paper-100 text-ink-900 font-medium shadow-xs' : 'text-ink-600 hover:bg-paper-100 hover:text-ink-800'
        )
      }
    >
      <Icon size={16} />
      <span>{label}</span>
    </NavLink>
  );
}

function ProjectLink({ project }) {
  return (
    <NavLink
      to={`/projects/${project.id}`}
      className={({ isActive }) =>
        cn('flex items-center gap-2 px-4 mx-2 h-8 rounded-md text-body-sm transition-colors duration-fast',
          isActive ? 'bg-paper-100 text-ink-900 font-medium' : 'text-ink-600 hover:bg-paper-100 hover:text-ink-800'
        )
      }
    >
      <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: 'var(--signal-300)' }} />
      <span className="truncate flex-1">{project.name}</span>
      <span className="text-caption font-mono text-ink-500 shrink-0">{project.key}</span>
    </NavLink>
  );
}
