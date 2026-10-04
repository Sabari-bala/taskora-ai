/**
 * Join class names, dropping falsy values.
 * Small `cn()` helper — avoids pulling in clsx or tailwind-merge.
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Format a date for display. Accepts ISO strings, Date objects, or null.
 */
export function formatDate(value, options) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

/**
 * Human-friendly relative time: "2h ago", "in 3 days", "just now".
 */
export function formatRelative(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 45) return 'just now';
  if (abs < 90) return 'a minute ago';

  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return `${days}d ago`;

  const weeks = Math.round(days / 7);
  if (Math.abs(weeks) < 5) return `${weeks}w ago`;

  return formatDate(date);
}

/**
 * Initials for an avatar fallback — "Sabari Bala M R" → "SB".
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join('').toUpperCase() || '?';
}

/**
 * Short, readable ID for a task: `P-a6b5644e` → `P-A6B564`.
 * Server sends full UUID; we truncate for display.
 */
export function shortTaskId(projectKey, uuid) {
  if (!uuid) return '';
  const tail = String(uuid).replace(/-/g, '').slice(0, 6).toUpperCase();
  return projectKey ? `${projectKey}-${tail}` : tail;
}
