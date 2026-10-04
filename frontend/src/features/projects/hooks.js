import { useQuery } from '@tanstack/react-query';
import { projectsApi } from './api';

export function useProjects(params = {}) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsApi.list(params),
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  });
}

export function useBoard(id) {
  return useQuery({
    queryKey: ['board', id],
    queryFn: () => projectsApi.board(id),
    enabled: !!id,
  });
}
