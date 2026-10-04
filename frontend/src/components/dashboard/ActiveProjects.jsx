import { Link } from 'react-router-dom';
import { Folder } from 'lucide-react';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

export function ActiveProjects({ projects = [] }) {
  return (
    <Card className="flex flex-col">
      <div className="px-5 py-4 border-b border-paper-200 flex items-center justify-between">
        <h2 className="text-h4 font-semibold text-ink-900">Active projects</h2>
        <Link
          to="/projects"
          className="text-caption text-signal-500 hover:text-signal-600 font-medium"
        >
          View all
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No projects yet"
          description="Create a project to get started."
        />
      ) : (
        <ul className="divide-y divide-paper-200">
          {projects.slice(0, 4).map((project) => {
            const total = project.task_count || 0;
            const done = project.completed_task_count || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <li key={project.id}>
                <Link
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-paper-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-md bg-signal-50 flex items-center justify-center shrink-0">
                    <Folder size={16} className="text-signal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-ink-800 truncate">
                      {project.name}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-paper-150 overflow-hidden max-w-[120px]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              pct === 100 ? 'var(--success)' : 'var(--signal-500)',
                          }}
                        />
                      </div>
                      <span className="text-caption text-ink-500 shrink-0">
                        {done}/{total}
                      </span>
                    </div>
                  </div>
                  <span className="text-caption text-ink-500 font-mono shrink-0">
                    {project.key}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
