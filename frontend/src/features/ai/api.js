import api from '../../lib/axios';

export const aiApi = {
  planProject: (data) =>
    api.post('/ai/plan-project/', data).then((r) => r.data),
  commitPlan: (data) =>
    api.post('/ai/plan-project/commit/', data).then((r) => r.data),
  breakdownTask: (taskId) =>
    api.post('/ai/breakdown-task/', { task_id: taskId }).then((r) => r.data),
  summarizeTask: (taskId) =>
    api.post('/ai/summarize-task/', { task_id: taskId }).then((r) => r.data),
  projectInsights: (projectId) =>
    api.get(`/ai/project-insights/?project=${projectId}`).then((r) => r.data),
};
