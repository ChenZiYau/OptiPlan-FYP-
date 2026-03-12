import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdminUser, Feedback, AdminActivityLog, UserPresence, SiteContent } from '@/types/admin';

/**
 * Returns the current Supabase session user ID, re-rendering when auth state
 * changes.  Admin-data hooks use this to delay their first fetch until the
 * session has been restored (fixes blank pages on hard-refresh).
 */
function useSessionUid(): string | null {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    // Restore session from storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUid(session?.user?.id ?? null);
    });

    // Keep in sync with auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUid(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return uid;
}

export function useAdminUsers() {
  const uid = useSessionUid();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, email, display_name, role, created_at')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setUsers(data ?? []);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uid) fetchUsers();
  }, [uid, fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}

export function useAdminFeedback() {
  const uid = useSessionUid();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setFeedback(data ?? []);
    } catch {
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uid) fetchFeedback();
  }, [uid, fetchFeedback]);

  return { feedback, loading, error, refetch: fetchFeedback };
}

export function useAdminStats() {
  const uid = useSessionUid();
  const [stats, setStats] = useState({
    totalUsers: 0,
    regularUsers: 0,
    adminUsers: 0,
    newUsersToday: 0,
    totalFeedback: 0,
    bugReports: 0,
    featureRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setError(null);
    try {
      const [profilesRes, feedbackRes] = await Promise.all([
        supabase.from('profiles').select('role, created_at'),
        supabase.from('feedback').select('category'),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (feedbackRes.error) throw feedbackRes.error;

      const profiles = profilesRes.data ?? [];
      const fb = feedbackRes.data ?? [];
      const todayStr = new Date().toISOString().split('T')[0];
      const newToday = profiles.filter((p) => p.created_at?.startsWith(todayStr)).length;

      setStats({
        totalUsers: profiles.length,
        regularUsers: profiles.filter((p) => p.role === 'user').length,
        adminUsers: profiles.filter((p) => p.role === 'admin').length,
        newUsersToday: newToday,
        totalFeedback: fb.length,
        bugReports: fb.filter((f) => f.category === 'bug').length,
        featureRequests: fb.filter((f) => f.category === 'feature').length,
      });
    } catch {
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uid) fetchStats();
  }, [uid, fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useRecentActivity() {
  const uid = useSessionUid();
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (err) throw err;
      setActivities(data ?? []);
    } catch {
      setError('Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uid) fetchActivities();
  }, [uid, fetchActivities]);

  return { activities, loading, error, refetch: fetchActivities };
}

interface ActivityFilters {
  dateFrom?: string;
  dateTo?: string;
  actionType?: string;
  adminName?: string;
}

export function useAdminActivityLog(filters?: ActivityFilters) {
  const uid = useSessionUid();
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59');
      }
      if (filters?.actionType && filters.actionType !== 'all') {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters?.adminName && filters.adminName !== 'all') {
        query = query.eq('admin_name', filters.adminName);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setActivities(data ?? []);
    } catch {
      setError('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, [filters?.dateFrom, filters?.dateTo, filters?.actionType, filters?.adminName]);

  useEffect(() => {
    if (uid) fetchActivities();
  }, [uid, fetchActivities]);

  return { activities, loading, error, refetch: fetchActivities };
}

export function useUserPresence() {
  const uid = useSessionUid();
  const [presence, setPresence] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresence = useCallback(async () => {
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('user_presence')
        .select('*');
      if (err) throw err;
      setPresence(data ?? []);
    } catch {
      setError('Failed to load presence data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uid) fetchPresence();
  }, [uid, fetchPresence]);

  const presenceMap = new Map(presence.map(p => [p.user_id, p]));

  return { presence, presenceMap, loading, error, refetch: fetchPresence };
}

export function useSiteContent() {
  const uid = useSessionUid();
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchContent = useCallback(async () => {
    if (!hasFetched.current) setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('site_content')
        .select('*')
        .order('section_key');
      if (err) throw err;
      setContent(data ?? []);
      hasFetched.current = true;
    } catch {
      setError('Failed to load site content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uid) fetchContent();
  }, [uid, fetchContent]);

  const contentMap = new Map(content.map(c => [c.section_key, c]));

  return { content, contentMap, loading, error, refetch: fetchContent };
}

export async function updateSiteContent(
  sectionKey: string,
  updates: { content?: Record<string, unknown>; visible?: boolean },
  adminId: string,
  adminName: string,
  oldContent?: Record<string, unknown>
) {
  const { error } = await supabase
    .from('site_content')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: adminId,
    })
    .eq('section_key', sectionKey);

  if (error) throw error;

  const detailsPayload = updates.visible !== undefined
    ? updates
    : { previous: oldContent, current: updates.content };

  // Log the activity
  await supabase.from('admin_activity_log').insert({
    admin_id: adminId,
    admin_name: adminName,
    action_type: updates.visible !== undefined ? 'section_toggle' : 'content_update',
    target_section: sectionKey,
    details: detailsPayload,
  });
}

export async function logAdminActivity(
  adminId: string,
  adminName: string,
  actionType: string,
  targetSection: string | null,
  details: Record<string, unknown>,
) {
  await supabase.from('admin_activity_log').insert({
    admin_id: adminId,
    admin_name: adminName,
    action_type: actionType,
    target_section: targetSection,
    details,
  });
}
