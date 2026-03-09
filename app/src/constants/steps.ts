import { Link2, Focus, BookOpen } from 'lucide-react';
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
    icon: Link2,
    title: 'Connect',
    description:
      'Link your calendars and task apps in seconds. OptiPlan integrates seamlessly with Google Calendar, Outlook, Notion, and more.',
    color: 'text-opti-accent',
    bgColor: 'bg-opti-accent/10',
  },
  {
    number: '02',
    icon: Focus,
    title: 'Focus',
    description:
      'Start a focus session with one tap. We silence notifications, block distractions, and track your progress automatically.',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  {
    number: '03',
    icon: BookOpen,
    title: 'Reflect',
    description:
      "Close the day with a personalized summary. See what you accomplished, what's next, and jot down a quick reflection.",
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
  },
];
