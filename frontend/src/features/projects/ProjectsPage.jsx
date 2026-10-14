import { useState } from 'react';
import { Folder, Sparkles, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useProjects } from './hooks';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { PlannerModal } from '../ai/PlannerModal';
import { NewProjectModal } from './NewProjectModal';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { current } = useWorkspace();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useProjects(
    current ? { workspace: current.id, page } : { page }
  );
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const projects = data?.results || [];
  const count = data?.count || 0;
  const pageSize = 20;

  if (!current) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <EmptyState
          icon={Folder}
          title="No workspace selected"
          description="Pick or create a workspace first."
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-h1 font-semibold text-ink-900">Projects</h1>
          <p className="mt-1 text-body-lg text-ink-600">
            All projects in {current.name}.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            leadingIcon={Plus}
            onClick={() => setNewOpen(true)}
          >
            New project
          </Button>
          <Button
            variant="ai"
            leadingIcon={Sparkles}
            onClick={() => setPlannerOpen(true)}
          >
            Plan with AI
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <ErrorState
            title="Could not load projects"
            description="Check that your backend is running."
            onRetry={refetch}
          />
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <EmptyState
            icon={Folder}
            title="No projects yet"
            description="Create one manually, or describe an idea and let AI structure it."
            action={
              <div className="flex gap-2">
                <Button variant="secondary" leadingIcon={Plus} onClick={() => setNewOpen(true)}>
                  New project
                </Button>
                <Button variant="ai" leadingIcon={Sparkles} onClick={() => setPlannerOpen(true)}>
                  Plan with AI
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <Pagination
            page={page}
            pageSize={pageSize}
            count={count}
            onPageChange={setPage}
          />
        </>
      )}

      <PlannerModal
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        workspaceId={current.id}
      />

      <NewProjectModal
        open={newOpen}
        onOpenChange={setNewOpen}
        workspaceId={current.id}
        onCreated={(p) => navigate(`/projects/${p.id}`)}
      />
    </div>
  );
}
