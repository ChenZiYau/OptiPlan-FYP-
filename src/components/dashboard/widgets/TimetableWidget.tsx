import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, MapPin } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import type { ScheduleEntry } from '@/types/dashboard';
import { Link } from 'react-router-dom';

function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Static placeholder rooms for schedule entries that don't have a room field
const ROOMS = ['Room 301', 'Room 204', 'Lab A2', 'Room 105', 'Lecture Hall B', 'Room 412'];

export function TimetableWidget() {
  const { schedules } = useDashboard();

  const todayClasses = useMemo(() => {
    const today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    return schedules
      .filter(s => s.days.includes(today))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules]);

  return (
    <motion.div
      layout
      className="rounded-2xl bg-[#18162e] border border-white/10 p-5 hover:border-white/20 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Today's Classes</h3>
        </div>
        <Link to="/dashboard/schedules" className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-medium">
          Full Schedule →
        </Link>
      </div>

      {/* Timeline */}
      {todayClasses.length === 0 ? (
        <div className="text-center py-8">
          <CalendarDays className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No classes today.</p>
          <p className="text-[10px] text-gray-600 mt-1">Add classes in the Schedules page.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {todayClasses.map((cls, idx) => (
            <TimetableRow key={cls.id} entry={cls} room={ROOMS[idx % ROOMS.length]} isLast={idx === todayClasses.length - 1} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TimetableRow({ entry, room, isLast }: { entry: ScheduleEntry; room: string; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center pt-1">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
        {!isLast && <div className="w-px flex-1 my-1" style={{ backgroundColor: `${entry.color}40` }} />}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
        <p className="text-sm font-semibold text-white leading-tight">{entry.subjectName}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {room}
          </span>
        </div>
        <div
          className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium"
          style={{ backgroundColor: `${entry.color}15`, color: entry.color }}
        >
          {formatTime12h(entry.startTime)} – {formatTime12h(entry.endTime)}
        </div>
      </div>
    </div>
  );
}
