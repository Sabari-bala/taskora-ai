import { cn } from '../../lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-paper-150 flex items-center justify-center mb-4 text-ink-500">
          <Icon size={22} />
        </div>
      )}
      <h3 className="text-h4 font-semibold text-ink-900">{title}</h3>
      {description && (
        <p className="mt-1 text-body text-ink-600 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
