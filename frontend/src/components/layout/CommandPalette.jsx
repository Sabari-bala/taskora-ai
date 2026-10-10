import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Folder, Home, CheckSquare, Plus } from 'lucide-react';
import { useProjects } from '../../features/projects/hooks';
import { useWorkspace } from '../../hooks/useWorkspace';
import { cn } from '../../lib/utils';

export function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const { current } = useWorkspace();
  const { data } = useProjects(current ? { workspace: current.id } : {});
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const projects = data?.results || [];
  const filtered = projects.filter((p) =>
    (p.name + ' ' + p.key).toLowerCase().includes(query.toLowerCase())
  );

  function go(path) {
    onOpenChange(false);
    navigate(path);
  }

  const actions = [
    { icon: Home, label: 'Go to Dashboard', run: () => go('/') },
    { icon: CheckSquare, label: 'Go to My Tasks', run: () => go('/tasks') },
    { icon: Folder, label: 'Go to Projects', run: () => go('/projects') },
    { icon: Plus, label: 'New project', run: () => go('/projects') },
  ].filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40 animate-fade-in" />
        <Dialog.Content className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-32px)] max-w-lg bg-paper-100 border border-paper-300 rounded-lg shadow-lg overflow-hidden animate-slide-up">
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <div className="flex items-center gap-2 px-4 h-12 border-b border-paper-200">
            <Search size={16} className="text-ink-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, tasks, actions…"
              className="flex-1 bg-transparent border-none outline-none text-body text-ink-800 placeholder:text-ink-500"
            />
            <kbd className="text-caption bg-paper-150 px-1.5 py-0.5 rounded border border-paper-300 font-mono">
              ESC
            </kbd>
          </div>

          <div className="max-h-[400px] overflow-y-auto py-2">
            {filtered.length > 0 && (
              <>
                <p className="px-4 py-1.5 text-overline text-ink-500">PROJECTS</p>
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => go(`/projects/${p.id}`)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-left',
                      'text-body-sm text-ink-800 hover:bg-paper-150 transition-colors'
                    )}
                  >
                    <Folder size={14} className="text-ink-500" />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-caption text-ink-500 font-mono">{p.key}</span>
                  </button>
                ))}
              </>
            )}

            {actions.length > 0 && (
              <>
                <p className="px-4 py-1.5 text-overline text-ink-500 mt-2">ACTIONS</p>
                {actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.run}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-left',
                      'text-body-sm text-ink-800 hover:bg-paper-150 transition-colors'
                    )}
                  >
                    <a.icon size={14} className="text-ink-500" />
                    {a.label}
                  </button>
                ))}
              </>
            )}

            {filtered.length === 0 && actions.length === 0 && (
              <p className="px-4 py-6 text-center text-body-sm text-ink-500">
                No results for "{query}"
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
