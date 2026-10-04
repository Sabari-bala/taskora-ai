import api from '../../lib/axios';

export const projectsApi = {
  list: (params = {}) =>
    api.get('/projects/', { params }).then((r) => r.data),
  get: (id) => api.get(`/projects/${id}/`).then((r) => r.data),
  create: (data) => api.post('/projects/', data).then((r) => r.data),
  update: (id, data) => api.patch(`/projects/${id}/`, data).then((r) => r.data),
  board: (id) => api.get(`/projects/${id}/board/`).then((r) => r.data),
  analytics: (id) =>
    api.get(`/projects/${id}/analytics/`).then((r) => r.data),
  milestones: (id) =>
    api.get(`/projects/${id}/milestones/`).then((r) => r.data),
};
