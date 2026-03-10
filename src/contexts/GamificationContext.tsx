import { createContext, useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGamificationData } from '@/hooks/useGamification';
import type { GamificationHookData } from '@/hooks/useGamification';
import { useDashboard } from '@/contexts/DashboardContext';
import type { Importance, ItemType } from '@/types/dashboard';

const GamificationContext = createContext<GamificationHookData | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const data = useGamificationData();
  const { onTaskStatusChange, onItemCreate, onItemDelete } = useDashboard();

  // Keep a stable ref so callbacks don't go stale
  const actionsRef = useRef(data);
  actionsRef.current = data;

  // ── Wire task status changes (complete / uncomplete) ───────────────────
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

    return () => { onTaskStatusChange.current = null; };
  }, [onTaskStatusChange]);

  // ── Wire item creation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!onItemCreate) return;

    onItemCreate.current = (taskId: string, itemType: ItemType, descWordCount: number) => {
      actionsRef.current.handleItemCreate(taskId, itemType, descWordCount);
    };

    return () => { onItemCreate.current = null; };
  }, [onItemCreate]);

  // ── Wire item deletion ─────────────────────────────────────────────────
  useEffect(() => {
    if (!onItemDelete) return;

    onItemDelete.current = (taskId: string) => {
      actionsRef.current.handleItemDelete(taskId);
    };

    return () => { onItemDelete.current = null; };
  }, [onItemDelete]);

  // ── Trigger daily login XP on mount ────────────────────────────────────
  const loginTriggered = useRef(false);
  useEffect(() => {
    if (data.loading || loginTriggered.current) return;
    loginTriggered.current = true;
    data.handleDailyLogin();
  }, [data.loading, data.handleDailyLogin]);

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
