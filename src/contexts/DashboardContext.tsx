import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode, MutableRefObject } from 'react';
import type { DashboardItem, ScheduleEntry, Importance, ItemType } from '@/types/dashboard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export type TaskStatusChangeCallback = (
  taskId: string,
  oldStatus: string,
  newStatus: string,
  importance: Importance,
  itemType: ItemType,
) => void;

interface DashboardContextValue {
  // Modal
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;

  // Items (tasks, events, study)
  items: DashboardItem[];
  addItem: (item: DashboardItem) => void;
  updateItem: (id: string, updates: Partial<DashboardItem>) => void;
  removeItem: (id: string) => void;

  // Schedule entries (timetable)
  schedules: ScheduleEntry[];
  addSchedule: (entry: ScheduleEntry) => void;
  removeSchedule: (id: string) => void;

  // Loading
  loading: boolean;

  // Task status change callback (used by gamification)
  onTaskStatusChange: MutableRefObject<TaskStatusChangeCallback | null>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onTaskStatusChange = useRef<TaskStatusChangeCallback | null>(null);

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
        status: item.status ?? 'todo',
        notes: item.notes ?? [],
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

  const updateItem = useCallback(
    async (id: string, updates: Partial<DashboardItem>) => {
      const snapshot = itemsRef.current;

      // Detect task status change for gamification
      if (updates.status) {
        const currentItem = itemsRef.current.find((i) => i.id === id);
        if (currentItem) {
          const oldStatus = currentItem.status ?? 'todo';
          if (oldStatus !== updates.status && onTaskStatusChange.current) {
            onTaskStatusChange.current(id, oldStatus, updates.status, currentItem.importance, currentItem.type);
          }
        }
      }

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } as DashboardItem : item)),
      );

      if (!user) return;

      const row: Record<string, unknown> = {};
      if (updates.title !== undefined) row.title = updates.title;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.date !== undefined) row.date = updates.date;
      if (updates.importance !== undefined) row.importance = updates.importance;
      if (updates.color !== undefined) row.color = updates.color;
      if (updates.status !== undefined) row.status = updates.status;
      if (updates.notes !== undefined) row.notes = updates.notes;

      const { error } = await supabase.from('dashboard_items').update(row).eq('id', id);
      if (error) {
        setItems(snapshot);
      }
    },
    [user],
  );

  const removeItem = useCallback(
    async (id: string) => {
      const snapshot = itemsRef.current;
      setItems((prev) => prev.filter((item) => item.id !== id));

      if (!user) return;

      const { error } = await supabase.from('dashboard_items').delete().eq('id', id);
      if (error) {
        setItems(snapshot);
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
    <DashboardContext.Provider value={{ isModalOpen, openModal, closeModal, items, addItem, updateItem, removeItem, schedules, addSchedule, removeSchedule, loading, onTaskStatusChange }}>
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
    status: (row.status as 'todo' | 'in-progress' | 'completed') ?? 'todo',
    notes: (row.notes as { id: string; text: string; createdAt: string }[]) ?? [],
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
