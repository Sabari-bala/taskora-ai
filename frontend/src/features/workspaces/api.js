import api from '../../lib/axios';

export const workspacesApi = {
  list:   () => api.get('/workspaces/').then((r) => r.data),
  get:    (id) => api.get(`/workspaces/${id}/`).then((r) => r.data),
  create: (data) => api.post('/workspaces/', data).then((r) => r.data),
  update: (id, data) => api.patch(`/workspaces/${id}/`, data).then((r) => r.data),
  members:(id) => api.get(`/workspaces/${id}/members/`).then((r) => r.data),
  invite: (id, data) => api.post(`/workspaces/${id}/members/`, data).then((r) => r.data),
};
