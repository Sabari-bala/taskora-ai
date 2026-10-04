import { Link } from 'react-router-dom';
import { CheckCircle2, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn, formatDate } from '../../lib/utils';

export function ProjectCard({ project }) {
  const total = project.task_count || 0;
  const completed = project.completed_task_count || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Link to={`/projects/${project.id}`} className="block">
      <Card className="p-5 h-full hover:border-paper-400 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-caption font-mono text-ink-500 mb-1">
              {project.key}
            </p>
            <h3 className="text-h4 font-semibold text-ink-900 truncate">
              {project.name}
            </h3>
          </div>
          {project.status === 'archived' && (
            <span className="text-caption text-ink-500 shrink-0">Archived</span>
          )}
        </div>

        {project.description && (
          <p className="text-body-sm text-ink-600 line-clamp-2 mb-4">
            {project.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-caption text-ink-500">
            <span>Progress</span>
            <span>{completed} / {total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-paper-150 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all')}
              style={{
                width: `${pct}%`,
                backgroundColor: pct === 100 ? 'var(--success)' : 'var(--signal-500)',
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-caption text-ink-500">
          {project.due_date && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(project.due_date, { year: undefined })}
            </span>
          )}
          {project.lead && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={11} />
              {project.lead.display_name}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
