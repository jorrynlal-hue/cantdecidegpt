'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, Me } from '@/lib/core/client';

interface SessionState {
  me: Me | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  switchWorkspace: (id: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SessionCtx = createContext<SessionState>({
  me: null,
  loading: true,
  error: null,
  refresh: async () => {},
  switchWorkspace: async () => {},
  logout: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await auth.me();
      setMe(data);
      setError(null);
    } catch (e) {
      setMe(null);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    auth
      .me()
      .then((data) => {
        setMe(data);
        setError(null);
      })
      .catch((e) => {
        setMe(null);
        setError((e as Error).message);
      })
      .finally(() => setLoading(false));
  }, []);

  const switchWorkspace = useCallback(
    async (id: string) => {
      await auth.switchWorkspace(id);
      await refresh();
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await auth.logout();
    } finally {
      setMe(null);
      setLoading(false);
      window.location.href = '/login';
    }
  }, []);

  return (
    <SessionCtx.Provider value={{ me, loading, error, refresh, switchWorkspace, logout }}>{children}</SessionCtx.Provider>
  );
}

export function useSession(): SessionState {
  return useContext(SessionCtx);
}