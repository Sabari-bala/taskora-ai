import { useQuery } from '@tanstack/react-query';
import { workspacesApi } from './api';

export function useWorkspaceMembers(workspaceId) {
  return useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => workspacesApi.members(workspaceId),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}
