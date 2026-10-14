import { useState } from 'react';
import { Mail, Check, Info } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../auth/api';
import { useToast } from '../../components/ui/Toast';

export function ChangeEmailForm({ currentEmail }) {
  const toast = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!newEmail.trim()) return;

    setSubmitting(true);
    try {
      await authApi.requestEmailChange(newEmail.trim());
      setSent(true);
      toast(
        'Verification email sent. Check your inbox (or the Django terminal in dev).',
        { variant: 'success', duration: 8000 }
      );
    } catch (err) {
      const data = err?.response?.data;
      const detail =
        data?.errors?.new_email?.[0] ||
        data?.detail ||
        'Could not request email change.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-signal-50 flex items-center justify-center shrink-0">
          <Mail size={18} className="text-signal-600" />
        </div>
        <div>
          <h3 className="text-h4 font-semibold text-ink-900">Email address</h3>
          <p className="text-body-sm text-ink-600">
            Current: <span className="font-mono">{currentEmail}</span>
          </p>
        </div>
      </div>

      {sent ? (
        <div className="rounded-md border border-[var(--info)] bg-[var(--info-bg)] px-4 py-3 flex items-start gap-3">
          <Info size={16} className="text-[var(--info)] mt-0.5 shrink-0" />
          <div className="text-body-sm text-[var(--info-text)]">
            <p className="font-medium">Check your new email inbox.</p>
            <p className="mt-1">
              We sent a verification link to <strong>{newEmail}</strong>. The
              link expires in 24 hours. In dev, the email prints to the
              Django server terminal.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setNewEmail(''); }}
              className="mt-2 text-signal-500 hover:text-signal-600 font-medium"
            >
              Send to a different address
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            type="email"
            label="New email address"
            placeholder="newemail@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            helper="We will send a verification link to this address."
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

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={submitting}
              leadingIcon={Check}
              disabled={!newEmail.trim()}
            >
              Send verification link
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
