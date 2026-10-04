import { createContext, useEffect, useMemo, useState } from 'react';
import { useWorkspaces } from '../features/workspaces/hooks';

export const WorkspaceContext = createContext(null);

const STORAGE_KEY = 'taskora.selected_workspace';

export function WorkspaceProvider({ children }) {
  const { data, isLoading } = useWorkspaces();
  const workspaces = data?.results || [];

  const [selectedId, setSelectedId] = useState(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  useEffect(() => {
    if (workspaces.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const stillValid = workspaces.some((w) => w.id === selectedId);
    if (!stillValid) {
      setSelectedId(workspaces[0].id);
      localStorage.setItem(STORAGE_KEY, workspaces[0].id);
    }
  }, [workspaces, selectedId]);

  const select = (id) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const current = workspaces.find((w) => w.id === selectedId) || null;

  const value = useMemo(
    () => ({ workspaces, current, selectedId, select, isLoading }),
    [workspaces, current, selectedId, isLoading]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
