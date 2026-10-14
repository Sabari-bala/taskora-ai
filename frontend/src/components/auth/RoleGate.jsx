import { useWorkspace } from '../../hooks/useWorkspace';

/**
 * Show children only if the current user's workspace role is in `roles`.
 * Default: hide from VIEWER.
 *
 * Usage:
 *   <RoleGate><Button>Delete</Button></RoleGate>            // hides from Viewer
 *   <RoleGate roles={['owner']}><Button>Danger zone</Button></RoleGate>
 */
export function RoleGate({ roles, children, fallback = null }) {
  const { current } = useWorkspace();
  const role = current?.my_role;

  if (!role) return fallback;

  const allowed = roles || ['owner', 'admin', 'manager', 'member'];
  return allowed.includes(role) ? children : fallback;
}
