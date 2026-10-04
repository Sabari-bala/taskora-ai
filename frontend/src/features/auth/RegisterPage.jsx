import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await register({ email, full_name: fullName, password });
      navigate('/', { replace: true });
    } catch (err) {
      const data = err?.response?.data || {};
      if (data.errors && typeof data.errors === 'object') {
        // Map backend field errors to per-input messages
        const flat = {};
        for (const [field, msgs] of Object.entries(data.errors)) {
          flat[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setErrors(flat);
      } else if (data.detail) {
        setErrors({ _form: data.detail });
      } else {
        setErrors({ _form: 'Could not create your account. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h1 className="text-h2 font-semibold text-ink-900">Create your account</h1>
        <p className="mt-1 text-body text-ink-600">
          Start planning smarter in under a minute.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          placeholder="Arun Kumar"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.full_name}
          autoComplete="name"
          autoFocus
          required
        />
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          required
        />
        <Input
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          helper="Minimum 8 characters. Avoid common passwords."
          required
        />

        {errors._form && (
          <div
            role="alert"
            className="rounded-md border border-[var(--danger)] bg-[var(--danger-bg)] px-3 py-2 text-body-sm text-[var(--danger-text)]"
          >
            {errors._form}
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={submitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-ink-600">
        Already have an account?{' '}
        <Link to="/login" className="text-signal-500 hover:text-signal-600 font-medium">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
