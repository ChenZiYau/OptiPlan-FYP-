import { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGamificationData } from '@/hooks/useGamification';
import type { GamificationHookData } from '@/hooks/useGamification';
import { useDashboard } from '@/contexts/DashboardContext';
import type { Importance, ItemType } from '@/types/dashboard';

const GamificationContext = createContext<GamificationHookData | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const data = useGamificationData();
  const { onTaskStatusChange } = useDashboard();

  // Keep a stable ref to awardXP/revokeXP so the callback doesn't go stale
  const actionsRef = useRef(data);
  actionsRef.current = data;

  useEffect(() => {
    if (!onTaskStatusChange) return;

    onTaskStatusChange.current = (
      taskId: string,
      oldStatus: string,
      newStatus: string,
      _importance: Importance,
      itemType: ItemType,
    ) => {
      if (newStatus === 'completed' && oldStatus !== 'completed') {
        actionsRef.current.awardXP(taskId, itemType);
      } else if (oldStatus === 'completed' && newStatus !== 'completed') {
        actionsRef.current.revokeXP(taskId);
      }
    };

    return () => {
      onTaskStatusChange.current = null;
    };
  }, [onTaskStatusChange]);

  return (
    <GamificationContext.Provider value={data}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification(): GamificationHookData {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider');
  return ctx;
}
