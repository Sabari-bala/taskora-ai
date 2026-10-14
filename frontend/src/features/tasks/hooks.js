import { useQuery } from '@tanstack/react-query';
import { tasksApi } from './api';

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

export function useSubtasks(parentTaskId) {
  return useQuery({
    queryKey: ['subtasks', parentTaskId],
    queryFn: () => tasksApi.subtasks(parentTaskId),
    enabled: !!parentTaskId,
    staleTime: 10_000,
  });
}
