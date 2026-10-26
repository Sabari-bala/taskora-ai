import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        'Could not sign you in. Check your email and password.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h1 className="text-h2 font-semibold text-ink-900">Welcome back</h1>
        <p className="mt-1 text-body text-ink-600">
          Sign in to continue to your workspace.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          required
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <div
            role="alert"
            className="rounded-md border border-[var(--danger)] bg-[var(--danger-bg)] px-3 py-2 text-body-sm text-[var(--danger-text)]"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          isLoading={submitting}
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-ink-600">
        New to Taskora?{' '}
        <Link to="/register" className="text-signal-500 hover:text-signal-600 font-medium">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
