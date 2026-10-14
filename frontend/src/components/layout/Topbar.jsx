import { Menu } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useMobileNav } from './MobileNavContext';
import { SearchBox } from './SearchBox';
import { NotificationPanel } from '../notifications/NotificationPanel';

export function Topbar() {
  const { user } = useAuth();
  const { openNav } = useMobileNav();

  return (
    <header className="h-14 bg-paper-100 border-b border-paper-300 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 shrink-0">
      <button
        type="button"
        onClick={openNav}
        aria-label="Open navigation"
        className="lg:hidden w-9 h-9 rounded-md flex items-center justify-center text-ink-600 hover:bg-paper-150 transition-colors shrink-0"
      >
        <Menu size={18} />
      </button>

      <SearchBox />

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NotificationPanel />
        {user && <Avatar name={user.display_name} src={user.avatar} size="md" />}
      </div>
    </header>
  );
}
