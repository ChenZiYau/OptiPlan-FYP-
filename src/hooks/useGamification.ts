import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { uuid } from '@/lib/utils';
import { toast } from 'sonner';
import { ACHIEVEMENTS } from '@/constants/achievements';
import {
  XP_ACTIONS,
  DAILY_GOAL_BONUS,
  DAILY_GOAL_TASK_COUNT,
  getLevelFromXP,
} from '@/types/gamification';
import type { ItemType } from '@/types/dashboard';
import type {
  XPHistoryEntry,
  UnlockedAchievement,
  GamificationData,
  GamificationStats,
  GamificationBroadcast,
} from '@/types/gamification';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's date in YYYY-MM-DD using the user's local timezone */
function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Returns yesterday's date in YYYY-MM-DD using the user's local timezone */
function yesterdayLocal() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Check if an ISO timestamp falls on a given local date */
function isOnLocalDate(isoTimestamp: string, localDate: string): boolean {
  const d = new Date(isoTimestamp);
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return local === localDate;
}

// ── BroadcastChannel for cross-tab sync ──────────────────────────────────────

let broadcastChannel: BroadcastChannel | null = null;
function getBroadcastChannel(): BroadcastChannel | null {
  try {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
    if (!broadcastChannel) {
      broadcastChannel = new BroadcastChannel('optiplan-gamification');
    }
    return broadcastChannel;
  } catch {
    return null;
  }
}

// ── Hook Return Type ─────────────────────────────────────────────────────────

export interface GamificationHookData extends GamificationData {
  loading: boolean;
  pendingLevelUp: number | null;
  dismissLevelUp: () => void;
  awardXP: (taskId: string, itemType: ItemType) => Promise<void>;
  revokeXP: (taskId: string) => Promise<void>;
  handleItemCreate: (taskId: string, itemType: ItemType, descWordCount: number) => Promise<void>;
  handleItemDelete: (taskId: string) => Promise<void>;
  handleDailyLogin: () => Promise<void>;
  runFullAchievementCheck: () => Promise<void>;
  stats: GamificationStats | null;
}

// ── Default Stats ────────────────────────────────────────────────────────────

function defaultStats(): GamificationStats {
  return {
    totalXP: 0, level: 1, streak: 0,
    totalItemsCompleted: 0, totalTasksCompleted: 0, totalEventsCompleted: 0,
    totalStudyCompleted: 0, totalItemsCreated: 0, totalEventsCreated: 0,
    totalItemsDeleted: 0, dailyItemsCompleted: 0, dailyStudyCompleted: 0,
    inProgressCount: 0, todoCount: 0, uniqueTaskDates: 0,
    hasSpeedCompletion: false, hasEarlyBirdCompletion: false,
    hasNightOwlCompletion: false, hasClutchCompletion: false,
    hasLunchCompletion: false, hasWeekendCompletion: false, hasLongDescription: false,
    morningCompletions: 0, nightCompletions: 0,
    hasCompletedTaskType: false, hasCompletedEventType: false, hasCompletedStudyType: false,
    notebooksCreated: 0, sourcesUploaded: 0, flashcardsCreated: 0,
    flashcardsMastered: 0, quizQuestionsCount: 0, generatedNotesCount: 0,
    mindMapsCount: 0, notebookChatCount: 0,
    transactionsLogged: 0, budgetsSet: 0, hasMonthlyBudget: false, hasIncomeSetup: false,
    groupsJoined: 0, friendsCount: 0, groupMessagesCount: 0, linksSharedCount: 0,
    scheduleEntriesCount: 0,
    hasVisitedWellness: false, journalEntriesCount: 0, habitsCreated: 0, habitTrackingDays: 0,
    unlockedCount: 0, uniqueActiveDays: 0,
  };
}

// ── Compute Core Stats ───────────────────────────────────────────────────────

