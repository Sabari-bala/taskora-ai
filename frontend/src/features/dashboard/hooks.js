import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.summary,
    staleTime: 10_000,
  });
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: dashboardApi.activity,
    staleTime: 10_000,
  });
}

export function useDashboardMyTasks() {
  return useQuery({
    queryKey: ['dashboard', 'my-tasks'],
    queryFn: dashboardApi.myTasks,
    staleTime: 10_000,
  });
}
