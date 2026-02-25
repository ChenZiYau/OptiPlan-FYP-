import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { uuid } from '@/lib/utils';
import { toast } from 'sonner';
import {
  XP_REWARDS,
  STREAK_BONUS,
  DAILY_GOAL_BONUS,
  DAILY_GOAL_TASK_COUNT,
  getLevelFromXP,
  ACHIEVEMENTS,
} from '@/types/gamification';
import type {
  ItemType,
} from '@/types/dashboard';
import type {
  XPHistoryEntry,
  UnlockedAchievement,
  GamificationData,
  GamificationState,
} from '@/types/gamification';

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ── Hook Return Type ─────────────────────────────────────────────────────────

export interface GamificationHookData extends GamificationData {
  loading: boolean;
  pendingLevelUp: number | null;
  dismissLevelUp: () => void;
  awardXP: (taskId: string, itemType: ItemType) => Promise<void>;
  revokeXP: (taskId: string) => Promise<void>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useGamificationData(): GamificationHookData {
  const { user } = useAuth();
  const [totalXP, setTotalXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [xpHistory, setXpHistory] = useState<XPHistoryEntry[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLevelUp, setPendingLevelUp] = useState<number | null>(null);

  // Ref for latest state to avoid stale closures
  const stateRef = useRef({ totalXP, level, streak, lastActiveDate, xpHistory, unlockedAchievements });
  stateRef.current = { totalXP, level, streak, lastActiveDate, xpHistory, unlockedAchievements };

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!user) {
      setTotalXP(0);
      setLevel(1);
      setStreak(0);
      setLastActiveDate(null);
      setXpHistory([]);
      setUnlockedAchievements([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const [xpRes, historyRes, achievementsRes] = await Promise.all([
      supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('xp_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id),
    ]);

    if (xpRes.data) {
      setTotalXP(xpRes.data.total_xp ?? 0);
      setLevel(xpRes.data.level ?? 1);
      setStreak(xpRes.data.streak ?? 0);
      setLastActiveDate(xpRes.data.last_active_date ?? null);
    }
    if (historyRes.data) setXpHistory(historyRes.data);
    if (achievementsRes.data) setUnlockedAchievements(achievementsRes.data);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Award XP ─────────────────────────────────────────────────────────────

  const awardXP = useCallback(async (taskId: string, itemType: ItemType) => {
    if (!user) return;

    const s = stateRef.current;

    // Deduplication: check if we already awarded XP for this task
    const alreadyAwarded = s.xpHistory.some(
      (h) => h.task_id === taskId && h.reason === 'task_complete' && h.amount > 0,
    );
    if (alreadyAwarded) return;

    // Calculate base XP by item type
    const baseXP = XP_REWARDS[itemType] ?? 15;
    let totalAwarded = baseXP;
    const entries: { amount: number; reason: string; task_id: string | null }[] = [
      { amount: baseXP, reason: 'task_complete', task_id: taskId },
    ];

    // Streak calculation
    const today = todayISO();
    const yesterday = yesterdayISO();
    let newStreak = s.streak;
    let newLastActive = s.lastActiveDate;

    if (s.lastActiveDate !== today) {
      // First task of the day
      if (s.lastActiveDate === yesterday) {
        newStreak = s.streak + 1;
      } else if (s.lastActiveDate !== today) {
        newStreak = 1;
      }
      newLastActive = today;

      // Streak bonus
      if (newStreak >= 2) {
        entries.push({ amount: STREAK_BONUS, reason: 'streak_bonus', task_id: null });
        totalAwarded += STREAK_BONUS;
      }
    }

    // Daily goal check: count today's task_complete entries (positive only)
    const todayTasks = s.xpHistory.filter(
      (h) => h.reason === 'task_complete' && h.amount > 0 && h.created_at.startsWith(today),
    ).length;
    // +1 for the current task being awarded
    const newDailyCount = todayTasks + 1;

    // Award daily goal bonus exactly when hitting the threshold
    if (newDailyCount === DAILY_GOAL_TASK_COUNT) {
      entries.push({ amount: DAILY_GOAL_BONUS, reason: 'daily_goal', task_id: null });
      totalAwarded += DAILY_GOAL_BONUS;
    }

    // Calculate new totals
    const newTotalXP = s.totalXP + totalAwarded;
    const newLevel = getLevelFromXP(newTotalXP);
    const leveledUp = newLevel > s.level;

    // Optimistic update
    setTotalXP(newTotalXP);
    setLevel(newLevel);
    setStreak(newStreak);
    setLastActiveDate(newLastActive);

    const optimisticEntries: XPHistoryEntry[] = entries.map((e) => ({
      id: uuid(),
      user_id: user.id,
      amount: e.amount,
      reason: e.reason,
      task_id: e.task_id,
      created_at: new Date().toISOString(),
    }));
    setXpHistory((prev) => [...optimisticEntries, ...prev].slice(0, 50));

    // Toast
    const typeLabel = itemType === 'study' ? 'Study' : itemType === 'event' ? 'Event' : 'Task';
    const parts = [`+${baseXP} XP (${typeLabel})`];
    if (entries.some((e) => e.reason === 'streak_bonus')) parts.push(`+${STREAK_BONUS} streak`);
    if (entries.some((e) => e.reason === 'daily_goal')) parts.push(`+${DAILY_GOAL_BONUS} daily goal!`);
    toast.success(parts.join(' | '), { duration: 3000 });

    if (leveledUp) {
      setPendingLevelUp(newLevel);
    }

    // Persist to Supabase
    const historyRows = entries.map((e) => ({
      user_id: user.id,
      amount: e.amount,
      reason: e.reason,
      task_id: e.task_id,
    }));

    const [histErr] = await Promise.all([
      supabase.from('xp_history').insert(historyRows),
      supabase.from('user_xp').upsert(
        {
          user_id: user.id,
          total_xp: newTotalXP,
          level: newLevel,
          streak: newStreak,
          last_active_date: newLastActive,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      ),
    ]);

    if (histErr.error) {
      // Rollback on failure
      setTotalXP(s.totalXP);
      setLevel(s.level);
      setStreak(s.streak);
      setLastActiveDate(s.lastActiveDate);
      setXpHistory(s.xpHistory);
      return;
    }

    // Check achievements
    const hasTask = itemType === 'task' || s.xpHistory.some(
      (h) => h.reason === 'task_complete' && h.amount === XP_REWARDS.task,
    );
    const hasEvent = itemType === 'event' || s.xpHistory.some(
      (h) => h.reason === 'task_complete' && h.amount === XP_REWARDS.event,
    );
    const hasStudy = itemType === 'study' || s.xpHistory.some(
      (h) => h.reason === 'task_complete' && h.amount === XP_REWARDS.study,
    );

    const achievementState: GamificationState = {
      totalXP: newTotalXP,
      level: newLevel,
      streak: newStreak,
      totalTasksCompleted: s.xpHistory.filter(
        (h) => h.reason === 'task_complete' && h.amount > 0,
      ).length + 1,
      dailyTasksCompleted: newDailyCount,
      hasCompletedTask: hasTask,
      hasCompletedEventTask: hasEvent,
      hasCompletedStudyTask: hasStudy,
    };
    await checkAchievements(achievementState, user.id, s.unlockedAchievements);
  }, [user]);

  // ── Revoke XP ────────────────────────────────────────────────────────────

  const revokeXP = useCallback(async (taskId: string) => {
    if (!user) return;

    const s = stateRef.current;

    // Find all positive history entries for this task
    const taskEntries = s.xpHistory.filter(
      (h) => h.task_id === taskId && h.reason === 'task_complete' && h.amount > 0,
    );
    if (taskEntries.length === 0) return;

    const revokeAmount = taskEntries.reduce((sum, e) => sum + e.amount, 0);
    const newTotalXP = Math.max(0, s.totalXP - revokeAmount);
    const newLevel = getLevelFromXP(newTotalXP);

    // Optimistic update
    setTotalXP(newTotalXP);
    setLevel(newLevel);

    const negativeEntry: XPHistoryEntry = {
      id: uuid(),
      user_id: user.id,
      amount: -revokeAmount,
      reason: 'task_revoked',
      task_id: taskId,
      created_at: new Date().toISOString(),
    };
    setXpHistory((prev) => [negativeEntry, ...prev].slice(0, 50));

    toast.info(`-${revokeAmount} XP (task uncompleted)`, { duration: 2000 });

    // Persist
    const [histErr] = await Promise.all([
      supabase.from('xp_history').insert({
        user_id: user.id,
        amount: -revokeAmount,
        reason: 'task_revoked',
        task_id: taskId,
      }),
      supabase.from('user_xp').upsert(
        {
          user_id: user.id,
          total_xp: newTotalXP,
          level: newLevel,
          streak: s.streak,
          last_active_date: s.lastActiveDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      ),
    ]);

    if (histErr.error) {
      setTotalXP(s.totalXP);
      setLevel(s.level);
      setXpHistory(s.xpHistory);
    }
  }, [user]);

  // ── Check Achievements ───────────────────────────────────────────────────

  const checkAchievements = useCallback(
    async (state: GamificationState, userId: string, current: UnlockedAchievement[]) => {
      const currentIds = new Set(current.map((a) => a.achievement_id));
      const newlyUnlocked: { achievement_id: string; title: string; icon: string }[] = [];

      for (const def of ACHIEVEMENTS) {
        if (currentIds.has(def.id)) continue;
        if (def.condition(state)) {
          newlyUnlocked.push({ achievement_id: def.id, title: def.title, icon: def.icon });
        }
      }

      if (newlyUnlocked.length === 0) return;

      // Insert into Supabase
      const rows = newlyUnlocked.map((a) => ({
        user_id: userId,
        achievement_id: a.achievement_id,
      }));

      const { data } = await supabase.from('user_achievements').insert(rows).select();

      if (data) {
        setUnlockedAchievements((prev) => [...prev, ...data]);
      }

      // Toast each achievement
      for (const a of newlyUnlocked) {
        toast.success(`${a.icon} Achievement Unlocked: ${a.title}`, { duration: 4000 });
      }
    },
    [],
  );

  const dismissLevelUp = useCallback(() => setPendingLevelUp(null), []);

  return {
    totalXP,
    level,
    streak,
    lastActiveDate,
    xpHistory,
    unlockedAchievements,
    loading,
    pendingLevelUp,
    dismissLevelUp,
    awardXP,
    revokeXP,
  };
}
