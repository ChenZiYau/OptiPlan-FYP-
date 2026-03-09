import { Calendar, BookOpen, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  checklist: string[];
  backContent: string;
}

export const features: Feature[] = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description:
      'AI builds your optimal daily timeline around classes, deadlines, and personal commitments.',
    color: 'from-violet-400 to-purple-500',
    checklist: [
      'Auto-sync with university calendar',
      'Deadline & exam countdown alerts',
      'Focus-block suggestions between classes',
    ],
    backContent:
      'OptiPlan analyzes your class timetable, assignment due dates, and energy patterns to generate a personalized daily schedule. It learns which study slots work best for you and automatically blocks focus time before exams.',
  },
  {
    icon: BookOpen,
    title: 'Study Notes',
    description:
      'Capture, organize, and search your notes in one place — linked to your schedule.',
    color: 'from-emerald-400 to-teal-500',
    checklist: [
      'Rich-text & markdown editor',
      'Auto-tag by course and topic',
      'Full-text search across all notes',
    ],
    backContent:
      'Every note is automatically linked to the class or study session where you created it. Tag by course, search by keyword, and review everything in one timeline — no more digging through folders the night before an exam.',
  },
  {
    icon: Wallet,
    title: 'Budget Tracking',
    description:
      'See where your money goes with zero-effort expense logging and weekly spending reports.',
    color: 'from-amber-400 to-orange-500',
    checklist: [
      'Quick-add expenses in two taps',
      'Category breakdown charts',
      'Weekly & monthly spending alerts',
    ],
    backContent:
      'Set a weekly budget, snap receipts or quick-add expenses, and get a clear breakdown by category. OptiPlan sends gentle alerts before you overshoot, so you can make it to the end of the month without surprises.',
  },
];
