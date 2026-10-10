import api from '../../lib/axios';

export const notificationsApi = {
  list: (params = {}) =>
    api.get('/notifications/', { params }).then((r) => r.data),
  unreadCount: () =>
    api.get('/notifications/unread-count/').then((r) => r.data),
  markRead: (id) =>
    api.post(`/notifications/${id}/read/`).then((r) => r.data),
  markAllRead: () =>
    api.post('/notifications/read-all/').then((r) => r.data),
};
