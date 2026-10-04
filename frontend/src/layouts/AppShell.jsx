import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import { WorkspaceProvider } from '../context/WorkspaceContext';

export function AppShell() {
  return (
    <WorkspaceProvider>
      <div className="h-screen flex bg-paper-50 overflow-hidden">
        <Sidebar className="hidden lg:flex" />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
}
