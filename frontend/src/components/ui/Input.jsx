import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helper,
    leadingIcon: LeadingIcon,
    className,
    id: providedId,
    type = 'text',
    ...props
  },
  ref
) {
  const autoId = useId();
  const id = providedId || autoId;
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-body-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <div className="relative">
        {LeadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">
            <LeadingIcon size={16} aria-hidden />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'w-full h-10 rounded-md border bg-paper-100 px-3 text-body text-ink-800',
            'placeholder:text-ink-500',
            'transition-colors duration-fast ease-calm',
            'focus:outline-none focus:ring-2 focus:ring-signal-500 focus:ring-offset-0 focus:border-signal-500',
            'disabled:bg-paper-150 disabled:cursor-not-allowed',
            LeadingIcon && 'pl-9',
            error
              ? 'border-danger focus:ring-danger focus:border-danger'
              : 'border-paper-300 hover:border-paper-400',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-caption text-danger">
          {error}
        </p>
      )}
      {!error && helper && (
        <p id={`${id}-helper`} className="text-caption text-ink-500">
          {helper}
        </p>
      )}
    </div>
  );
});
