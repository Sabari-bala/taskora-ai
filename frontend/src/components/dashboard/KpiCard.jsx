import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

const TONES = {
  neutral: 'text-ink-900',
  danger: 'text-[var(--danger-text)]',
  success: 'text-[var(--success-text)]',
};

export function KpiCard({ label, value, tone = 'neutral', isLoading }) {
  if (isLoading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-7 w-12" />
      </Card>
    );
  }
  return (
    <Card className="p-5">
      <p className="text-overline text-ink-500">{label}</p>
      <p className={cn('mt-2 text-h2 font-semibold', TONES[tone])}>
        {value}
      </p>
    </Card>
  );
}
