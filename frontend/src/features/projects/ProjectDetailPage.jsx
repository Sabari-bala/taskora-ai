import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Folder } from 'lucide-react';
import { useProject, useBoard } from './hooks';
import { KanbanColumn } from '../../components/tasks/KanbanColumn';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { TASK_STATUSES } from '../../lib/constants';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { data: project, isLoading: loadingProject, error: projectError, refetch: refetchProject } =
    useProject(id);
  const { data: board, isLoading: loadingBoard, error: boardError, refetch: refetchBoard } =
    useBoard(id);

  if (loadingProject || loadingBoard) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-3 overflow-x-auto">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton.KanbanColumn key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (projectError || boardError) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <ErrorState
            title="Could not load project"
            description="The project may not exist, or your backend is offline."
            onRetry={() => { refetchProject(); refetchBoard(); }}
          />
        </Card>
      </div>
    );
  }

  const totalTasks = Object.values(board || {}).reduce(
    (sum, list) => sum + list.length,
    0
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 lg:px-8 py-5 border-b border-paper-300 bg-paper-100">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-body-sm text-ink-500 hover:text-ink-800 transition-colors mb-2"
        >
          <ChevronLeft size={14} />
          All projects
        </Link>

        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-md bg-signal-50 flex items-center justify-center">
            <Folder size={18} className="text-signal-600" />
          </span>
          <div>
            <h1 className="text-h2 font-semibold text-ink-900">{project.name}</h1>
            <p className="text-body-sm text-ink-500">
              {project.key} · {totalTasks} task{totalTasks === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-6 lg:p-8 min-h-full">
          {TASK_STATUSES.map((s) => (
            <KanbanColumn
              key={s.value}
              status={s.value}
              label={s.label}
              projectKey={project.key}
              tasks={board?.[s.value] || []}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
