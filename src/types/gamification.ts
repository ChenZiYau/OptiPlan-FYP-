import type { ItemType } from '@/types/dashboard';

// ── XP Constants ─────────────────────────────────────────────────────────────

/** XP awarded per action */
export const XP_ACTIONS = {
  TASK_CREATE: 5,
  TASK_COMPLETE: 25,
  TASK_DELETE: -5,
  DAILY_LOGIN: 15,
} as const;

/** Legacy per-type rewards (kept for backward compat with existing xp_history) */
export const XP_REWARDS: Record<ItemType, number> = {
  task: 25,
  event: 25,
  study: 25,
};

/** Bonus XP for completing the daily goal */
export const DAILY_GOAL_BONUS = 100;

/** Number of tasks needed per day to earn the daily goal bonus */
export const DAILY_GOAL_TASK_COUNT = 5;

// ── Level Formulas ───────────────────────────────────────────────────────────

/** XP required to complete a given level (go from level → level+1) */
export function xpRequiredForLevel(level: number): number {
  return Math.round(50 * Math.pow(level, 1.8));
}

/** Total cumulative XP needed to reach a given level */
export function totalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpRequiredForLevel(i);
  }
  return total;
}

/** Derive the current level from total XP */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let cumulative = 0;
  while (true) {
    const needed = xpRequiredForLevel(level);
    if (cumulative + needed > totalXP) break;
    cumulative += needed;
    level++;
  }
  return level;
}

/** Get current XP progress within the current level */
export function xpProgressInLevel(totalXP: number): { current: number; required: number } {
  const level = getLevelFromXP(totalXP);
  const cumulative = totalXPForLevel(level);
  return {
    current: totalXP - cumulative,
    required: xpRequiredForLevel(level),
  };
}

// ── Achievement Definition ───────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  condition: (state: GamificationStats) => boolean;
}

// ── Stats used for achievement condition checks ──────────────────────────────

export interface GamificationStats {
  // Core (from user_xp)
  totalXP: number;
  level: number;
  streak: number;

  // Item counts (from dashboard_items)
  totalItemsCompleted: number;
  totalTasksCompleted: number;
  totalEventsCompleted: number;
  totalStudyCompleted: number;
  totalItemsCreated: number;
  totalEventsCreated: number;
  totalItemsDeleted: number;
  dailyItemsCompleted: number;
  dailyStudyCompleted: number;
  inProgressCount: number;
  todoCount: number;
  uniqueTaskDates: number;

  // Time-based flags (set during action or loaded from history)
  hasSpeedCompletion: boolean;
  hasEarlyBirdCompletion: boolean;
  hasNightOwlCompletion: boolean;
  hasClutchCompletion: boolean;
  hasLunchCompletion: boolean;
  hasWeekendCompletion: boolean;
  hasLongDescription: boolean;
  morningCompletions: number;
  nightCompletions: number;

  // Item type flags
  hasCompletedTaskType: boolean;
  hasCompletedEventType: boolean;
  hasCompletedStudyType: boolean;

  // Cross-module (from other tables, loaded lazily)
  notebooksCreated: number;
  sourcesUploaded: number;
  flashcardsCreated: number;
  flashcardsMastered: number;
  quizQuestionsCount: number;
  generatedNotesCount: number;
  mindMapsCount: number;
  notebookChatCount: number;
  transactionsLogged: number;
  budgetsSet: number;
  hasMonthlyBudget: boolean;
  hasIncomeSetup: boolean;
  groupsJoined: number;
  friendsCount: number;
  groupMessagesCount: number;
  linksSharedCount: number;
  scheduleEntriesCount: number;
  hasVisitedWellness: boolean;
  journalEntriesCount: number;
  habitsCreated: number;
  habitTrackingDays: number;

  // Meta
  unlockedCount: number;
  uniqueActiveDays: number;
}

// ── Persisted types ──────────────────────────────────────────────────────────

export interface XPHistoryEntry {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  task_id: string | null;
  created_at: string;
}

export interface UnlockedAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  xp_reward: number;
  unlocked_at: string;
}

export interface GamificationData {
  totalXP: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  xpHistory: XPHistoryEntry[];
  unlockedAchievements: UnlockedAchievement[];
}

/** Broadcast message shape for cross-tab sync */
export interface GamificationBroadcast {
  type: 'xp_update' | 'achievement_unlock';
  totalXP: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  newAchievementIds?: string[];
}
