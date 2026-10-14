import { useState } from 'react';
import { KeyRound, Check } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../auth/api';
import { useToast } from '../../components/ui/Toast';

export function ChangePasswordForm() {
  const toast = useToast();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast('Password updated successfully', { variant: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const data = err?.response?.data;
      const detail =
        data?.errors?.old_password?.[0] ||
        data?.errors?.new_password?.[0] ||
        data?.detail ||
        'Could not change password.';
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-signal-50 flex items-center justify-center shrink-0">
          <KeyRound size={18} className="text-signal-600" />
        </div>
        <div>
          <h3 className="text-h4 font-semibold text-ink-900">Change password</h3>
          <p className="text-body-sm text-ink-600">
            Use a strong password you do not use anywhere else.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          type="password"
          label="Current password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Input
          type="password"
          label="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          helper="Minimum 8 characters. Avoid common passwords."
          required
        />
        <Input
          type="password"
          label="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
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
            disabled={!oldPassword || !newPassword || !confirmPassword}
          >
            Update password
          </Button>
        </div>
      </form>
    </div>
  );
}
