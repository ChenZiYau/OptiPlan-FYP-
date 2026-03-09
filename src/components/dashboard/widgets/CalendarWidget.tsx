import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, GraduationCap, Clock } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import type { DashboardItem, ScheduleEntry } from '@/types/dashboard';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`;
}

const importanceColors: Record<number, { text: string; bg: string; border: string }> = {
  1: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  2: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  3: { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};
const importanceLabels: Record<number, string> = { 1: 'Low', 2: 'Medium', 3: 'High' };
const typeEmojis: Record<string, string> = { task: '\ud83d\udcdd', event: '\ud83d\udcc5', study: '\ud83d\udcda' };
const typeLabels: Record<string, string> = { task: 'TASK', event: 'EVENT', study: 'STUDY' };

interface CalendarWidgetProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function CalendarWidget({ isExpanded, onToggleExpand }: CalendarWidgetProps) {
  const { items, schedules } = useDashboard();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  const itemsByDate = useMemo(() => {
    const map = new Map<string, DashboardItem[]>();
    for (const item of items) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [items]);

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

  function getDateItems(dateISO: string, dayOfWeek: number) {
    return {
      dateItems: itemsByDate.get(dateISO) ?? [],
      daySchedules: schedulesByDay.get(dayOfWeek) ?? [],
    };
  }

  function getPillsForDate(dateISO: string, dayOfWeek: number) {
    const { dateItems, daySchedules } = getDateItems(dateISO, dayOfWeek);
    const pills: { label: string; color: string }[] = [];
    for (const item of dateItems) {
      pills.push({ label: item.title, color: item.color });
    }
    for (const s of daySchedules) {
      const words = s.subjectName.split(/\s+/);
      const abbr = words.length > 1 ? words.map(w => w[0]).join('').toUpperCase() : s.subjectName.slice(0, 4).toUpperCase();
      pills.push({ label: abbr, color: s.color });
    }
    return pills.slice(0, isExpanded ? 3 : 2);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const monthLabel = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => { setSelectedDate(null); if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { setSelectedDate(null); if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const goToCurrentMonth = () => { setSelectedDate(null); setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={`rounded-2xl bg-[#18162e] border border-white/10 p-5 hover:border-white/20 transition-colors ${
        isExpanded ? 'md:col-span-2 xl:col-span-2 md:row-span-2' : 'col-span-1 row-span-1'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {!isCurrentMonth && (
            <button onClick={goToCurrentMonth} className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/20 transition-colors">
              Current
            </button>
          )}
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleExpand}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors ml-1"
            title={isExpanded ? 'Compact view' : 'Expand view'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px relative">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className={isExpanded ? 'min-h-[72px]' : 'min-h-[40px]'} />;

          const dateISO = toISO(viewYear, viewMonth, day);
          const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
          const pills = getPillsForDate(dateISO, dayOfWeek);
          const isToday = dateISO === todayISO;
          const isSelected = dateISO === selectedDate;
          const { dateItems, daySchedules } = getDateItems(dateISO, dayOfWeek);
          const totalItems = dateItems.length + daySchedules.length;
          const overflowCount = totalItems - (isExpanded ? 3 : 2);

          return (
            <div key={dateISO} className="relative">
              <button
                onClick={() => setSelectedDate(isSelected ? null : dateISO)}
                className={`w-full flex flex-col items-start p-1 rounded-lg text-sm transition-all ${
                  isExpanded ? 'min-h-[72px]' : 'min-h-[40px]'
                } ${
                  isSelected ? 'bg-purple-600/20 ring-1 ring-purple-500/50'
                    : isToday ? 'bg-purple-500/10'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                <span className={`text-xs font-medium ml-0.5 ${
                  isToday ? 'bg-purple-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold'
                    : isSelected ? 'text-purple-300 font-semibold'
                    : 'text-gray-400'
                }`}>{day}</span>

                {/* Event pills — only in expanded mode */}
                {isExpanded && pills.length > 0 && (
                  <div className="w-full mt-0.5 space-y-0.5">
                    {pills.map((pill, j) => (
                      <div
                        key={j}
                        className="truncate text-[9px] leading-tight px-1 py-[1px] rounded-sm w-full text-left font-medium"
                        style={{ backgroundColor: `${pill.color}20`, color: pill.color }}
                      >{pill.label}</div>
                    ))}
                    {overflowCount > 0 && <div className="text-[9px] text-gray-500 pl-1">+{overflowCount} more</div>}
                  </div>
                )}

                {/* Compact dot indicators */}
                {!isExpanded && totalItems > 0 && (
                  <div className="flex gap-0.5 mt-0.5 ml-0.5">
                    {pills.slice(0, 3).map((pill, j) => (
                      <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pill.color }} />
                    ))}
                  </div>
                )}
              </button>

              {/* Popover */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    ref={popoverRef}
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-50 top-full mt-1.5 left-1/2 -translate-x-1/2 w-64 bg-[#131127] border border-white/10 rounded-xl shadow-2xl shadow-black/60 flex flex-col text-center overflow-hidden"
                  >
                    <div className="px-4 pt-4 pb-3 border-b border-white/10">
                      <p className="text-sm font-bold text-white">
                        {new Date(viewYear, viewMonth, day).toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-purple-400 font-medium mt-0.5">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
                    </div>
                    <div className="px-4 py-3 max-h-64 overflow-y-auto">
                      {totalItems === 0 ? (
                        <p className="text-xs text-gray-500 py-2">No items for this day</p>
                      ) : (
                        <div className="space-y-4">
                          {dateItems.map(item => {
                            const impStyle = importanceColors[item.importance];
                            const hasTime = item.type !== 'task' && 'startTime' in item;
                            const hasSubject = item.type === 'study' && 'subject' in item;
                            return (
                              <div key={item.id} className="py-1">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-xs">{typeEmojis[item.type]}</span>
                                  <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">{typeLabels[item.type]}</span>
                                </div>
                                <p className="text-lg font-bold text-white mt-1">{item.title}</p>
                                <div className={`${impStyle.bg} ${impStyle.text} ${impStyle.border} border rounded-full px-3 py-1 text-xs mx-auto mt-2 w-max font-medium`}>
                                  {importanceLabels[item.importance]}
                                </div>
                                {hasTime && (
                                  <div className="bg-[#18162e] text-white rounded-full px-3 py-1.5 text-xs mx-auto mt-3 w-max flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span>{formatTime12h((item as { startTime: string }).startTime)} – {formatTime12h((item as { endTime: string }).endTime)}</span>
                                  </div>
                                )}
                                {hasSubject && <p className="text-purple-400 text-sm mt-3">{(item as { subject: string }).subject}</p>}
                              </div>
                            );
                          })}
                          {daySchedules.map(s => (
                            <div key={s.id} className="py-1">
                              <div className="flex items-center justify-center gap-1.5">
                                <GraduationCap className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">CLASS</span>
                              </div>
                              <p className="text-lg font-bold text-white mt-1">{s.subjectName}</p>
                              <div className="bg-[#18162e] text-white rounded-full px-3 py-1.5 text-xs mx-auto mt-3 w-max flex items-center gap-2">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span>{formatTime12h(s.startTime)} – {formatTime12h(s.endTime)}</span>
                              </div>
                              <div className="flex items-center justify-center gap-1.5 mt-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                <span className="text-sm" style={{ color: s.color }}>{s.subjectName}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
