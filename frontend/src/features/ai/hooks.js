import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from './api';

export function usePlanProject() {
  return useMutation({
    mutationFn: (data) => aiApi.planProject(data),
  });
}

export function useCommitPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => aiApi.commitPlan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useProjectInsights(projectId) {
  return useQuery({
    queryKey: ['ai-insights', projectId],
    queryFn: () => aiApi.projectInsights(projectId),
    enabled: false,
    staleTime: 60_000,
  });
}

export function useBreakdownTask() {
  return useMutation({
    mutationFn: (taskId) => aiApi.breakdownTask(taskId),
  });
}

export function useSummarizeTask() {
  return useMutation({
    mutationFn: (taskId) => aiApi.summarizeTask(taskId),
  });
}
