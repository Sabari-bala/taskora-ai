import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../features/auth/api';
import { clearAccessToken, setAccessToken } from '../lib/storage';

export const AuthContext = createContext(null);

/**
 * AuthProvider — single source of truth for "who is logged in".
 *
 * Boot sequence:
 *   1. Try POST /auth/refresh/ (refresh cookie is HttpOnly, so this works
 *      even on hard refresh when the access token was lost)
 *   2. If it succeeds, we get a fresh access token + user, and the app renders
 *   3. If it fails, we render the app as "logged out"
 *
 * The user is only "loading" during that brief boot check.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  /* ── Silent refresh on mount ─────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const data = await authApi.refresh();
        if (cancelled) return;
        setAccessToken(data.access);
        setUser(data.user);
      } catch {
        if (!cancelled) {
          clearAccessToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  /* ── Actions ─────────────────────────────────── */

  const login = useCallback(async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    setAccessToken(data.access);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ email, full_name, password }) => {
    const data = await authApi.register({ email, full_name, password });
    setAccessToken(data.access);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server call fails, we still clear local state.
    }
    clearAccessToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      register,
      logout,
    }),
    [user, isBootstrapping, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
