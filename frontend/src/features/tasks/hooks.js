import { useQuery } from '@tanstack/react-query';
import { tasksApi } from './api';

export function useTasks(params = {}) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksApi.list(params),
  });
}

export function useTask(id) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id),
    enabled: !!id,
  });
}

export function useTaskActivity(id) {
  return useQuery({
    queryKey: ['task-activity', id],
    queryFn: () => tasksApi.activity(id),
    enabled: !!id,
  });
}

export function useTaskComments(id) {
  return useQuery({
    queryKey: ['task-comments', id],
    queryFn: () => tasksApi.comments(id),
    enabled: !!id,
  });
}
