import { Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const { current, isLoading } = useWorkspace();

  const firstName = user?.display_name?.split(' ')[0] || 'there';

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-h1 font-semibold text-ink-900">
          Good to see you, {firstName}
        </h1>
        <p className="mt-1 text-body-lg text-ink-600">
          {current
            ? `You are working in ${current.name}.`
            : 'Create your first workspace to start.'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : !current ? (
        <Card className="p-8">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-h4 font-semibold text-ink-900">
              No workspace yet
            </h3>
            <p className="mt-1 text-body text-ink-600">
              Create a workspace to organise projects and tasks.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard label="PROJECTS" value="0" />
            <KpiCard label="ACTIVE TASKS" value="0" />
            <KpiCard label="OVERDUE" value="0" />
            <KpiCard label="COMPLETED" value="0" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h2 className="text-h4 font-semibold text-ink-900 mb-4">
                Your workspace
              </h2>
              <dl className="space-y-3 text-body-sm">
                <Row label="Name" value={current.name} />
                <Row label="Slug" value={current.slug} mono />
                <Row label="Members" value={current.member_count} />
                <Row label="Your role" value={current.my_role} capitalize />
              </dl>
            </Card>

            <Card
              className="p-5 border-ember-100"
              style={{ backgroundColor: 'var(--ember-50)' }}
            >
              <div className="flex items-start gap-2 mb-2">
                <Sparkles size={16} className="text-ember-500 mt-0.5" />
                <h2 className="text-h4 font-semibold text-ink-900">
                  AI assistant
                </h2>
              </div>
              <p className="text-body-sm text-ink-600">
                The AI project planner, task breakdown, and insights panels are
                coming next. This dashboard will surface their output here.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <Card className="p-5">
      <p className="text-overline text-ink-500">{label}</p>
      <p className="mt-2 text-h2 font-semibold text-ink-900">{value}</p>
    </Card>
  );
}

function Row({ label, value, mono, capitalize }) {
  return (
    <div className="flex justify-between items-center">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className={
          'text-ink-800' +
          (mono ? ' font-mono' : '') +
          (capitalize ? ' capitalize' : '')
        }
      >
        {value}
      </dd>
    </div>
  );
}
