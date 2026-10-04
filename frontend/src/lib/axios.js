import axios from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './storage';

/* ─── CSRF helper ──────────────────────────────
 * Django sets a `csrftoken` cookie whenever we hit an endpoint
 * decorated with `ensure_csrf_cookie` (our login view).
 * We read it here and echo it back in the X-CSRFToken header
 * so csrf_protect on /auth/refresh/ and /auth/logout/ is satisfied.
 */
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/* ─── Request: attach access token + CSRF ────── */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) {
      config.headers['X-CSRFToken'] = csrf;
    }
  }

  return config;
});

/* ─── Response: on 401, refresh once and retry ──
 * Queue concurrent 401s so we don't fire five refresh calls at once.
 */
let refreshPromise = null;

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
