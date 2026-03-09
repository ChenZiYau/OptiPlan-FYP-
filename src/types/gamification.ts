import type { ItemType } from '@/types/dashboard';

// ── XP Constants ─────────────────────────────────────────────────────────────

/** Base XP awarded per task completion, keyed by item type */
export const XP_REWARDS: Record<ItemType, number> = {
  task: 15,
  event: 25,
  study: 50,
};

/** Bonus XP for maintaining a daily streak */
export const STREAK_BONUS = 15;

/** Bonus XP for completing the daily goal */
export const DAILY_GOAL_BONUS = 100;

/** Number of tasks needed per day to earn the daily goal bonus */
export const DAILY_GOAL_TASK_COUNT = 5;

// ── Level Formulas ───────────────────────────────────────────────────────────

/** XP required to complete a given level (i.e. go from level → level+1) */
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

// ── Achievement Definitions ──────────────────────────────────────────────────

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji
  condition: (state: GamificationState) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_task',
    title: 'First Step',
    description: 'Complete your first task',
    icon: '🎯',
    condition: (s) => s.hasCompletedTask,
  },
  {
    id: 'first_event',
    title: 'Event Planner',
    description: 'Complete your first event',
    icon: '📅',
    condition: (s) => s.hasCompletedEventTask,
  },
  {
    id: 'first_study',
    title: 'Scholar',
    description: 'Complete your first study session',
    icon: '📚',
    condition: (s) => s.hasCompletedStudyTask,
  },
];

// ── Type Interfaces ──────────────────────────────────────────────────────────

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

/** Snapshot used by achievement condition checks */
export interface GamificationState {
  totalXP: number;
  level: number;
  streak: number;
  totalTasksCompleted: number;
  dailyTasksCompleted: number;
  hasCompletedTask: boolean;
  hasCompletedEventTask: boolean;
  hasCompletedStudyTask: boolean;
}
