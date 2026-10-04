import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-paper-50">
      <header className="border-b border-paper-300 bg-paper-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-signal-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path
                  d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                  fill="white"
                />
              </svg>
            </span>
            <span className="text-h4 font-semibold text-ink-900">Taskora</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-h1 font-semibold text-ink-900">
          Welcome, {user?.display_name || user?.email}
        </h1>
        <p className="mt-2 text-body-lg text-ink-600">
          Your auth flow works end to end. The full dashboard lands in the next block.
        </p>

        <Card className="mt-8 p-6">
          <h2 className="text-h4 font-semibold text-ink-900">You're signed in</h2>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
            <div>
              <dt className="text-ink-500">Email</dt>
              <dd className="text-ink-800 font-mono mt-0.5">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Display name</dt>
              <dd className="text-ink-800 mt-0.5">{user?.display_name}</dd>
            </div>
            <div>
              <dt className="text-ink-500">User ID</dt>
              <dd className="text-ink-800 font-mono text-caption mt-0.5 break-all">
                {user?.id}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">Joined</dt>
              <dd className="text-ink-800 mt-0.5">
                {user?.date_joined
                  ? new Date(user.date_joined).toLocaleDateString()
                  : '—'}
              </dd>
            </div>
          </dl>
        </Card>
      </main>
    </div>
  );
}
