import { cn } from '../../lib/utils';

export function Spinner({ size = 16, className, ...props }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('inline-block animate-spin', className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="12" cy="12" r="10"
          stroke="currentColor" strokeOpacity="0.2" strokeWidth="3"
        />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
