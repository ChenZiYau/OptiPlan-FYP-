import { Settings, LayoutDashboard, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

export const steps: Step[] = [
  {
    number: '01',
    icon: Settings,
    title: 'Set Up',
    description:
      'Create your account and add your class schedule, tasks, and budget categories. The dashboard is ready in minutes.',
    color: 'text-opti-accent',
    bgColor: 'bg-opti-accent/10',
  },
  {
    number: '02',
    icon: LayoutDashboard,
    title: 'Organize',
    description:
      'Manage your tasks with Kanban boards, track spending by category, and build daily habits — or let the AI chatbot handle it through conversation.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Grow',
    description:
      'Earn XP for every action, unlock achievements, track your mood and habits, and review your semester progress with Wrapped.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
];
