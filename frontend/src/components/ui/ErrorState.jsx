import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--danger-bg)] flex items-center justify-center mb-4 text-[var(--danger)]">
        <AlertCircle size={22} />
      </div>
      <h3 className="text-h4 font-semibold text-ink-900">{title}</h3>
      {description && (
        <p className="mt-1 text-body text-ink-600 max-w-sm">{description}</p>
      )}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
