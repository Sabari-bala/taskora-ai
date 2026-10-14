import { Link } from 'react-router-dom';
import {
  Sparkles,
  KanbanSquare,
  Users,
  Zap,
  BarChart3,
  Shield,
  ArrowRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper-50 flex flex-col">
      {/* Nav */}
      <header className="border-b border-paper-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-signal-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path
                  d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
                  fill="white"
                />
              </svg>
            </span>
            <span className="text-h4 font-semibold text-ink-900">Taskora AI</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-body-sm font-medium text-ink-600 hover:text-ink-900 transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center h-9 px-4 rounded-md bg-signal-500 text-white text-body-sm font-medium hover:bg-signal-600 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full bg-ember-50 border border-ember-100 text-caption text-ember-600 font-medium mb-6">
            <Sparkles size={12} />
            AI-native project workspace
          </div>
          <h1 className="text-[44px] leading-[1.05] sm:text-[64px] font-semibold tracking-tight text-ink-900 max-w-3xl mx-auto">
            Turn rough ideas into structured, ship-ready work.
          </h1>
          <p className="mt-6 text-body-lg text-ink-600 max-w-2xl mx-auto">
            Taskora is a multi-tenant project workspace where AI helps you plan,
            break down, and interpret your work — with a human in control every step.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-signal-500 text-white font-medium hover:bg-signal-600 transition-colors"
            >
              Start planning
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center h-11 px-6 rounded-md border border-paper-300 text-ink-800 font-medium hover:bg-paper-150 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Feature
              icon={Sparkles}
              tone="ember"
              title="AI Project Planner"
              description="Describe an idea. Review a structured proposal of milestones, epics, and tasks. Accept only what you want."
            />
            <Feature
              icon={KanbanSquare}
              tone="signal"
              title="Kanban that respects you"
              description="Drag between columns with optimistic updates. Rollback on failure. The database is always the source of truth."
            />
            <Feature
              icon={Users}
              tone="signal"
              title="Multi-tenant by design"
              description="Workspaces, role-based permissions, and isolated data. Five roles from Owner to Viewer."
            />
            <Feature
              icon={BarChart3}
              tone="signal"
              title="Analytics from real data"
              description="Overdue counts, workload distribution, and progress — computed server-side, not guessed by AI."
            />
            <Feature
              icon={Zap}
              tone="ember"
              title="Task breakdown + summary"
              description="Turn one task into ordered subtasks. Summarize a thread into decisions, blockers, and next steps."
            />
            <Feature
              icon={Shield}
              tone="signal"
              title="Safe by default"
              description="Every AI output is a proposal. Nothing touches the database until a human approves it."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-paper-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-caption text-ink-500 flex-wrap gap-3">
          <p>Taskora AI · An AI-native project workspace.</p>
          <p>Built as a portfolio project.</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, description, tone }) {
  const isAI = tone === 'ember';
  return (
    <div className="rounded-xl border border-paper-300 bg-paper-100 p-5">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
        style={{
          backgroundColor: isAI ? 'var(--ember-50)' : 'var(--signal-50)',
          color: isAI ? 'var(--ember-500)' : 'var(--signal-600)',
        }}
      >
        <Icon size={18} />
      </div>
      <h3 className="text-h4 font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 text-body-sm text-ink-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
