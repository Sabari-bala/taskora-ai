import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ChevronLeft, Folder } from 'lucide-react';
import { useProject, useBoard } from './hooks';
import { useCreateTask, useReorderTask } from '../tasks/mutations';
import { KanbanColumn } from '../../components/tasks/KanbanColumn';
import { TaskCard } from '../../components/tasks/TaskCard';
import { TaskCreateModal } from '../../components/tasks/TaskCreateModal';
import { TaskDetailDrawer } from '../../components/tasks/TaskDetailDrawer';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { TASK_STATUSES } from '../../lib/constants';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const toast = useToast();

  const { data: project, isLoading: loadingProject, error: projectError, refetch: refetchProject } = useProject(id);
  const { data: board, isLoading: loadingBoard, error: boardError, refetch: refetchBoard } = useBoard(id);
  const reorderMutation = useReorderTask(id);
  const createMutation = useCreateTask(id);

  const [activeTask, setActiveTask] = useState(null);
  const [createModal, setCreateModal] = useState({ open: false, status: 'backlog' });
  const [detailTaskId, setDetailTaskId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (loadingProject || loadingBoard) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-3 overflow-x-auto">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton.KanbanColumn key={i} />)}
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

  function handleDragStart(event) {
    const flat = Object.values(board).flat();
    setActiveTask(flat.find((t) => t.id === event.active.id) || null);
  }

  function handleDragEnd(event) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;
    if (!TASK_STATUSES.some((s) => s.value === newStatus)) return;

    let currentStatus = null;
    Object.entries(board).forEach(([k, list]) => {
      if (list.some((t) => t.id === taskId)) currentStatus = k;
    });
    if (currentStatus === newStatus) return;

    const targetLength = board[newStatus]?.length || 0;
    reorderMutation.mutate(
      { id: taskId, status: newStatus, position: targetLength },
      {
        onError: () => toast('Could not move task. Reverted.', { variant: 'error' }),
      }
    );
  }

  async function handleCreateTask(data) {
    try {
      await createMutation.mutateAsync({ project: id, ...data });
      toast('Task created', { variant: 'success' });
      setCreateModal({ open: false, status: 'backlog' });
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Could not create task.';
      toast(detail, { variant: 'error' });
    }
  }

  const totalTasks = Object.values(board || {}).reduce((sum, l) => sum + l.length, 0);

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 p-6 lg:p-8 min-h-full">
            {TASK_STATUSES.map((s) => (
              <KanbanColumn
                key={s.value}
                status={s.value}
                label={s.label}
                projectKey={project.key}
                tasks={board?.[s.value] || []}
                onTaskClick={(task) => setDetailTaskId(task.id)}
                onAddClick={() => setCreateModal({ open: true, status: s.value })}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="w-[300px]">
              <TaskCard task={activeTask} projectKey={project.key} overlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskCreateModal
        open={createModal.open}
        onOpenChange={(open) => setCreateModal({ ...createModal, open })}
        status={createModal.status}
        onSubmit={handleCreateTask}
        isSubmitting={createMutation.isPending}
      />

      <TaskDetailDrawer
        taskId={detailTaskId}
        open={!!detailTaskId}
        onOpenChange={(open) => { if (!open) setDetailTaskId(null); }}
      />
    </div>
  );
}
