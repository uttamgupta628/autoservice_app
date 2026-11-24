import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, loadToken, saveToken, setUnauthorizedHandler } from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(async () => {
    await saveToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    (async () => {
      const t = await loadToken();
      if (t) {
        try {
          await refresh();
        } catch {
          await saveToken(null);
        }
      }
      setReady(true);
    })();
  }, [logout, refresh]);

  const value = useMemo(
    () => ({
      user,
      ready,
      refresh,
      logout,
      login: async (identifier, password) => {
        const { data } = await api.post('/auth/login', { identifier, password });
        if (data.user.role === 'admin') throw new Error('Admins sign in on the web admin panel');
        await saveToken(data.token);
        setUser(data.user);
        return data.user;
      },
      register: async (form) => {
        const { data } = await api.post('/auth/register', form);
        await saveToken(data.token);
        setUser(data.user);
        return data.user;
      },
    }),
    [user, ready, refresh, logout]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const homeFor = (user) => (user ? (user.role === 'mechanic' ? '/(mechanic)/home' : '/(owner)/home') : '/(auth)/login');
