import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { MobileNavProvider, useMobileNav } from '../components/layout/MobileNavContext';
import { cn } from '../lib/utils';

function Shell() {
  const { open, closeNav } = useMobileNav();
  const location = useLocation();

  /* Close mobile nav on route change */
  useEffect(() => {
    closeNav();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="h-screen flex bg-paper-50 overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={closeNav}
        />
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 transition-transform duration-200 ease-out',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar className="flex" />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <WorkspaceProvider>
      <MobileNavProvider>
        <Shell />
      </MobileNavProvider>
    </WorkspaceProvider>
  );
}
