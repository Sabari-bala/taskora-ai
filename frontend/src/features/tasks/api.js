import api from '../../lib/axios';

export const tasksApi = {
  list: (params = {}) =>
    api.get('/tasks/', { params }).then((r) => r.data),
  get: (id) => api.get(`/tasks/${id}/`).then((r) => r.data),
  create: (data) => api.post('/tasks/', data).then((r) => r.data),
  update: (id, data) => api.patch(`/tasks/${id}/`, data).then((r) => r.data),
  reorder: (id, payload) =>
    api.post(`/tasks/${id}/reorder/`, payload).then((r) => r.data),
  activity: (id) =>
    api.get(`/tasks/${id}/activity/`).then((r) => r.data),
  comments: (id) =>
    api.get(`/tasks/${id}/comments/`).then((r) => r.data),
  addComment: (id, body) =>
    api.post(`/tasks/${id}/comments/`, { body }).then((r) => r.data),
};
