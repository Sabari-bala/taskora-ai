import { useEffect, useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useMobileNav } from './MobileNavContext';
import { CommandPalette } from './CommandPalette';
import { NotificationPanel } from '../notifications/NotificationPanel';

export function Topbar() {
  const { user } = useAuth();
  const { openNav } = useMobileNav();
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
      <header className="h-14 bg-paper-100 border-b border-paper-300 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 shrink-0">
        <button
          type="button"
          onClick={openNav}
          aria-label="Open navigation"
          className="lg:hidden w-9 h-9 rounded-md flex items-center justify-center text-ink-600 hover:bg-paper-150 transition-colors shrink-0"
        >
          <Menu size={18} />
        </button>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex-1 min-w-0 sm:max-w-md h-9 rounded-md border border-paper-300 bg-paper-50 px-3 text-left text-body-sm text-ink-500 hover:border-paper-400 transition-colors flex items-center gap-2"
        >
          <Search size={14} className="shrink-0" />
          <span className="truncate">Search…</span>
          <kbd className="ml-auto text-caption bg-paper-150 px-1.5 py-0.5 rounded border border-paper-300 font-mono hidden sm:inline">
            Ctrl K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <NotificationPanel />
          {user && <Avatar name={user.display_name} src={user.avatar} size="md" />}
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
