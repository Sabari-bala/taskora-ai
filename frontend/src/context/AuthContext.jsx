import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '../features/auth/api';
import { refreshTokens } from '../lib/axios';
import { clearAccessToken, setAccessToken } from '../lib/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        // Shared singleton: StrictMode's second invoke reuses the
        // first call's in-flight promise instead of racing it.
        const { data } = await refreshTokens();
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

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isBootstrapping, login, register, logout }),
    [user, isBootstrapping, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
