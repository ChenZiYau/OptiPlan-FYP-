import {
  Trophy, Target, Flame, Star,
} from 'lucide-react';
import type { Task, Expense, Budget, Achievement, ChartDataPoint, AreaChartDataPoint } from '@/types/dashboard';

export const mockTasks: Task[] = [];

export const mockExpenses: Expense[] = [];

export const mockBudgets: Budget[] = [];

export const mockAchievements: Achievement[] = [
  { id: '1', title: 'Early Bird', description: 'Complete 5 tasks before 9 AM', icon: Trophy, unlocked: false },
  { id: '2', title: 'Goal Crusher', description: 'Hit weekly target 3 weeks in a row', icon: Target, unlocked: false },
  { id: '3', title: 'On Fire', description: '7-day task streak', icon: Flame, unlocked: false },
  { id: '4', title: 'All Star', description: 'Complete all tasks in a day', icon: Star, unlocked: false },
];

export const donutChartData: ChartDataPoint[] = [];

export const DONUT_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

export const areaChartData: AreaChartDataPoint[] = [];

export const userXP = { current: 0, nextLevel: 100, level: 1 };
