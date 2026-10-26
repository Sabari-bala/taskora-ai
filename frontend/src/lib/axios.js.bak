import axios from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './storage';

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/* Attach access token + CSRF header on every request */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) config.headers['X-CSRFToken'] = csrf;
  }
  return config;
});

/* ── Shared in-flight refresh promise ───────────────
 * ANY caller — the bootstrap effect, the 401 interceptor,
 * a future websocket reconnect — shares one refresh call.
 * This is what prevents StrictMode's double-invoke (and
 * any other concurrency) from racing two rotations.
 */
let refreshPromise = null;

export function refreshTokens() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh/')
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

/* On 401, refresh once and retry the original request */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const url = original.url || '';
    if (url.includes('/auth/refresh/') || url.includes('/auth/login/')) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const { data } = await refreshTokens();
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
