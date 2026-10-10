import { useState } from 'react';
import { User as UserIcon, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { authApi } from '../auth/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../lib/utils';

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h1 font-semibold text-ink-900">Settings</h1>
        <p className="mt-1 text-body-lg text-ink-600">
          Manage your profile and workspace preferences.
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-paper-300">
        <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon={UserIcon}>
          Profile
        </TabButton>
        <TabButton active={tab === 'workspace'} onClick={() => setTab('workspace')} icon={Building2}>
          Workspace
        </TabButton>
      </div>

      {tab === 'profile' ? <ProfileTab /> : <WorkspaceTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 text-body-sm font-medium',
        'border-b-2 -mb-px transition-colors',
        active
          ? 'text-signal-600 border-signal-500'
          : 'text-ink-500 border-transparent hover:text-ink-800'
      )}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateMe({ full_name: fullName.trim() });
      toast('Profile updated', { variant: 'success' });
    } catch {
      toast('Could not save profile.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={user.display_name} src={user.avatar} size="xl" />
        <div>
          <p className="text-h3 font-semibold text-ink-900">{user.display_name}</p>
          <p className="text-body-sm text-ink-500">{user.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
        />
        <Input
          label="Email"
          value={user.email}
          disabled
          helper="Email cannot be changed."
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={saving} disabled={fullName === user.full_name}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function WorkspaceTab() {
  const { current, workspaces } = useWorkspace();

  if (!current) {
    return (
      <Card className="p-6">
        <p className="text-body-sm text-ink-600">No workspace selected.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <p className="text-overline text-ink-500 mb-1">NAME</p>
        <p className="text-body text-ink-800">{current.name}</p>
      </div>
      <div>
        <p className="text-overline text-ink-500 mb-1">SLUG</p>
        <p className="text-body font-mono text-ink-800">{current.slug}</p>
      </div>
      <div>
        <p className="text-overline text-ink-500 mb-1">MEMBERS</p>
        <p className="text-body text-ink-800">{current.member_count}</p>
      </div>
      <div>
        <p className="text-overline text-ink-500 mb-1">YOUR ROLE</p>
        <p className="text-body text-ink-800 capitalize">{current.my_role}</p>
      </div>
      <div className="pt-4 border-t border-paper-200">
        <p className="text-caption text-ink-500">
          You have {workspaces.length} workspace{workspaces.length === 1 ? '' : 's'}.
        </p>
      </div>
    </Card>
  );
}
