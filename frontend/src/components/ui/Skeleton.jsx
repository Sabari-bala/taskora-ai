import { cn } from '../../lib/utils';

export function Skeleton({ variant = 'text', className, ...props }) {
  const base = 'skeleton';
  const variants = {
    text:  'h-4 w-full',
    title: 'h-6 w-3/4',
    card:  'h-24 w-full rounded-lg',
    board: 'h-40 w-full rounded-xl',
  };
  return <div className={cn(base, variants[variant], className)} {...props} />;
}

Skeleton.Text = ({ className, ...props }) => (
  <div className={cn('skeleton h-4 w-full', className)} {...props} />
);

Skeleton.Card = ({ className, ...props }) => (
  <div className={cn('skeleton h-24 w-full rounded-lg', className)} {...props} />
);

Skeleton.KanbanColumn = ({ className, ...props }) => (
  <div
    className={cn(
      'bg-paper-150 rounded-xl p-3 space-y-2 min-w-[300px] h-[400px]',
      className
    )}
    {...props}
  >
    <div className="skeleton h-5 w-24" />
    <div className="skeleton h-20 w-full rounded-md" />
    <div className="skeleton h-20 w-full rounded-md" />
  </div>
);
