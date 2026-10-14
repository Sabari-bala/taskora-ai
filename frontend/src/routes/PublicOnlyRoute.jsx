import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';

/**
 * Shows children only when logged out.
 * Logged-in users get redirected to /dashboard.
 * While bootstrapping, show a spinner instead of flashing the landing page.
 */
export function PublicOnlyRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-50">
        <Spinner size={24} className="text-signal-500" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
