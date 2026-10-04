import { cn } from '../../lib/utils';

const variants = {
  neutral:  'bg-paper-150 text-ink-600 border-paper-300',
  signal:   'bg-signal-50 text-signal-700 border-signal-100',
  ember:    'bg-ember-50 text-ember-600 border-ember-100',
  success:  'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-bg)]',
  warning:  'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-bg)]',
  danger:   'bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-bg)]',
  info:     'bg-[var(--info-bg)] text-[var(--info-text)] border-[var(--info-bg)]',
  outline:  'bg-transparent text-ink-600 border-paper-400',
};

export function Badge({ variant = 'neutral', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 h-6 rounded-sm',
        'text-caption font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
