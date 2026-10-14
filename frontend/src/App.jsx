import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { AppShell } from './layouts/AppShell';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicOnlyRoute } from './routes/PublicOnlyRoute';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { VerifyEmailChangePage } from './features/auth/VerifyEmailChangePage';
import { Spinner } from './components/ui/Spinner';

/* Landing + heavy app pages are lazy-loaded so the initial bundle
 * stays small. Login/Register/Verify stay eager — they're the first
 * screens an unauthenticated user sees. */
const LandingPage = lazy(() => import('./pages/LandingPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = lazy(() => import('./features/projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./features/projects/ProjectDetailPage'));
const MyTasksPage = lazy(() => import('./features/tasks/MyTasksPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));
const MembersPage = lazy(() => import('./features/workspaces/MembersPage'));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage'));

function PageFallback() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Spinner size={24} className="text-signal-500" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="/verify-email-change" element={<VerifyEmailChangePage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<MyTasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
