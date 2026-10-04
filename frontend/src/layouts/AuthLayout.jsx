import { Outlet } from 'react-router-dom';

/**
 * Layout for /login and /register.
 * Centered card on a paper background — the calm entry point.
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-paper-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="w-8 h-8 rounded-lg bg-signal-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              <path
                d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                fill="white"
              />
            </svg>
          </span>
          <span className="text-h3 font-semibold text-ink-900">Taskora</span>
        </div>
        <Outlet />
      </div>
      <p className="mt-8 text-caption text-ink-500">
        AI-native project workspace for modern teams
      </p>
    </div>
  );
}
