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

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action_type: 'content_update' | 'user_delete' | 'feedback_status_change' | 'section_toggle';
  target_section: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

export interface SiteContent {
  id: string;
  section_key: string;
  content: Record<string, unknown>;
  visible: boolean;
  updated_at: string;
  updated_by: string | null;
}
