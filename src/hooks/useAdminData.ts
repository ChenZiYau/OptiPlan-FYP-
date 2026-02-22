import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdminUser, Feedback, RecentActivity } from '@/types/admin';

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, email, display_name, role, created_at')
      .order('created_at', { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return { users, loading, refetch: fetchUsers };
}

export function useAdminFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    setFeedback(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  return { feedback, loading, refetch: fetchFeedback };
}

export function useAdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    regularUsers: 0,
    adminUsers: 0,
    totalFeedback: 0,
    bugReports: 0,
    featureRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [profilesRes, feedbackRes] = await Promise.all([
        supabase.from('profiles').select('role'),
        supabase.from('feedback').select('category'),
      ]);

      const profiles = profilesRes.data ?? [];
      const fb = feedbackRes.data ?? [];

      setStats({
        totalUsers: profiles.length,
        regularUsers: profiles.filter((p) => p.role === 'user').length,
        adminUsers: profiles.filter((p) => p.role === 'admin').length,
        totalFeedback: fb.length,
        bugReports: fb.filter((f) => f.category === 'bug').length,
        featureRequests: fb.filter((f) => f.category === 'feature').length,
      });
      setLoading(false);
    }
    fetch();
  }, []);

  return { stats, loading };
}

export function useRecentActivity() {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const items: RecentActivity[] = (data ?? []).map((u) => ({
        id: u.id,
        user_name: u.display_name ?? u.email.split('@')[0],
        user_email: u.email,
        action: 'joined OptiPlan',
        created_at: u.created_at,
      }));

      setActivities(items);
      setLoading(false);
    }
    fetch();
  }, []);

  return { activities, loading };
}
