import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock, Building2, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { authApi } from '../auth/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { useToast } from '../../components/ui/Toast';
import { ChangePasswordForm } from './ChangePasswordForm';
import { ChangeEmailForm } from './ChangeEmailForm';
import { cn } from '../../lib/utils';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-h1 font-semibold text-ink-900">Settings</h1>
          <p className="mt-1 text-body-lg text-ink-600">
            Manage your profile and workspace preferences.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-md text-ink-500 hover:text-ink-800 hover:bg-paper-150 transition-colors shrink-0"
          aria-label="Back"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-paper-300 overflow-x-auto">
        <TabButton active={tab === 'profile'} onClick={() => setTab('profile')} icon={UserIcon}>
          Profile
        </TabButton>
        <TabButton active={tab === 'security'} onClick={() => setTab('security')} icon={Lock}>
          Security
        </TabButton>
        <TabButton active={tab === 'workspace'} onClick={() => setTab('workspace')} icon={Building2}>
          Workspaces
        </TabButton>
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'workspace' && <WorkspacesTab />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 text-body-sm font-medium shrink-0',
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
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name || '');
  }, [user?.id, user?.full_name]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateMe({ full_name: fullName.trim() });
      await refreshUser();
      toast('Profile updated', { variant: 'success' });
    } catch {
      toast('Could not save profile.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;
  const unchanged = fullName === (user.full_name || '');

  return (
    <div className="space-y-6">
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
          <div className="flex justify-end">
            <Button type="submit" isLoading={saving} disabled={unchanged}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <ChangeEmailForm currentEmail={user.email} />
      </Card>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <ChangePasswordForm />
      </Card>
    </div>
  );
}

function WorkspacesTab() {
  const { workspaces, current, select } = useWorkspace();

  if (workspaces.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-body-sm text-ink-600">
          No workspaces yet. Create one from the workspace switcher.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {workspaces.map((w) => (
        <Card key={w.id} className="p-5 flex items-center gap-4">
          <span
            className="w-10 h-10 rounded-md flex items-center justify-center text-h4 font-semibold shrink-0"
            style={{ backgroundColor: 'var(--signal-50)', color: 'var(--signal-700)' }}
          >
            {w.name.charAt(0).toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-body-sm font-medium text-ink-800 truncate">
                {w.name}
              </p>
              {w.id === current?.id && (
                <span className="inline-flex items-center gap-1 text-caption text-signal-600">
                  <Check size={11} /> Active
                </span>
              )}
            </div>
            <p className="text-caption text-ink-500 mt-0.5">
              {w.member_count} member{w.member_count === 1 ? '' : 's'} · your role: {w.my_role}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to={`/projects`}>
              <Button
                variant="secondary"
                size="sm"
                disabled={w.id === current?.id}
                onClick={() => w.id !== current?.id && select(w.id)}
              >
                Open
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
