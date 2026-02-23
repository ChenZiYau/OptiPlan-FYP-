import { useState, useEffect, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Habit {
  id: string;
  label: string;
  desc: string;
  iconName: string;
}

export interface HabitWithIcon extends Omit<Habit, 'iconName'> {
  icon: LucideIcon;
  iconName: string;
}

const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', label: 'Drink Water', iconName: 'Droplets', desc: 'Stay hydrated throughout the day' },
  { id: 'h2', label: 'Read 10 mins', iconName: 'BookOpen', desc: 'Read something non-academic' },
  { id: 'h3', label: 'Deep Work', iconName: 'BrainCircuit', desc: '1 focused block with no distractions' },
  { id: 'h4', label: 'Move Your Body', iconName: 'Heart', desc: 'Walk, stretch, or exercise' },
  { id: 'h5', label: 'Plan Tomorrow', iconName: 'Calendar', desc: 'Set your top 3 tasks for tomorrow' },
];

export function resolveIcon(iconName: string): LucideIcon {
  const Icon = (LucideIcons as any)[iconName];
  return Icon || LucideIcons.CheckCircle;
}

const STORAGE_KEY = 'optiplan-custom-habits';

export function useHabits() {
  const [habits, setHabits] = useState<HabitWithIcon[]>([]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const COMPLETED_STORAGE_KEY = `optiplan-completed-habits-${todayKey}`;
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());

  // Load from local storage or use defaults
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let parsed: Habit[] = stored ? JSON.parse(stored) : [];
    if (parsed.length === 0) {
      parsed = DEFAULT_HABITS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    setHabits(parsed.map(h => ({ ...h, icon: resolveIcon(h.iconName) })));

    // Load completed habits for today
    const storedCompleted = localStorage.getItem(COMPLETED_STORAGE_KEY);
    if (storedCompleted) {
      setCompletedHabits(new Set(JSON.parse(storedCompleted)));
    }
  }, [COMPLETED_STORAGE_KEY]);

  const saveHabits = useCallback((newHabits: HabitWithIcon[]) => {
    setHabits(newHabits);
    const toSave: Habit[] = newHabits.map(({ icon, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id'>) => {
    const newHabit: HabitWithIcon = {
      ...habit,
      id: crypto.randomUUID(),
      icon: resolveIcon(habit.iconName),
    };
    saveHabits([...habits, newHabit]);
  }, [habits, saveHabits]);

  const removeHabit = useCallback((id: string) => {
    saveHabits(habits.filter(h => h.id !== id));
  }, [habits, saveHabits]);

  const toggleHabit = useCallback((id: string) => {
    setCompletedHabits(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [COMPLETED_STORAGE_KEY]);

  return { habits, addHabit, removeHabit, completedHabits, toggleHabit };
}
