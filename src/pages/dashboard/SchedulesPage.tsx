import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2 } from 'lucide-react';
import { uuid } from '@/lib/utils';
import { HoverTip } from '@/components/HoverTip';
import { useDashboard } from '@/contexts/DashboardContext';
import { InteractiveCalendar } from '@/components/dashboard/InteractiveCalendar';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Mon–Sun order for the timetable grid
const TIMETABLE_ORDER = [1, 2, 3, 4, 5, 6, 0]; // dayIndex: Mon=1 … Sat=6, Sun=0
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

const PRESET_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];

const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
];

const DURATIONS = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
];

function formatSlot(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${hour12}${period}` : `${hour12}:${m.toString().padStart(2, '0')}${period}`;
}

function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
}

function timeToHour(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

function formatHour(h: number) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour} ${period}`;
}

export function SchedulesPage() {
  const { schedules, addSchedule, removeSchedule } = useDashboard();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [subjectName, setSubjectName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [activeDuration, setActiveDuration] = useState(90); // minutes
  const [tooltip, setTooltip] = useState<{ entry: typeof schedules[0]; x: number; y: number } | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showTooltip = (entry: typeof schedules[0], e: React.MouseEvent) => {
    clearTimeout(tooltipTimeout.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ entry, x: rect.left + rect.width / 2, y: rect.top });
  };
  const hideTooltip = () => {
    tooltipTimeout.current = setTimeout(() => setTooltip(null), 100);
  };

  const resetForm = () => {
    setSubjectName('');
    setColor(PRESET_COLORS[0]);
    setSelectedDays([]);
    setStartTime('09:00');
    setEndTime('10:30');
    setActiveDuration(90);
  };

  const toggleDay = (d: number) => {
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const handleAdd = () => {
    if (!subjectName.trim() || selectedDays.length === 0) return;
    addSchedule({
      id: uuid(),
      subjectName: subjectName.trim(),
      color,
      days: selectedDays.sort(),
      startTime,
      endTime,
    });
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Weekly Schedule</h2>
          <p className="text-sm text-gray-500 mt-0.5">{schedules.length} subject{schedules.length !== 1 ? 's' : ''} scheduled</p>
        </div>
        <HoverTip label="Add a new class or event">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </HoverTip>
      </div>

      {/* Add subject form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-[#18162e] border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">New Subject</h3>
                <button onClick={() => { resetForm(); setShowForm(false); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Subject Name</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Calculus 101"
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-all"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Color</label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((c) => (
                    <HoverTip key={c} label="Choose a color for this entry">
                      <button
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#18162e] scale-110' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    </HoverTip>
                  ))}
                </div>
              </div>

              {/* Days */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Days</label>
                <div className="flex gap-1.5">
                  {DAYS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedDays.includes(i)
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Duration</label>
                <div className="flex gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.minutes}
                      type="button"
                      onClick={() => { setActiveDuration(d.minutes); setEndTime(addMinutes(startTime, d.minutes)); }}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        activeDuration === d.minutes
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start time */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Start Time
                  <span className="ml-2 text-purple-400 font-normal">{formatSlot(startTime)} – {formatSlot(endTime)}</span>
                </label>
                <div className="flex gap-1.5 flex-wrap max-h-[72px] overflow-y-auto rounded-lg scrollbar-thin scrollbar-thumb-white/10">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => { setStartTime(slot); setEndTime(addMinutes(slot, activeDuration)); }}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                        startTime === slot
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {formatSlot(slot)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!subjectName.trim() || selectedDays.length === 0}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                Add to Schedule
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar + Timetable side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_2fr] gap-6">
        {/* Calendar */}
        <div className="space-y-6">
          <InteractiveCalendar mondayFirst />

          {/* Subject list */}
          {schedules.length > 0 && (
            <div className="rounded-xl bg-[#18162e] border border-white/10 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Subjects</h3>
              <div className="space-y-2">
                {schedules.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{s.subjectName}</p>
                      <p className="text-xs text-gray-500">
                        {s.days.map((d) => DAYS[d]).join(', ')} · {s.startTime} – {s.endTime}
                      </p>
                    </div>
                    <button
                      onClick={() => removeSchedule(s.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {schedules.length === 0 && (
            <div className="rounded-xl bg-[#18162e] border border-white/10 p-6 text-center">
              <p className="text-sm text-gray-500">No subjects yet. Click "Add Subject" to create your first class.</p>
            </div>
          )}
        </div>

        {/* Timetable grid — days as rows, hours as columns */}
        <div className="rounded-xl bg-[#18162e] border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              {/* Time header row */}
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sticky left-0 z-10 bg-[#18162e] p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left w-16">Day</th>
                  {HOURS.map((hour) => (
                    <th key={hour} className="p-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                      {formatHour(hour)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMETABLE_ORDER.map((dayIndex) => (
                  <tr key={dayIndex} className="border-b border-white/[0.04]">
                    <td className="sticky left-0 z-10 bg-[#18162e] p-3 text-xs font-semibold text-gray-400">{DAYS[dayIndex]}</td>
                    {HOURS.map((hour) => {
                      const entries = schedules.filter((s) => {
                        if (!s.days.includes(dayIndex)) return false;
                        const start = timeToHour(s.startTime);
                        const end = timeToHour(s.endTime);
                        return hour >= start && hour < end;
                      });

                      if (entries.length === 0) {
                        return <td key={hour} className="min-w-[60px] h-[44px]" />;
                      }

                      return (
                        <td key={hour} className="min-w-[60px] h-[44px] p-0">
                          {entries.map((entry) => {
                            const startH = timeToHour(entry.startTime);
                            const endH = timeToHour(entry.endTime);
                            const isFirst = Math.floor(startH) === hour;
                            const isLast = hour + 1 >= endH;

                            return (
                              <div
                                key={entry.id}
                                onMouseEnter={(e) => showTooltip(entry, e)}
                                onMouseLeave={hideTooltip}
                                className={`h-full min-h-[44px] flex items-center text-[10px] font-semibold text-white cursor-default transition-all ${
                                  isFirst ? 'rounded-l-md pl-2 border-l-[3px]' : ''
                                } ${isLast ? 'rounded-r-md' : ''}`}
                                style={{
                                  backgroundColor: `${entry.color}60`,
                                  borderLeftColor: isFirst ? entry.color : undefined,
                                }}
                              >
                                {isFirst && (
                                  <span className="truncate drop-shadow-sm">{entry.subjectName}</span>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tooltip portal — renders above everything */}
      {tooltip && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-[#1e1b3a] border border-white/15 shadow-2xl shadow-black/50 whitespace-nowrap animate-in fade-in duration-150"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%) translateY(-8px)' }}
        >
          <div className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 ring-2 ring-white/20" style={{ backgroundColor: tooltip.entry.color }} />
          <div className="space-y-1">
            <p className="text-sm font-bold text-white leading-tight">{tooltip.entry.subjectName}</p>
            <p className="text-xs text-gray-300">
              <span className="font-semibold text-white">{formatSlot(tooltip.entry.startTime)}</span>
              <span className="text-gray-500 mx-1">→</span>
              <span className="font-semibold text-white">{formatSlot(tooltip.entry.endTime)}</span>
            </p>
            <p className="text-[11px] text-gray-500">{(timeToHour(tooltip.entry.endTime) - timeToHour(tooltip.entry.startTime))}h duration</p>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
