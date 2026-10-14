import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../auth/api';
import { useToast } from '../../components/ui/Toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEmail(value) {
  if (!value || !value.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(value.trim())) return 'Please enter a valid email address.';
  return '';
}

export function ChangeEmailForm({ currentEmail }) {
  const toast = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState('');

  const clientError = touched ? validateEmail(newEmail) : '';
  const showError = clientError || serverError;
  const isValid = !validateEmail(newEmail);

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    setTouched(true);
    if (validateEmail(newEmail)) return;
    if (!newEmail.trim()) return;

    setSubmitting(true);
    try {
      await authApi.requestEmailChange(newEmail.trim());
      setSent(true);
      toast('Confirmation sent', { variant: 'success' });
    } catch (err) {
      const data = err?.response?.data;
      const detail =
        data?.errors?.new_email?.[0] ||
        data?.detail ||
        'Could not update email. Try again in a moment.';
      setServerError(detail);
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
        <div className="rounded-md border border-[var(--success)] bg-[var(--success-bg)] px-4 py-3 flex items-start gap-3">
          <Check size={16} className="text-[var(--success)] mt-0.5 shrink-0" />
          <div className="text-body-sm flex-1 min-w-0">
            <p className="font-medium text-[var(--success-text)]">
              Check your inbox
            </p>
            <p className="mt-1 text-[var(--success-text)]">
              We sent a confirmation link to <strong>{newEmail}</strong>.
              Click the link to finish the change. It expires in 24 hours.
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setNewEmail(''); setTouched(false); }}
              className="mt-3 text-signal-500 hover:text-signal-600 font-medium text-body-sm"
            >
              Use a different address
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>
          <Input
            type="email"
            label="New email"
            placeholder="you@company.com"
            value={newEmail}
            onChange={(e) => { setNewEmail(e.target.value); setServerError(''); }}
            onBlur={() => setTouched(true)}
            error={showError}
            helper={
              !showError
                ? "We'll send a link to confirm this address."
                : undefined
            }
            required
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={submitting}
              leadingIcon={Check}
              disabled={!isValid}
            >
              Send confirmation link
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
