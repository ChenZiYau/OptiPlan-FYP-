import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';

interface AdminRefreshContextValue {
  register: (fn: () => Promise<void> | void) => () => void;
  refresh: () => Promise<void>;
  refreshing: boolean;
}

const AdminRefreshContext = createContext<AdminRefreshContextValue | null>(null);

export function AdminRefreshProvider({ children }: { children: React.ReactNode }) {
  const fnsRef = useRef<Set<() => Promise<void> | void>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const register = useCallback((fn: () => Promise<void> | void) => {
    fnsRef.current.add(fn);
    return () => { fnsRef.current.delete(fn); };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([...fnsRef.current].map(fn => fn()));
    setRefreshing(false);
  }, []);

  return (
    <AdminRefreshContext.Provider value={{ register, refresh, refreshing }}>
      {children}
    </AdminRefreshContext.Provider>
  );
}

/** Pages call this hook to register their refetch functions. Cleanup runs on unmount. */
export function useAdminRefresh(...fns: (() => Promise<void> | void)[]) {
  const ctx = useContext(AdminRefreshContext);
  if (!ctx) throw new Error('useAdminRefresh must be used within AdminRefreshProvider');

  // Stable ref so we don't re-register on every render
  const fnsRef = useRef(fns);
  fnsRef.current = fns;

  useEffect(() => {
    const cleanups = fnsRef.current.map(fn => ctx.register(fn));
    return () => cleanups.forEach(cleanup => cleanup());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Header uses this to get the refresh trigger and loading state */
export function useAdminRefreshButton() {
  const ctx = useContext(AdminRefreshContext);
  if (!ctx) throw new Error('useAdminRefreshButton must be used within AdminRefreshProvider');
  return { refresh: ctx.refresh, refreshing: ctx.refreshing };
}
