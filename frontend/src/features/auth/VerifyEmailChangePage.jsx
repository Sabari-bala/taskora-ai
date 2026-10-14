import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { authApi } from './api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function VerifyEmailChangePage() {
  const [params] = useSearchParams();
  const code = params.get('code');

  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!code) {
      setState('error');
      setMessage('Missing verification code.');
      return;
    }

    let cancelled = false;
    authApi
      .verifyEmailChange(code)
      .then((data) => {
        if (cancelled) return;
        setState('success');
        setMessage(data.detail || 'Email updated successfully.');
      })
      .catch((err) => {
        if (cancelled) return;
        setState('error');
        setMessage(
          err?.response?.data?.detail ||
          'This verification code is invalid or has expired.'
        );
      });

    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="min-h-screen bg-paper-50 flex items-center justify-center px-4 py-12">
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

        <Card className="p-6 text-center">
          {state === 'loading' && (
            <>
              <Loader2 size={28} className="text-signal-500 animate-spin mx-auto mb-4" />
              <h1 className="text-h3 font-semibold text-ink-900">Verifying…</h1>
              <p className="mt-2 text-body-sm text-ink-600">
                One moment while we confirm your email.
              </p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="w-12 h-12 rounded-full bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={24} className="text-[var(--success)]" />
              </div>
              <h1 className="text-h3 font-semibold text-ink-900">Email updated</h1>
              <p className="mt-2 text-body-sm text-ink-600">{message}</p>
              <div className="mt-6">
                <Link to="/settings">
                  <Button variant="primary" className="w-full">
                    Back to settings
                  </Button>
                </Link>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="w-12 h-12 rounded-full bg-[var(--danger-bg)] flex items-center justify-center mx-auto mb-4">
                <XCircle size={24} className="text-[var(--danger)]" />
              </div>
              <h1 className="text-h3 font-semibold text-ink-900">Link invalid</h1>
              <p className="mt-2 text-body-sm text-ink-600">{message}</p>
              <div className="mt-6">
                <Link to="/settings">
                  <Button variant="secondary" className="w-full">
                    Back to settings
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
