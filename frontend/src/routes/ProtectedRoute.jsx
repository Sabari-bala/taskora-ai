import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';

/**
 * Wraps routes that require authentication.
 *
 * While AuthProvider is bootstrapping (trying the silent refresh),
 * we show a spinner instead of redirecting — otherwise a logged-in
 * user would be kicked to /login on every page refresh.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-50">
        <Spinner size={24} className="text-signal-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
