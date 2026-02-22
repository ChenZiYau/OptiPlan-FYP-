import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckSquare, CalendarDays, BookOpen, GraduationCap } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import type { DashboardItem, ScheduleEntry } from '@/types/dashboard';

const WEEKDAYS_SUN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const importanceLabels: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High' };
const importanceColors: Record<number, string> = { 1: '#22c55e', 2: '#f59e0b', 3: '#ef4444' };

const typeIcons = {
  task: CheckSquare,
  event: CalendarDays,
  study: BookOpen,
};

interface InteractiveCalendarProps {
  showSchedules?: boolean;
  mondayFirst?: boolean;
}

export function InteractiveCalendar({ showSchedules = false, mondayFirst = false }: InteractiveCalendarProps) {
  const { items, schedules: allSchedules } = useDashboard();
  const schedules = showSchedules ? allSchedules : [];

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!selectedDate) return;
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedDate(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [selectedDate]);

  // Build lookup: date → items
  const itemsByDate = useMemo(() => {
    const map = new Map<string, DashboardItem[]>();
    for (const item of items) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [items]);

  // Build lookup: dayOfWeek → schedule entries
  const schedulesByDay = useMemo(() => {
    const map = new Map<number, ScheduleEntry[]>();
    for (const s of schedules) {
      for (const d of s.days) {
        const list = map.get(d) ?? [];
        list.push(s);
        map.set(d, list);
      }
    }
    return map;
  }, [schedules]);

  // Get items and schedules for a specific date
  function getDateItems(dateISO: string, dayOfWeek: number) {
    const dateItems = itemsByDate.get(dateISO) ?? [];
    const daySchedules = schedulesByDay.get(dayOfWeek) ?? [];
    return { dateItems, daySchedules };
  }

  // Get dot colors for a date
  function getDotsForDate(dateISO: string, dayOfWeek: number): string[] {
    const { dateItems, daySchedules } = getDateItems(dateISO, dayOfWeek);
    const colors: string[] = [];
    const seen = new Set<string>();
    for (const item of dateItems) {
      if (!seen.has(item.color)) {
        seen.add(item.color);
        colors.push(item.color);
      }
    }
    for (const s of daySchedules) {
      if (!seen.has(s.color)) {
        seen.add(s.color);
        colors.push(s.color);
      }
    }
    return colors.slice(0, 4);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    setSelectedDate(null);
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    setSelectedDate(null);
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const goToCurrentMonth = () => {
    setSelectedDate(null);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  const weekdays = mondayFirst ? WEEKDAYS_MON : WEEKDAYS_SUN;

  // Build the grid cells — adjust offset when Monday is first day
  const cells: (number | null)[] = [];
  const offset = mondayFirst ? (firstDay === 0 ? 6 : firstDay - 1) : firstDay;
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-xl bg-[#18162e] border border-white/10 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/20 transition-colors"
            >
              Current
            </button>
          )}
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 relative">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const dateISO = toISO(viewYear, viewMonth, day);
          const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
          const dots = getDotsForDate(dateISO, dayOfWeek);
          const isToday = dateISO === todayISO;
          const isSelected = dateISO === selectedDate;

          return (
            <div key={dateISO} className="relative">
              <button
                onClick={() => setSelectedDate(isSelected ? null : dateISO)}
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white'
                    : isToday
                      ? 'bg-purple-500/20 text-purple-300 font-semibold'
                      : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span>{day}</span>
                {dots.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dots.map((c, j) => (
                      <div key={j} className="w-1 h-1 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}
              </button>

              {/* Popover */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 w-64 bg-[#1e1b3a] border border-white/10 rounded-xl shadow-2xl p-3"
                  >
                    <p className="text-xs font-semibold text-white mb-2">
                      {new Date(viewYear, viewMonth, day).toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>

                    {(() => {
                      const { dateItems, daySchedules } = getDateItems(dateISO, dayOfWeek);
                      const hasContent = dateItems.length > 0 || daySchedules.length > 0;

                      if (!hasContent) {
                        return <p className="text-xs text-gray-500">No items for this day</p>;
                      }

                      return (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {dateItems.map((item) => {
                            const Icon = typeIcons[item.type];
                            return (
                              <div key={item.id} className="flex items-start gap-2 p-1.5 rounded-lg bg-white/[0.03]">
                                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${item.color}20` }}>
                                  <Icon className="w-3 h-3" style={{ color: item.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-white truncate">{item.title}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] capitalize text-gray-500">{item.type}</span>
                                    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: importanceColors[item.importance] }} />
                                    <span className="text-[10px]" style={{ color: importanceColors[item.importance] }}>
                                      {importanceLabels[item.importance]}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {daySchedules.map((s) => (
                            <div key={s.id} className="flex items-start gap-2 p-1.5 rounded-lg bg-white/[0.03]">
                              <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${s.color}20` }}>
                                <GraduationCap className="w-3 h-3" style={{ color: s.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white truncate">{s.subjectName}</p>
                                <p className="text-[10px] text-gray-500">{s.startTime} – {s.endTime}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
