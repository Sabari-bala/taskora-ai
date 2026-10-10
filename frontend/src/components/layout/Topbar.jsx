import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { CommandPalette } from './CommandPalette';
import { NotificationPanel } from '../notifications/NotificationPanel';

export function Topbar() {
  const { user } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <header className="h-14 bg-paper-100 border-b border-paper-300 flex items-center px-6 gap-4 shrink-0">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex-1 max-w-md h-9 rounded-md border border-paper-300 bg-paper-50 px-3 text-left text-body-sm text-ink-500 hover:border-paper-400 transition-colors flex items-center gap-2"
        >
          <Search size={14} />
          <span>Search tasks, projects…</span>
          <kbd className="ml-auto text-caption bg-paper-150 px-1.5 py-0.5 rounded border border-paper-300 font-mono">
            Ctrl K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <NotificationPanel />
          {user && <Avatar name={user.display_name} src={user.avatar} size="md" />}
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
