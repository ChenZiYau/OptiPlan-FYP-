import type { LucideIcon } from 'lucide-react';

// ── Existing types ──────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  icon: LucideIcon;
}

export interface Budget {
  id: string;
  category: string;
  spent: number;
  limit: number;
  color: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
}

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface AreaChartDataPoint {
  month: string;
  income: number;
  expenses: number;
}

// ── New: Modal form payloads ────────────────────────────────────────────────

export type Importance = 1 | 2 | 3;

export type ItemType = 'task' | 'event' | 'study';

export type TaskStatus = 'todo' | 'in-progress' | 'completed';

export interface TaskNote {
  id: string;
  text: string;
  createdAt: string;
}

interface BasePayload {
  id: string;
  title: string;
  description: string;
  date: string;          // ISO date string (YYYY-MM-DD)
  importance: Importance;
  type: ItemType;
  color: string;         // display color derived from type
  status?: TaskStatus;
  notes?: TaskNote[];
}

export interface TaskPayload extends BasePayload {
  type: 'task';
}

export interface EventPayload extends BasePayload {
  type: 'event';
  startTime: string;     // HH:mm
  endTime: string;       // HH:mm
}

export interface StudyPayload extends BasePayload {
  type: 'study';
  startTime: string;
  endTime: string;
  subject: string;
}

export type DashboardItem = TaskPayload | EventPayload | StudyPayload;

// ── New: Schedule entry (timetable) ─────────────────────────────────────────

export interface ScheduleEntry {
  id: string;
  subjectName: string;
  color: string;
  days: number[];        // 0 = Sun … 6 = Sat
  startTime: string;     // HH:mm
  endTime: string;       // HH:mm
}
