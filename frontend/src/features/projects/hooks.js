import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useMilestones(projectId) {
  return useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => projectsApi.milestones(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
  });
}

export function useCreateMilestone(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => projectsApi.createMilestone(projectId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
  });
}

export function useUpdateMilestone(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      projectsApi.updateMilestone(projectId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
  });
}

export function useDeleteMilestone(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => projectsApi.deleteMilestone(projectId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', projectId] });
    },
  });
}
