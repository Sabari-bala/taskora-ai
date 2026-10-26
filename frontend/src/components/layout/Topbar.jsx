import { useState, useRef, useEffect } from 'react';
import { Menu, Settings, LogOut, Moon, Sun, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useMobileNav } from './MobileNavContext';
import { SearchBox } from './SearchBox';
import { NotificationPanel } from '../notifications/NotificationPanel';

export function Topbar() {
  const { user, logout } = useAuth();
  const { openNav } = useMobileNav();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    if (nextIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const confirmLogout = async () => {
    setIsLogoutModalOpen(false);
    await logout();
    // Force a hard redirect to the landing page
    window.location.href = '/';
  };

  return (
    <>
      <header className="h-14 bg-paper-100 border-b border-paper-300 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 shrink-0 relative z-40">
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
          
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center outline-none focus:ring-2 focus:ring-signal-500 rounded-full transition-transform hover:scale-105"
              >
                <Avatar name={user.full_name} src={user.avatar} size="md" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-ink-900 rounded-md shadow-lg py-1 border border-paper-300 dark:border-ink-700 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-paper-200 dark:border-ink-700">
                    <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{user.full_name}</p>
                    <p className="text-xs text-ink-500 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-600 dark:text-ink-300 hover:bg-paper-50 dark:hover:bg-ink-800 transition-colors"
                    >
                      <Settings size={16} /> Settings
                    </Link>
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-ink-600 dark:text-ink-300 hover:bg-paper-50 dark:hover:bg-ink-800 transition-colors text-left"
                    >
                      {isDark ? <Sun size={16} /> : <Moon size={16} />}
                      {isDark ? 'Light mode' : 'Dark mode'}
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut size={16} /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-ink-900 rounded-xl shadow-xl max-w-sm w-full p-6 animate-slide-up border border-paper-200 dark:border-ink-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="text-red-600 dark:text-red-500" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Log out</h2>
            </div>
            <p className="text-sm text-ink-600 dark:text-ink-300 mb-6">
              Are you sure you want to log out of Taskora? You will need to enter your credentials again to access your workspace.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-paper-100 dark:hover:bg-ink-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
