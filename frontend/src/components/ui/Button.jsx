import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const variants = {
  primary:   'bg-signal-500 text-white hover:bg-signal-600 active:bg-signal-700 disabled:bg-signal-300',
  secondary: 'bg-paper-100 text-ink-800 border border-paper-300 hover:bg-paper-150 active:bg-paper-200',
  ghost:     'text-ink-600 hover:bg-paper-150 active:bg-paper-200',
  danger:    'bg-danger text-white hover:opacity-90 active:opacity-100',
  ai:        'bg-ember-500 text-white hover:bg-ember-600 active:bg-ember-600 shadow-[0_0_0_3px_rgba(255,107,66,0.15)]',
  link:      'text-signal-500 hover:text-signal-600 underline-offset-4 hover:underline p-0 h-auto',
};

const sizes = {
  sm: 'h-8 px-3 text-body-sm gap-1.5',
  md: 'h-10 px-4 text-body gap-2',
  lg: 'h-12 px-5 text-body-lg gap-2',
};

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    className,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-md',
        'transition-colors duration-fast ease-calm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span
          className="inline-block w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin"
          aria-hidden
        />
      ) : (
        LeadingIcon && <LeadingIcon size={16} aria-hidden />
      )}
      {children}
      {TrailingIcon && !isLoading && <TrailingIcon size={16} aria-hidden />}
    </button>
  );
});