async function computeCoreStats(userId: string): Promise<Partial<GamificationStats>> {
  const today = todayLocal();

  const [itemsRes, historyRes, schedulesRes] = await Promise.all([
    supabase
      .from('dashboard_items')
      .select('id, type, status, date, description, created_at')
      .eq('user_id', userId),
    supabase
      .from('xp_history')
      .select('id, amount, reason, task_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('schedule_entries')
      .select('id')
      .eq('user_id', userId),
  ]);

  const items = itemsRes.data ?? [];
  const history = historyRes.data ?? [];

  const completed = items.filter((i) => i.status === 'completed');

  // Count today's completions using local timezone comparison
  const todayCompletionCount = history.filter(
    (h) => h.reason === 'task_complete' && h.amount > 0 && isOnLocalDate(h.created_at, today),
  ).length;

  // Study-specific: find completed study item IDs, then count today's study completions
  const studyItemIds = new Set(
    items.filter((i) => i.type === 'study' && i.status === 'completed').map((i) => i.id),
  );
  const dailyStudyCount = history.filter(
    (h) =>
      h.reason === 'task_complete' &&
      h.amount > 0 &&
      isOnLocalDate(h.created_at, today) &&
      h.task_id &&
      studyItemIds.has(h.task_id),
  ).length;

  // Unique task dates
  const dateSet = new Set(items.map((i) => i.date).filter(Boolean));

  // Unique active days from xp_history (local timezone)
  const activeDaySet = new Set(
    history.filter((h) => h.amount > 0).map((h) => {
      const d = new Date(h.created_at);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }),
  );

  // Time-based completions from xp_history
  let morningCount = 0;
  let nightCount = 0;
  let hasEarlyBird = false;
  let hasNightOwl = false;
  let hasLunch = false;
  let hasWeekend = false;

  const completionEntries = history.filter((h) => h.reason === 'task_complete' && h.amount > 0);
  for (const entry of completionEntries) {
    const d = new Date(entry.created_at);
    const hour = d.getHours();
    const day = d.getDay(); // 0=Sun, 6=Sat

    if (hour < 7) hasEarlyBird = true;
    if (hour >= 23) hasNightOwl = true;
    if (hour >= 12 && hour < 13) hasLunch = true;
    if (hour < 9) morningCount++;
    if (hour >= 21) nightCount++;
    if (day === 0 || day === 6) hasWeekend = true;
  }

  // Speed completion check: task completed within 1 hour of creation
  let hasSpeedCompletion = false;
  for (const entry of completionEntries) {
    if (!entry.task_id) continue;
    const item = items.find((i) => i.id === entry.task_id);
    if (!item?.created_at) continue;
    const diff = new Date(entry.created_at).getTime() - new Date(item.created_at).getTime();
    if (diff > 0 && diff < 3600000) {
      hasSpeedCompletion = true;
      break;
    }
  }

  // Clutch: completed on its due date
  let hasClutchCompletion = false;
  for (const entry of completionEntries) {
    if (!entry.task_id) continue;
    const item = items.find((i) => i.id === entry.task_id);
    if (!item?.date) continue;
    const completionDate = new Date(entry.created_at);
    const localDate = `${completionDate.getFullYear()}-${String(completionDate.getMonth() + 1).padStart(2, '0')}-${String(completionDate.getDate()).padStart(2, '0')}`;
    if (localDate === item.date) {
      hasClutchCompletion = true;
      break;
    }
  }

  // Long description check
  const hasLongDescription = items.some(
    (i) => i.description && i.description.split(/\s+/).filter(Boolean).length > 100,
  );

  return {
    totalItemsCompleted: completed.length,
    totalTasksCompleted: completed.filter((i) => i.type === 'task').length,
    totalEventsCompleted: completed.filter((i) => i.type === 'event').length,
    totalStudyCompleted: completed.filter((i) => i.type === 'study').length,
    totalItemsCreated: items.length,
    totalEventsCreated: items.filter((i) => i.type === 'event').length,
    totalItemsDeleted: history.filter((h) => h.reason === 'task_delete').length,
    dailyItemsCompleted: todayCompletionCount,
    dailyStudyCompleted: dailyStudyCount,
    inProgressCount: items.filter((i) => i.status === 'in-progress').length,
    todoCount: items.filter((i) => i.status === 'todo').length,
    uniqueTaskDates: dateSet.size,
    hasSpeedCompletion,
    hasEarlyBirdCompletion: hasEarlyBird,
    hasNightOwlCompletion: hasNightOwl,
    hasClutchCompletion,
    hasLunchCompletion: hasLunch,
    hasWeekendCompletion: hasWeekend,
    hasLongDescription,
    morningCompletions: morningCount,
    nightCompletions: nightCount,
    hasCompletedTaskType: completed.some((i) => i.type === 'task'),
    hasCompletedEventType: completed.some((i) => i.type === 'event'),
    hasCompletedStudyType: completed.some((i) => i.type === 'study'),
    scheduleEntriesCount: schedulesRes.data?.length ?? 0,
    uniqueActiveDays: activeDaySet.size,
  };
}

// ── Compute Cross-Module Stats ───────────────────────────────────────────────

async function computeCrossModuleStats(userId: string): Promise<Partial<GamificationStats>> {
  // Step 1: Fetch notebook IDs first (needed by many child queries)
  const { data: notebooks } = await supabase
    .from('notebooks')
    .select('id')
    .eq('user_id', userId);
  const notebookIds = notebooks?.map((n) => n.id) ?? [];
  const notebooksCreated = notebookIds.length;

  // Step 2: If the user has no notebooks, skip notebook-related queries
  let sourcesCount = 0;
  let flashcardsCount = 0;
  let flashcardsMasteredCount = 0;
  let quizCount = 0;
  let notesCount = 0;
  let mindMapsCount = 0;
  let chatCount = 0;

  if (notebookIds.length > 0) {
    const [sourcesRes, flashcardsRes, flashcardsMasteredRes, quizRes, notesRes, mindMapsRes, chatRes] =
      await Promise.all([
        supabase.from('sources').select('id', { count: 'exact', head: true }).in('notebook_id', notebookIds),
        supabase.from('flashcards').select('id', { count: 'exact', head: true }).in('notebook_id', notebookIds),
        supabase.from('flashcards').select('id', { count: 'exact', head: true }).in('notebook_id', notebookIds).eq('mastery_level', 'mastered'),
        supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).in('notebook_id', notebookIds),
        supabase.from('generated_notes').select('id', { count: 'exact', head: true }).in('notebook_id', notebookIds),
        supabase.from('mind_maps').select('id', { count: 'exact', head: true }).in('notebook_id', notebookIds),
        supabase.from('notebook_chat_messages').select('id', { count: 'exact', head: true }).in('notebook_id', notebookIds).eq('role', 'user'),
      ]);

    sourcesCount = sourcesRes.count ?? 0;
    flashcardsCount = flashcardsRes.count ?? 0;
    flashcardsMasteredCount = flashcardsMasteredRes.count ?? 0;
    quizCount = quizRes.count ?? 0;
    notesCount = notesRes.count ?? 0;
    mindMapsCount = mindMapsRes.count ?? 0;
    chatCount = chatRes.count ?? 0;
  }

  // Step 3: Non-notebook queries run in parallel
  const [txRes, budgetsRes, finSettingsRes, membersRes, friendsRes, messagesRes, linksRes] =
    await Promise.all([
      supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('finance_settings').select('main_income, monthly_budget').eq('user_id', userId).maybeSingle(),
      supabase.from('group_members').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('friendships').select('id', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted'),
      supabase.from('group_messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId),
      supabase.from('group_links').select('id', { count: 'exact', head: true }).eq('added_by', userId),
    ]);

  return {
    notebooksCreated,
    sourcesUploaded: sourcesCount,
    flashcardsCreated: flashcardsCount,
    flashcardsMastered: flashcardsMasteredCount,
    quizQuestionsCount: quizCount,
    generatedNotesCount: notesCount,
    mindMapsCount,
    notebookChatCount: chatCount,
    transactionsLogged: txRes.count ?? 0,
    budgetsSet: budgetsRes.count ?? 0,
    hasMonthlyBudget: (finSettingsRes.data?.monthly_budget ?? 0) > 0,
    hasIncomeSetup: (finSettingsRes.data?.main_income ?? 0) > 0,
    groupsJoined: membersRes.count ?? 0,
    friendsCount: friendsRes.count ?? 0,
    groupMessagesCount: messagesRes.count ?? 0,
    linksSharedCount: linksRes.count ?? 0,
    hasVisitedWellness: false,
    journalEntriesCount: 0,
    habitsCreated: 0,
    habitTrackingDays: 0,
  };
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
  const [stats, setStats] = useState<GamificationStats | null>(null);

  const stateRef = useRef({
    totalXP, level, streak, lastActiveDate, xpHistory, unlockedAchievements,
  });
  stateRef.current = { totalXP, level, streak, lastActiveDate, xpHistory, unlockedAchievements };

  const actionLock = useRef(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!user) {
      setTotalXP(0); setLevel(1); setStreak(0); setLastActiveDate(null);
      setXpHistory([]); setUnlockedAchievements([]); setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [xpRes, historyRes, achievementsRes] = await Promise.all([
        supabase.from('user_xp').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('xp_history').select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(200),
        supabase.from('user_achievements').select('*').eq('user_id', user.id),
      ]);

      if (xpRes.data) {
        setTotalXP(xpRes.data.total_xp ?? 0);
        setLevel(xpRes.data.level ?? 1);
        setStreak(xpRes.data.streak ?? 0);
        setLastActiveDate(xpRes.data.last_active_date ?? null);
      }
      if (historyRes.data) setXpHistory(historyRes.data);
      if (achievementsRes.data) setUnlockedAchievements(achievementsRes.data);
    } catch {
      // Network error — leave defaults
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Cross-tab sync ───────────────────────────────────────────────────────

  useEffect(() => {
    const ch = getBroadcastChannel();
    if (!ch) return;

    const handler = (event: MessageEvent<GamificationBroadcast>) => {
      const msg = event.data;
      if (msg.type === 'xp_update') {
        setTotalXP(msg.totalXP);
        setLevel(msg.level);
        setStreak(msg.streak);
        setLastActiveDate(msg.lastActiveDate);
      }
      if (msg.type === 'achievement_unlock' && msg.newAchievementIds && user) {
        supabase.from('user_achievements').select('*').eq('user_id', user.id)
          .then(({ data }) => { if (data) setUnlockedAchievements(data); });
      }
    };

    ch.addEventListener('message', handler);
    return () => ch.removeEventListener('message', handler);
  }, [user]);

  // ── Broadcast helper ─────────────────────────────────────────────────────

  const broadcast = useCallback((msg: GamificationBroadcast) => {
    try { getBroadcastChannel()?.postMessage(msg); } catch { /* ignore */ }
  }, []);

  // ── Persist XP to Supabase ───────────────────────────────────────────────

  const persistXP = useCallback(async (
    userId: string,
    newTotalXP: number,
    newLevel: number,
    newStreak: number,
    newLastActive: string | null,
    entries: { amount: number; reason: string; task_id: string | null }[],
  ): Promise<boolean> => {
    const historyRows = entries.map((e) => ({
      user_id: userId,
      amount: e.amount,
      reason: e.reason,
      task_id: e.task_id,
    }));

    const [histRes, xpRes] = await Promise.all([
      supabase.from('xp_history').insert(historyRows),
      supabase.from('user_xp').upsert(
        {
          user_id: userId,
          total_xp: newTotalXP,
          level: newLevel,
          streak: newStreak,
          last_active_date: newLastActive,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      ),
    ]);

    // Return true if EITHER insert failed
    return !!(histRes.error || xpRes.error);
  }, []);

  // ── Check Achievements ───────────────────────────────────────────────────

  const checkAchievements = useCallback(
    async (currentStats: GamificationStats, userId: string, currentUnlocked: UnlockedAchievement[]) => {
      const currentIds = new Set(currentUnlocked.map((a) => a.achievement_id));
      const newlyUnlocked: { achievement_id: string; title: string; icon: string; xpReward: number }[] = [];

      for (const def of ACHIEVEMENTS) {
        if (currentIds.has(def.id)) continue;
        try {
          if (def.condition(currentStats)) {
            newlyUnlocked.push({
              achievement_id: def.id,
              title: def.title,
              icon: def.icon,
              xpReward: def.xpReward,
            });
          }
        } catch (err) {
          console.warn(`[Gamification] Achievement condition failed for "${def.id}":`, err);
        }
      }

      if (newlyUnlocked.length === 0) return;

      // Insert into Supabase
      const rows = newlyUnlocked.map((a) => ({
        user_id: userId,
        achievement_id: a.achievement_id,
        xp_reward: a.xpReward,
      }));

      const { data } = await supabase
        .from('user_achievements')
        .upsert(rows, { onConflict: 'user_id,achievement_id' })
        .select();

      if (data) {
        setUnlockedAchievements((prev) => {
          const existing = new Set(prev.map((a) => a.achievement_id));
          const fresh = data.filter((a: UnlockedAchievement) => !existing.has(a.achievement_id));
          return [...prev, ...fresh];
        });
      }

      // Award bonus XP from achievements
      const totalBonusXP = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0);
      if (totalBonusXP > 0) {
        const s = stateRef.current;
        const newTotalXP = s.totalXP + totalBonusXP;
        const newLevel = getLevelFromXP(newTotalXP);

        setTotalXP(newTotalXP);
        setLevel(newLevel);

        const bonusEntries = newlyUnlocked.map((a) => ({
          user_id: userId,
          amount: a.xpReward,
          reason: `achievement_${a.achievement_id}`,
          task_id: null,
        }));

        await Promise.all([
          supabase.from('xp_history').insert(bonusEntries),
          supabase.from('user_xp').upsert({
            user_id: userId,
            total_xp: newTotalXP,
            level: newLevel,
            streak: s.streak,
            last_active_date: s.lastActiveDate,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' }),
        ]);

        if (newLevel > s.level) {
          setPendingLevelUp(newLevel);
        }

        broadcast({
          type: 'xp_update',
          totalXP: newTotalXP,
          level: newLevel,
          streak: s.streak,
          lastActiveDate: s.lastActiveDate,
        });
      }

      // Toast each achievement
      for (const a of newlyUnlocked) {
        toast.success(`${a.icon} Achievement Unlocked: ${a.title} (+${a.xpReward} XP)`, {
          duration: 5000,
        });
      }

      broadcast({
        type: 'achievement_unlock',
        totalXP: stateRef.current.totalXP,
        level: stateRef.current.level,
        streak: stateRef.current.streak,
        lastActiveDate: stateRef.current.lastActiveDate,
        newAchievementIds: newlyUnlocked.map((a) => a.achievement_id),
      });
    },
    [broadcast],
  );

  // ── Build Quick Stats ───────────────────────────────────────────────────

  const buildQuickStats = useCallback((overrides: Partial<GamificationStats> = {}): GamificationStats => {
    const s = stateRef.current;
    return {
      ...defaultStats(),
      totalXP: s.totalXP,
      level: s.level,
      streak: s.streak,
      unlockedCount: s.unlockedAchievements.length,
      ...overrides,
    };
  }, []);

  // ── Award XP (task completion) ──────────────────────────────────────────

  const awardXP = useCallback(async (taskId: string, itemType: ItemType) => {
    if (!user || actionLock.current) return;
    actionLock.current = true;

    try {
      const s = stateRef.current;

      // Deduplication: skip if this task already has positive net XP
      const taskEntries = s.xpHistory.filter((h) => h.task_id === taskId);
      const netTaskXP = taskEntries.reduce((sum, h) => sum + h.amount, 0);
      if (netTaskXP > 0) return;

      const baseXP = XP_ACTIONS.TASK_COMPLETE;
      let totalAwarded = baseXP;
      const entries: { amount: number; reason: string; task_id: string | null }[] = [
        { amount: baseXP, reason: 'task_complete', task_id: taskId },
      ];

      // Daily goal check
      const today = todayLocal();
      const todayTasks = s.xpHistory.filter(
        (h) => h.reason === 'task_complete' && h.amount > 0 && isOnLocalDate(h.created_at, today),
      ).length;
      const newDailyCount = todayTasks + 1;

      if (newDailyCount === DAILY_GOAL_TASK_COUNT) {
        entries.push({ amount: DAILY_GOAL_BONUS, reason: 'daily_goal', task_id: null });
        totalAwarded += DAILY_GOAL_BONUS;
      }

      const newTotalXP = s.totalXP + totalAwarded;
      const newLevel = getLevelFromXP(newTotalXP);
      const leveledUp = newLevel > s.level;

      setTotalXP(newTotalXP);
      setLevel(newLevel);

      const optimisticEntries: XPHistoryEntry[] = entries.map((e) => ({
        id: uuid(), user_id: user.id, amount: e.amount,
        reason: e.reason, task_id: e.task_id, created_at: new Date().toISOString(),
      }));
      setXpHistory((prev) => [...optimisticEntries, ...prev].slice(0, 200));

      const typeLabel = itemType === 'study' ? 'Study' : itemType === 'event' ? 'Event' : 'Task';
      const parts = [`+${baseXP} XP (${typeLabel})`];
      if (entries.some((e) => e.reason === 'daily_goal')) parts.push(`+${DAILY_GOAL_BONUS} daily goal!`);
      toast.success(parts.join(' | '), { duration: 3000 });

      if (leveledUp) setPendingLevelUp(newLevel);

      const failed = await persistXP(user.id, newTotalXP, newLevel, s.streak, s.lastActiveDate, entries);
      if (failed) {
        setTotalXP(s.totalXP); setLevel(s.level); setXpHistory(s.xpHistory);
        return;
      }

      broadcast({
        type: 'xp_update', totalXP: newTotalXP, level: newLevel,
        streak: s.streak, lastActiveDate: s.lastActiveDate,
      });

      // Achievement check (fire-and-forget, don't block the action)
      computeCoreStats(user.id).then((coreStats) => {
        const quickStats = buildQuickStats({
          ...coreStats,
          totalXP: newTotalXP,
          level: newLevel,
          streak: s.streak,
          unlockedCount: stateRef.current.unlockedAchievements.length,
        });
        checkAchievements(quickStats, user.id, stateRef.current.unlockedAchievements);
      }).catch((err) => console.error('Gamification stats error:', err));
    } finally {
      actionLock.current = false;
    }
  }, [user, persistXP, broadcast, checkAchievements, buildQuickStats]);

  // ── Revoke XP ───────────────────────────────────────────────────────────

  const revokeXP = useCallback(async (taskId: string) => {
    if (!user || actionLock.current) return;
    actionLock.current = true;

    try {
      const s = stateRef.current;

      const taskEntries = s.xpHistory.filter((h) => h.task_id === taskId);
      const netTaskXP = taskEntries.reduce((sum, h) => sum + h.amount, 0);
      if (netTaskXP <= 0) return;

      const revokeAmount = netTaskXP;
      const newTotalXP = Math.max(0, s.totalXP - revokeAmount);
      const newLevel = getLevelFromXP(newTotalXP);

      setTotalXP(newTotalXP);
      setLevel(newLevel);

      const negativeEntry: XPHistoryEntry = {
        id: uuid(), user_id: user.id, amount: -revokeAmount,
        reason: 'task_revoked', task_id: taskId, created_at: new Date().toISOString(),
      };
      setXpHistory((prev) => [negativeEntry, ...prev].slice(0, 200));

      toast.info(`-${revokeAmount} XP (task uncompleted)`, { duration: 2000 });

      const failed = await persistXP(user.id, newTotalXP, newLevel, s.streak, s.lastActiveDate, [
        { amount: -revokeAmount, reason: 'task_revoked', task_id: taskId },
      ]);
      if (failed) {
        setTotalXP(s.totalXP); setLevel(s.level); setXpHistory(s.xpHistory);
        return;
      }

      broadcast({
        type: 'xp_update', totalXP: newTotalXP, level: newLevel,
        streak: s.streak, lastActiveDate: s.lastActiveDate,
      });
    } finally {
      actionLock.current = false;
    }
  }, [user, persistXP, broadcast]);

  // ── Handle Item Create ──────────────────────────────────────────────────

  const handleItemCreate = useCallback(async (taskId: string, itemType: ItemType, descWordCount: number) => {
    if (!user || actionLock.current) return;
    actionLock.current = true;

    try {
      const s = stateRef.current;

      const xp = XP_ACTIONS.TASK_CREATE;
      const newTotalXP = s.totalXP + xp;
      const newLevel = getLevelFromXP(newTotalXP);

      setTotalXP(newTotalXP);
      setLevel(newLevel);

      const entry: XPHistoryEntry = {
        id: uuid(), user_id: user.id, amount: xp,
        reason: 'task_create', task_id: taskId, created_at: new Date().toISOString(),
      };
      setXpHistory((prev) => [entry, ...prev].slice(0, 200));

      toast.success(`+${xp} XP (${itemType} created)`, { duration: 2000 });

      if (newLevel > s.level) setPendingLevelUp(newLevel);

      const failed = await persistXP(user.id, newTotalXP, newLevel, s.streak, s.lastActiveDate, [
        { amount: xp, reason: 'task_create', task_id: taskId },
      ]);
      if (failed) {
        setTotalXP(s.totalXP); setLevel(s.level); setXpHistory(s.xpHistory);
        return;
      }

      broadcast({
        type: 'xp_update', totalXP: newTotalXP, level: newLevel,
        streak: s.streak, lastActiveDate: s.lastActiveDate,
      });

      computeCoreStats(user.id).then((coreStats) => {
        const quickStats = buildQuickStats({
          ...coreStats,
          totalXP: newTotalXP,
          level: newLevel,
          hasLongDescription: descWordCount > 100 || coreStats.hasLongDescription,
          unlockedCount: stateRef.current.unlockedAchievements.length,
        });
        checkAchievements(quickStats, user.id, stateRef.current.unlockedAchievements);
      }).catch((err) => console.error('Gamification stats error:', err));
    } finally {
      actionLock.current = false;
    }
  }, [user, persistXP, broadcast, checkAchievements, buildQuickStats]);

  // ── Handle Item Delete ──────────────────────────────────────────────────

  const handleItemDelete = useCallback(async (taskId: string) => {
    if (!user || actionLock.current) return;
    actionLock.current = true;

    try {
      const s = stateRef.current;
      const penalty = XP_ACTIONS.TASK_DELETE;
      const newTotalXP = Math.max(0, s.totalXP + penalty);
      const newLevel = getLevelFromXP(newTotalXP);

      setTotalXP(newTotalXP);
      setLevel(newLevel);

      const entry: XPHistoryEntry = {
        id: uuid(), user_id: user.id, amount: penalty,
        reason: 'task_delete', task_id: taskId, created_at: new Date().toISOString(),
      };
      setXpHistory((prev) => [entry, ...prev].slice(0, 200));

      toast.info(`${penalty} XP (task deleted)`, { duration: 2000 });

      const failed = await persistXP(user.id, newTotalXP, newLevel, s.streak, s.lastActiveDate, [
        { amount: penalty, reason: 'task_delete', task_id: taskId },
      ]);
      if (failed) {
        setTotalXP(s.totalXP); setLevel(s.level); setXpHistory(s.xpHistory);
        return;
      }

      broadcast({
        type: 'xp_update', totalXP: newTotalXP, level: newLevel,
        streak: s.streak, lastActiveDate: s.lastActiveDate,
      });

      computeCoreStats(user.id).then((coreStats) => {
        const quickStats = buildQuickStats({
          ...coreStats,
          totalXP: newTotalXP,
          level: newLevel,
          unlockedCount: stateRef.current.unlockedAchievements.length,
        });
        checkAchievements(quickStats, user.id, stateRef.current.unlockedAchievements);
      }).catch((err) => console.error('Gamification stats error:', err));
    } finally {
      actionLock.current = false;
    }
  }, [user, persistXP, broadcast, checkAchievements, buildQuickStats]);

  // ── Handle Daily Login ──────────────────────────────────────────────────

  const dailyLoginDone = useRef(false);

  const handleDailyLogin = useCallback(async () => {
    if (!user || dailyLoginDone.current) return;
    // Set guard IMMEDIATELY before any async work to prevent race conditions
    dailyLoginDone.current = true;

    const s = stateRef.current;
    const today = todayLocal();

    // Only award once per day
    if (s.lastActiveDate === today) return;

    const yesterday = yesterdayLocal();
    let newStreak = s.streak;

    if (s.lastActiveDate === yesterday) {
      newStreak = s.streak + 1;
    } else {
      newStreak = 1;
    }

    const xp = XP_ACTIONS.DAILY_LOGIN;
    const newTotalXP = s.totalXP + xp;
    const newLevel = getLevelFromXP(newTotalXP);
    const newLastActive = today;

    setTotalXP(newTotalXP);
    setLevel(newLevel);
    setStreak(newStreak);
    setLastActiveDate(newLastActive);

    const entry: XPHistoryEntry = {
      id: uuid(), user_id: user.id, amount: xp,
      reason: 'daily_login', task_id: null, created_at: new Date().toISOString(),
    };
    setXpHistory((prev) => [entry, ...prev].slice(0, 200));

    toast.success(`+${xp} XP (Daily Login) | ${newStreak} day streak`, { duration: 3000 });

    if (newLevel > s.level) setPendingLevelUp(newLevel);

    const failed = await persistXP(user.id, newTotalXP, newLevel, newStreak, newLastActive, [
      { amount: xp, reason: 'daily_login', task_id: null },
    ]);

    if (failed) {
      setTotalXP(s.totalXP); setLevel(s.level); setStreak(s.streak);
      setLastActiveDate(s.lastActiveDate); setXpHistory(s.xpHistory);
      dailyLoginDone.current = false; // Allow retry on failure
      return;
    }

    broadcast({
      type: 'xp_update', totalXP: newTotalXP, level: newLevel,
      streak: newStreak, lastActiveDate: newLastActive,
    });

    computeCoreStats(user.id).then((coreStats) => {
      const quickStats = buildQuickStats({
        ...coreStats,
        totalXP: newTotalXP,
        level: newLevel,
        streak: newStreak,
        unlockedCount: stateRef.current.unlockedAchievements.length,
      });
      checkAchievements(quickStats, user.id, stateRef.current.unlockedAchievements);
    }).catch((err) => console.error('Gamification stats error:', err));
  }, [user, persistXP, broadcast, checkAchievements, buildQuickStats]);

  // ── Full Achievement Check (for achievements page) ──────────────────────

  const runFullAchievementCheck = useCallback(async () => {
    if (!user) return;

    try {
      const s = stateRef.current;
      const [coreStats, crossStats] = await Promise.all([
        computeCoreStats(user.id),
        computeCrossModuleStats(user.id),
      ]);

      const fullStats: GamificationStats = {
        ...defaultStats(),
        ...coreStats,
        ...crossStats,
        totalXP: s.totalXP,
        level: s.level,
        streak: s.streak,
        unlockedCount: s.unlockedAchievements.length,
        hasVisitedWellness: crossStats.hasVisitedWellness || s.xpHistory.some((h) => h.reason === 'wellness_visit'),
      };

      setStats(fullStats);
      await checkAchievements(fullStats, user.id, stateRef.current.unlockedAchievements);
    } catch {
      // Network error — skip full check
    }
  }, [user, checkAchievements]);

  // ── Dismiss Level Up ────────────────────────────────────────────────────

  const dismissLevelUp = useCallback(() => setPendingLevelUp(null), []);

  return useMemo(
    () => ({
      totalXP, level, streak, lastActiveDate, xpHistory, unlockedAchievements,
      loading, pendingLevelUp, dismissLevelUp,
      awardXP, revokeXP, handleItemCreate, handleItemDelete, handleDailyLogin,
      runFullAchievementCheck, stats,
    }),
    [
      totalXP, level, streak, lastActiveDate, xpHistory, unlockedAchievements,
      loading, pendingLevelUp, dismissLevelUp,
      awardXP, revokeXP, handleItemCreate, handleItemDelete, handleDailyLogin,
      runFullAchievementCheck, stats,
    ],
  );
}
