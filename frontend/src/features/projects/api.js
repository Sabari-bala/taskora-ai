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

  // Milestones
  milestones: (id) =>
    api.get(`/projects/${id}/milestones/`).then((r) => r.data),
  createMilestone: (id, data) =>
    api.post(`/projects/${id}/milestones/`, data).then((r) => r.data),
  updateMilestone: (projectId, milestoneId, data) =>
    api
      .patch(`/projects/${projectId}/milestones/${milestoneId}/`, data)
      .then((r) => r.data),
  deleteMilestone: (projectId, milestoneId) =>
    api
      .delete(`/projects/${projectId}/milestones/${milestoneId}/`)
      .then((r) => r.data),
};
