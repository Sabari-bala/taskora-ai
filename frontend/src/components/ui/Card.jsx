import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-paper-100 border border-paper-300 rounded-lg shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'px-5 py-4 border-b border-paper-200 flex items-center justify-between gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn('text-h4 font-semibold text-ink-900', className)} {...props}>
      {children}
    </h3>
  );
};

Card.Body = function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'px-5 py-3 border-t border-paper-200 bg-paper-50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
