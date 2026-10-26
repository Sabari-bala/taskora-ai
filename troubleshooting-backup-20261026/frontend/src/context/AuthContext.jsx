import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../features/auth/api';
import { refreshTokens } from '../lib/axios';
import { clearAccessToken, getAccessToken, setAccessToken } from '../lib/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { data } = await refreshTokens();
        if (cancelled) return;
        setAccessToken(data.access);
        setUser(data.user);
      } catch {
        if (cancelled) return;
        // Don't clobber tokens set by login/register while bootstrap was pending
        if (getAccessToken()) return;
        clearAccessToken();
        setUser(null);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

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
      // clear local state regardless
    }
    clearAccessToken();
    setUser(null);
  }, []);

  /* Re-fetch the current user from the server and refresh state.
   * Used after email change, profile update, or when Settings mounts. */
  const refreshUser = useCallback(async () => {
    try {
      const fresh = await authApi.me();
      setUser(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isBootstrapping, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
