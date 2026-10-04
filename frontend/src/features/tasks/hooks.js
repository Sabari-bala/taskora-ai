import { useQuery } from '@tanstack/react-query';
import { tasksApi } from './api';

/**
 * Task detail query.
 * `refetchOnMount: 'always'` guarantees that opening a drawer fetches the
 * latest server shape, even if the response gained new fields since the
 * last cache write. Without it, a schema change would silently serve
 * stale objects — which is exactly what bit the assignee picker.
 */
export function useTask(id) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useTasks(params = {}) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksApi.list(params),
  });
}

export function useTaskActivity(id) {
  return useQuery({
    queryKey: ['task-activity', id],
    queryFn: () => tasksApi.activity(id),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useTaskComments(id) {
  return useQuery({
    queryKey: ['task-comments', id],
    queryFn: () => tasksApi.comments(id),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
