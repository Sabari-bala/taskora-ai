/* ─── Task statuses ─────────────────────────────────────── */

export const TASK_STATUSES = [
  { value: 'backlog',     label: 'Backlog' },
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review',      label: 'Review' },
  { value: 'done',        label: 'Done' },
];

export const TASK_PRIORITIES = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

/* ─── Workspace roles ───────────────────────────────────── */

export const WORKSPACE_ROLES = [
  { value: 'owner',   label: 'Owner' },
  { value: 'admin',   label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'member',  label: 'Member' },
  { value: 'viewer',  label: 'Viewer' },
];

/* ─── Colour lookup helpers ─────────────────────────────── */

export const STATUS_COLOR = {
  backlog:     'var(--status-backlog)',
  todo:        'var(--status-todo)',
  in_progress: 'var(--status-in_progress)',
  review:      'var(--status-review)',
  done:        'var(--status-done)',
};

export const PRIORITY_COLOR = {
  low:    'var(--priority-low)',
  medium: 'var(--priority-medium)',
  high:   'var(--priority-high)',
  urgent: 'var(--priority-urgent)',
};

/* ─── AI feature flags (used by the UI to flag Ember components) ── */

export const AI_FEATURES = {
  PLAN_PROJECT:    'plan_project',
  BREAKDOWN_TASK:  'breakdown_task',
  SUMMARIZE_TASK:  'summarize_task',
  PROJECT_INSIGHTS:'project_insights',
};
