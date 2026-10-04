import api from '../../lib/axios';

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary/').then((r) => r.data),
  activity: () => api.get('/dashboard/activity/').then((r) => r.data),
  myTasks: () => api.get('/dashboard/my-tasks/').then((r) => r.data),
};
