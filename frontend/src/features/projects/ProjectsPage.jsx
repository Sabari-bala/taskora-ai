import { Folder } from 'lucide-react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { useProjects } from './hooks';
import { ProjectCard } from '../../components/projects/ProjectCard';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

export default function ProjectsPage() {
  const { current } = useWorkspace();
  const { data, isLoading, error, refetch } = useProjects(
    current ? { workspace: current.id } : {}
  );

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
      <div className="mb-8">
        <h1 className="text-h1 font-semibold text-ink-900">Projects</h1>
        <p className="mt-1 text-body-lg text-ink-600">
          All projects in {current.name}.
        </p>
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
            description="Create your first project to get started. (Project creation UI lands in the next block.)"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
