import { useState } from 'react';
import { Folder, Sparkles, Plus } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useProjects } from './hooks';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PlannerModal } from '../ai/PlannerModal';

export default function ProjectsPage() {
  const { current } = useWorkspace();
  const { data, isLoading, error, refetch } = useProjects(
    current ? { workspace: current.id } : {}
  );
  const [plannerOpen, setPlannerOpen] = useState(false);

  const projects = data?.results || [];

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
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-h1 font-semibold text-ink-900">Projects</h1>
          <p className="mt-1 text-body-lg text-ink-600">
            All projects in {current.name}.
          </p>
        </div>
        <Button
          variant="ai"
          leadingIcon={Sparkles}
          onClick={() => setPlannerOpen(true)}
        >
          Plan with AI
        </Button>
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
            description="Describe an idea and let AI propose the first project structure."
            action={
              <Button
                variant="ai"
                leadingIcon={Sparkles}
                onClick={() => setPlannerOpen(true)}
              >
                Plan with AI
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <PlannerModal
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        workspaceId={current.id}
      />
    </div>
  );
}
