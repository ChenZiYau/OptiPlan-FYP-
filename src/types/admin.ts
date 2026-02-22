import type { LucideIcon } from 'lucide-react';

export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string | null;
  user_email: string;
  user_name: string | null;
  category: 'bug' | 'feature' | 'general' | 'other';
  message: string;
  status: 'new' | 'reviewed' | 'resolved';
  created_at: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface RecentActivity {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  created_at: string;
}
