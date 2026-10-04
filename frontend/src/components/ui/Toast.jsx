import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'border-[var(--success)] text-[var(--success-text)]',
  error: 'border-[var(--danger)] text-[var(--danger-text)]',
  warning: 'border-[var(--warning)] text-[var(--warning-text)]',
  info: 'border-[var(--info)] text-[var(--info-text)]',
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, { variant = 'info', duration = 4000 } = {}) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  const Icon = ICONS[toast.variant] || Info;

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto bg-paper-100 border-l-4 rounded-md shadow-lg',
        'flex items-start gap-3 pl-3 pr-2 py-3 min-w-[280px] max-w-[380px]',
        'animate-slide-up',
        STYLES[toast.variant],
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-body text-ink-800">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="p-1 rounded text-ink-500 hover:text-ink-800 hover:bg-paper-150 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.toast;
}
