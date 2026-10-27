import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/layout/Sidebar';
import { CommandMenu } from '../components/layout/CommandMenu';
import { Topbar } from '../components/layout/Topbar';
import { WorkspaceProvider } from '../context/WorkspaceContext';
import { MobileNavProvider, useMobileNav } from '../components/layout/MobileNavContext';
import { cn } from '../lib/utils';

function Shell() {
  const { open, closeNav } = useMobileNav();
  const location = useLocation();

  useEffect(() => {
    closeNav();
  }, [location.pathname, closeNav]);

  return (
    <div className="h-[100dvh] w-full flex bg-paper-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-black/40" onClick={closeNav} />
        
        {/* The drawer container */}
        <div
          className={cn(
            'absolute left-0 top-0 h-[100dvh] w-[280px] flex flex-col bg-paper-150 transition-transform duration-200 ease-out',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar className="w-full h-full" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandMenu />
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
