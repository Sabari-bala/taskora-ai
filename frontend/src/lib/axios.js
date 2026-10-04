import axios from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/* ─── Request: attach the access token ───────────────────── */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ─── Response: on 401, refresh once and retry ─────────────
 *
 * We queue concurrent 401s so we don't fire five refresh calls
 * at once. `refreshPromise` is shared by all in-flight requests.
 */
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Anything that isn't a 401, or a retried request, passes through.
    if (status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Don't loop on the refresh endpoint itself.
    const url = original.url || '';
    if (url.includes('/auth/refresh/') || url.includes('/auth/login/')) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api
          .post('/auth/refresh/')
          .finally(() => { refreshPromise = null; });
      }

      const { data } = await refreshPromise;
      setAccessToken(data.access);
      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch (refreshError) {
      clearAccessToken();
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;
