import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { useProjects } from '../features/projects/hooks';
import {
  useDashboardSummary,
  useDashboardActivity,
  useDashboardMyTasks,
} from '../features/dashboard/hooks';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { KpiCard } from '../components/dashboard/KpiCard';
import { MyTasksList } from '../components/dashboard/MyTasksList';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { ActiveProjects } from '../components/dashboard/ActiveProjects';

export default function DashboardPage() {
  const { user } = useAuth();
  const { current, isLoading: loadingWorkspace } = useWorkspace();

  const { data: summary, isLoading: loadingSummary } = useDashboardSummary();
  const { data: activity } = useDashboardActivity();
  const { data: myTasks } = useDashboardMyTasks();
  const { data: projectsPage } = useProjects(
    current ? { workspace: current.id } : {},
  );

  const firstName = user?.display_name?.split(' ')[0] || 'there';
  const projects = projectsPage?.results || [];

  /* No workspace — show the setup state */
  if (!loadingWorkspace && !current) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-h1 font-semibold text-ink-900">
            Welcome, {firstName}
          </h1>
          <p className="mt-1 text-body-lg text-ink-600">
            You don't have a workspace yet.
          </p>
        </div>
        <Card className="p-8">
          <EmptyState
            icon={Plus}
            title="Create your first workspace"
            description="Workspaces organise projects, tasks, and teammates. Setup takes 10 seconds."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h1 font-semibold text-ink-900">
            Good to see you, {firstName}
          </h1>
          <p className="mt-1 text-body-lg text-ink-600">
            {current ? `You are working in ${current.name}.` : 'Loading…'}
          </p>
        </div>
        <Link to="/projects">
          <Button variant="secondary" size="md" leadingIcon={Plus}>
            New project
          </Button>
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="PROJECTS"
          value={summary?.active_projects ?? 0}
          isLoading={loadingSummary}
        />
        <KpiCard
          label="MY OPEN TASKS"
          value={summary?.assigned_to_me ?? 0}
          isLoading={loadingSummary}
        />
        <KpiCard
          label="OVERDUE"
          value={summary?.overdue_tasks ?? 0}
          tone={summary?.overdue_tasks > 0 ? 'danger' : 'neutral'}
          isLoading={loadingSummary}
        />
        <KpiCard
          label="COMPLETED"
          value={summary?.completed_tasks ?? 0}
          tone={summary?.completed_tasks > 0 ? 'success' : 'neutral'}
          isLoading={loadingSummary}
        />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MyTasksList tasks={myTasks || []} />
        <RecentActivity activities={activity || []} />
        <ActiveProjects projects={projects} />

        {/* AI panel — Phase 18 will wire the real insights endpoint */}
        <Card
          className="p-5 border-ember-100"
          style={{ backgroundColor: 'var(--ember-50)' }}
        >
          <div className="flex items-start gap-2 mb-2">
            <Sparkles size={16} className="text-ember-500 mt-0.5" />
            <h2 className="text-h4 font-semibold text-ink-900">
              AI Project Insights
            </h2>
          </div>
          <p className="text-body-sm text-ink-600">
            Insight generation lands next. When it does, this panel will show a
            natural-language summary of what's on track, what's slipping, and
            what deserves attention — computed from real project data.
          </p>
        </Card>
      </div>
    </div>
  );
}
