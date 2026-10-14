import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useWorkspaceMembers } from './useWorkspaceMembers';
import { useAuth } from '../../hooks/useAuth';
import { workspacesApi } from './api';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';
import { WORKSPACE_ROLES } from '../../lib/constants';
import { cn } from '../../lib/utils';

export default function MembersPage() {
  const { current } = useWorkspace();
  const { user: me } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const { data: members, isLoading } = useWorkspaceMembers(current?.id);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [removing, setRemoving] = useState(null);

  const invite = useMutation({
    mutationFn: (data) => workspacesApi.invite(current.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace-members', current.id] });
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      toast('Member added', { variant: 'success' });
      setInviteOpen(false);
      setEmail('');
      setRole('member');
    },
    onError: (err) => {
      const data = err?.response?.data;
      const detail =
        data?.errors?.email?.[0] ||
        data?.errors?.non_field_errors?.[0] ||
        data?.detail ||
        'Could not add member.';
      toast(detail, { variant: 'error' });
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ memberId, role }) =>
      workspacesApi.updateRole
        ? workspacesApi.updateRole(current.id, memberId, role)
        : Promise.reject(new Error('Not implemented')),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace-members', current.id] });
      toast('Role updated', { variant: 'success' });
    },
    onError: () => toast('Could not change role.', { variant: 'error' }),
  });

  const removeMember = useMutation({
    mutationFn: (memberId) => workspacesApi.removeMember(current.id, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace-members', current.id] });
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      toast('Member removed', { variant: 'success' });
      setRemoving(null);
    },
    onError: () => toast('Could not remove member.', { variant: 'error' }),
  });

  const isAdmin = current?.my_role === 'owner' || current?.my_role === 'admin';

  if (!current) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <EmptyState icon={Users} title="No workspace" description="Select or create a workspace first." />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-h1 font-semibold text-ink-900">Members</h1>
          <p className="mt-1 text-body-lg text-ink-600">
            People in {current.name}.
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" leadingIcon={UserPlus} onClick={() => setInviteOpen(true)}>
            Add member
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-paper-200">
            {(members || []).map((m) => {
              const isMe = m.user.id === me?.id;
              const canManage = isAdmin && m.role !== 'owner' && !isMe;
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-4 px-4 sm:px-5 py-4"
                >
                  <Avatar name={m.user.display_name} src={m.user.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body-sm font-medium text-ink-800 truncate">
                        {m.user.display_name}
                      </p>
                      {isMe && (
                        <span className="text-caption text-ink-500">(you)</span>
                      )}
                    </div>
                    <p className="text-caption text-ink-500 truncate">{m.user.email}</p>
                  </div>

                  {canManage ? (
                    <select
                      value={m.role}
                      onChange={(e) =>
                        changeRole.mutate({ memberId: m.id, role: e.target.value })
                      }
                      className="h-8 rounded-md border border-paper-300 bg-paper-100 px-2 text-body-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-signal-500 shrink-0"
                    >
                      {WORKSPACE_ROLES.filter((r) => r.value !== 'owner').map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  ) : (
                    <Badge variant={m.role === 'owner' ? 'signal' : 'neutral'}>
                      {m.role}
                    </Badge>
                  )}

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setRemoving(m)}
                      className="text-caption text-[var(--danger-text)] hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Modal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Add member"
        description="The user must already have a Taskora account."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim()) return;
            invite.mutate({ email: email.trim(), role });
          }}
          className="space-y-4"
        >
          <Input
            type="email"
            label="Email"
            placeholder="teammate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-body-sm font-medium text-ink-800">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 rounded-md border border-paper-300 bg-paper-100 px-3 text-body text-ink-800 focus:outline-none focus:ring-2 focus:ring-signal-500"
            >
              {WORKSPACE_ROLES.filter((r) => r.value !== 'owner').map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={invite.isPending}>
              Add member
            </Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmModal
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={removing ? `Remove ${removing.user.display_name}?` : ''}
        description="They will lose access to all projects in this workspace."
        onConfirm={() => removeMember.mutate(removing.id)}
        isConfirming={removeMember.isPending}
        confirmLabel="Remove member"
      />
    </div>
  );
}
