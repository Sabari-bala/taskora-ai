import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Home, CheckSquare, Folder, Users, Settings, Plus, Sparkles, Search } from 'lucide-react';
import { useProjects } from '../../features/projects/hooks';
import { useWorkspace } from '../../hooks/useWorkspace';

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { current } = useWorkspace();
  const { data } = useProjects(current ? { workspace: current.id } : {});
  const projects = data?.results || [];

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (fn) => { setOpen(false); fn(); };

  if (!open) return null;

  const itemClass = "flex items-center gap-3 px-2 py-2 text-sm text-ink-700 rounded-lg cursor-pointer aria-selected:bg-paper-100";
  const groupHeadingClass = "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-ink-500 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <Command className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-paper-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 border-b border-paper-200">
          <Search className="w-4 h-4 text-ink-400 shrink-0" />
          <Command.Input autoFocus placeholder="Type a command or search projects..." className="flex-1 py-4 text-sm bg-transparent outline-none placeholder:text-ink-400" />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-ink-500 bg-paper-100 border border-paper-300 rounded">ESC</kbd>
        </div>

        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="px-4 py-8 text-center text-sm text-ink-500">No results found.</Command.Empty>

          <Command.Group heading="Navigation" className={groupHeadingClass}>
            <Command.Item onSelect={() => runCommand(() => navigate('/dashboard'))} className={itemClass}><Home className="w-4 h-4 text-ink-400 shrink-0" /> Dashboard</Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate('/tasks'))} className={itemClass}><CheckSquare className="w-4 h-4 text-ink-400 shrink-0" /> My Tasks</Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate('/projects'))} className={itemClass}><Folder className="w-4 h-4 text-ink-400 shrink-0" /> All Projects</Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate('/members'))} className={itemClass}><Users className="w-4 h-4 text-ink-400 shrink-0" /> Members</Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate('/settings'))} className={itemClass}><Settings className="w-4 h-4 text-ink-400 shrink-0" /> Settings</Command.Item>
          </Command.Group>

          {projects.length > 0 && (
            <Command.Group heading="Projects" className={groupHeadingClass}>
              {projects.map((p) => (
                <Command.Item key={p.id} onSelect={() => runCommand(() => navigate(`/projects/${p.id}`))} className={itemClass}>
                  <Folder className="w-4 h-4 text-ink-400 shrink-0" />
                  <span className="truncate flex-1">{p.name}</span>
                  <span className="text-xs font-mono text-ink-400 shrink-0">{p.key}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Actions" className={groupHeadingClass}>
            <Command.Item onSelect={() => runCommand(() => navigate('/projects'))} className={itemClass}><Plus className="w-4 h-4 text-ink-400 shrink-0" /> Create new project</Command.Item>
            <Command.Item onSelect={() => runCommand(() => navigate('/dashboard'))} className={itemClass}><Sparkles className="w-4 h-4 text-signal-500 shrink-0" /> Plan with AI</Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
