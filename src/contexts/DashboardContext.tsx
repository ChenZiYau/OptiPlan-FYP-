import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { DashboardItem, ScheduleEntry } from '@/types/dashboard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface DashboardContextValue {
  // Modal
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;

  // Items (tasks, events, study)
  items: DashboardItem[];
  addItem: (item: DashboardItem) => void;

  // Schedule entries (timetable)
  schedules: ScheduleEntry[];
  addSchedule: (entry: ScheduleEntry) => void;
  removeSchedule: (id: string) => void;

  // Loading
  loading: boolean;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase when user is available
  useEffect(() => {
    if (!user) {
      setItems([]);
      setSchedules([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      supabase.from('dashboard_items').select('*').eq('user_id', user.id),
      supabase.from('schedule_entries').select('*').eq('user_id', user.id),
    ]).then(([itemsRes, schedulesRes]) => {
      if (itemsRes.data) {
        setItems(itemsRes.data.map(rowToItem));
      }
      if (schedulesRes.data) {
        setSchedules(schedulesRes.data.map(rowToSchedule));
      }
      setLoading(false);
    });
  }, [user]);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const addItem = useCallback(
    async (item: DashboardItem) => {
      // Optimistic update
      setItems((prev) => [...prev, item]);

      if (!user) return;

      const row: Record<string, unknown> = {
        id: item.id,
        user_id: user.id,
        type: item.type,
        title: item.title,
        description: item.description,
        date: item.date,
        importance: item.importance,
        color: item.color,
      };

      if (item.type === 'event' || item.type === 'study') {
        row.start_time = item.startTime;
        row.end_time = item.endTime;
      }
      if (item.type === 'study') {
        row.subject = item.subject;
      }

      const { error } = await supabase.from('dashboard_items').insert(row);
      if (error) {
        // Rollback on failure
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    },
    [user],
  );

  const addSchedule = useCallback(
    async (entry: ScheduleEntry) => {
      setSchedules((prev) => [...prev, entry]);

      if (!user) return;

      const { error } = await supabase.from('schedule_entries').insert({
        id: entry.id,
        user_id: user.id,
        subject_name: entry.subjectName,
        color: entry.color,
        days: entry.days,
        start_time: entry.startTime,
        end_time: entry.endTime,
      });
      if (error) {
        setSchedules((prev) => prev.filter((s) => s.id !== entry.id));
      }
    },
    [user],
  );

  const removeSchedule = useCallback(
    async (id: string) => {
      setSchedules((prev) => prev.filter((s) => s.id !== id));

      if (!user) return;

      const { error } = await supabase.from('schedule_entries').delete().eq('id', id);
      if (error) {
        // Re-fetch on failure to restore state
        const { data } = await supabase.from('schedule_entries').select('*').eq('user_id', user.id);
        if (data) setSchedules(data.map(rowToSchedule));
      }
    },
    [user],
  );

  return (
    <DashboardContext.Provider value={{ isModalOpen, openModal, closeModal, items, addItem, schedules, addSchedule, removeSchedule, loading }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

// ── Row mappers (snake_case → camelCase) ────────────────────────────────────

function rowToItem(row: Record<string, unknown>): DashboardItem {
  const base = {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    date: row.date as string,
    importance: row.importance as 1 | 2 | 3,
    color: row.color as string,
  };

  const type = row.type as string;

  if (type === 'event') {
    return { ...base, type: 'event', startTime: row.start_time as string, endTime: row.end_time as string };
  }
  if (type === 'study') {
    return { ...base, type: 'study', startTime: row.start_time as string, endTime: row.end_time as string, subject: row.subject as string };
  }
  return { ...base, type: 'task' };
}

function rowToSchedule(row: Record<string, unknown>): ScheduleEntry {
  return {
    id: row.id as string,
    subjectName: row.subject_name as string,
    color: row.color as string,
    days: row.days as number[],
    startTime: row.start_time as string,
    endTime: row.end_time as string,
  };
}
