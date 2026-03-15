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
    title: 'Task & Schedule Management',
    description:
      'Organize your week with a visual timetable, manage tasks with Kanban boards, and track events and study sessions — all in one place.',
    color: 'from-violet-400 to-purple-500',
    checklist: [
      'Weekly timetable with color-coded subjects',
      'Kanban board with drag-and-drop',
      'AI chatbot for quick task creation',
    ],
    backContent:
      'Build your weekly class schedule with multi-day support and 8 color options. Manage tasks, events, and study sessions with a Kanban board or list view. Filter by status, importance, or type — or just tell the AI chatbot what you need and it creates it for you.',
  },
  {
    icon: BookOpen,
    title: 'AI Study Hub',
    description:
      'Upload your documents and let AI generate study notes, flashcards, quizzes, and interactive mind maps — all from your own material.',
    color: 'from-emerald-400 to-teal-500',
    checklist: [
      'AI-generated notes, flashcards, and quizzes',
      'Interactive mind maps with expandable nodes',
      'Supports PDF, PPTX, DOCX, and more',
    ],
    backContent:
      'Upload your lecture slides, PDFs, or documents and the AI extracts and chunks the content automatically. Then generate structured study notes, flashcards with spaced repetition tracking, multiple-choice quizzes with explanations, and interactive mind maps — all powered by Groq\'s Llama model.',
  },
  {
    icon: Wallet,
    title: 'Budget Tracking',
    description:
      'See where your money goes with quick expense logging and category breakdowns.',
    color: 'from-amber-400 to-orange-500',
    checklist: [
      'Quick-add expenses via modal or AI chatbot',
      'Category breakdown donut charts',
      'Budget limits with progress tracking',
    ],
    backContent:
      'Set monthly budgets per category, log expenses with a quick modal or through the AI chatbot, and see clear breakdowns with donut charts and spending trends. Track daily, weekly, and monthly spending at a glance.',
  },
];
