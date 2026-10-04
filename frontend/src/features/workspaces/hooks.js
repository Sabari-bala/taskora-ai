import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workspacesApi } from './api';

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: workspacesApi.list,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: workspacesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workspaces'] }),
  });
}
