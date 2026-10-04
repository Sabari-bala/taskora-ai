import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from './api';

export function useReorderTask(projectId) {
  const qc = useQueryClient();
  const key = ['board', projectId];

  return useMutation({
    mutationFn: ({ id, status, position }) =>
      tasksApi.reorder(id, { status, position }),

    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);

      qc.setQueryData(key, (old) => {
        if (!old) return old;
        const task = Object.values(old).flat().find((t) => t.id === id);
        if (!task) return old;

        const next = { ...old };
        Object.keys(next).forEach((k) => {
          next[k] = next[k].filter((t) => t.id !== id);
        });
        next[status] = [...(next[status] || []), { ...task, status }];
        return next;
      });

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useCreateTask(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => tasksApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => tasksApi.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['task', vars.id] });
      qc.invalidateQueries({ queryKey: ['task-activity', vars.id] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => tasksApi.update(id, { status: 'backlog' }) && null,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useAddComment(taskId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => tasksApi.addComment(taskId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-comments', taskId] });
      qc.invalidateQueries({ queryKey: ['task-activity', taskId] });
    },
  });
}
