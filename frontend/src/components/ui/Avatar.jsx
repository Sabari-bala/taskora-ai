import { cn, getInitials } from '../../lib/utils';

const sizes = {
  xs: 'w-6 h-6 text-caption',
  sm: 'w-7 h-7 text-caption',
  md: 'w-8 h-8 text-body-sm',
  lg: 'w-10 h-10 text-body',
  xl: 'w-14 h-14 text-h4',
};

/* Deterministic pastel colour from name so avatars stay consistent */
const COLOURS = [
  '#EEF1FF', '#FFE1D6', '#E6F4EA', '#FEF3E0',
  '#FDEBEC', '#E5F2FB', '#F5F5F2', '#EDEDE8',
];
const TEXT_COLOURS = [
  '#2E39A3', '#E5502C', '#0A6B3C', '#8A5A0A',
  '#992124', '#0A4F80', '#52524D', '#1A1A18',
];

function pickColour(seed) {
  if (!seed) return { bg: COLOURS[0], text: TEXT_COLOURS[0] };
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % COLOURS.length;
  return { bg: COLOURS[idx], text: TEXT_COLOURS[idx] };
}

export function Avatar({ src, name, size = 'md', className, ...props }) {
  const colours = pickColour(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        className={cn(
          'rounded-full object-cover shrink-0',
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name || 'User'}
      className={cn(
        'rounded-full inline-flex items-center justify-center font-semibold shrink-0',
        sizes[size],
        className
      )}
      style={{ backgroundColor: colours.bg, color: colours.text }}
      {...props}
    >
      {getInitials(name)}
    </span>
  );
}
