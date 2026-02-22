import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, CalendarDays, BookOpen } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import { ImportanceSlider } from './ImportanceSlider';
import type { ItemType, Importance, DashboardItem } from '@/types/dashboard';

const tabs: { key: ItemType; label: string; icon: typeof CheckSquare }[] = [
  { key: 'task', label: 'Task', icon: CheckSquare },
  { key: 'event', label: 'Event', icon: CalendarDays },
  { key: 'study', label: 'Study', icon: BookOpen },
];

const TYPE_COLORS: Record<ItemType, string> = {
  task: '#a855f7',
  event: '#ec4899',
  study: '#3b82f6',
};

function formatTodayISO() {
  return new Date().toISOString().slice(0, 10);
}
function formatTomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

type DatePreset = 'today' | 'tomorrow' | 'custom';

export function TaskModal() {
  const { isModalOpen, closeModal, addItem } = useDashboard();

  const [activeTab, setActiveTab] = useState<ItemType>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState(formatTodayISO());
  const [importance, setImportance] = useState<Importance>(2);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subject, setSubject] = useState('');

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setDatePreset('today');
    setCustomDate(formatTodayISO());
    setImportance(2);
    setStartTime('09:00');
    setEndTime('10:00');
    setSubject('');
  }, []);

  const resolvedDate = datePreset === 'today' ? formatTodayISO() : datePreset === 'tomorrow' ? formatTomorrowISO() : customDate;

  const handleSubmit = () => {
    if (!title.trim()) return;

    const base = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      date: resolvedDate,
      importance,
      color: TYPE_COLORS[activeTab],
    };

    let item: DashboardItem;
    if (activeTab === 'task') {
      item = { ...base, type: 'task' };
    } else if (activeTab === 'event') {
      item = { ...base, type: 'event', startTime, endTime };
    } else {
      item = { ...base, type: 'study', startTime, endTime, subject: subject.trim() };
    }

    addItem(item);
    resetForm();
    closeModal();
  };

  const handleClose = () => {
    resetForm();
    closeModal();
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-[#18162e] border border-white/10 rounded-xl max-w-lg w-full p-6 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={activeTab === 'task' ? 'What needs to be done?' : activeTab === 'event' ? 'Event name' : 'Study session name'}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Add details..."
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none"
                />
              </div>

              {/* Smart date selector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
                <div className="flex gap-2">
                  {(['today', 'tomorrow', 'custom'] as DatePreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setDatePreset(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                        datePreset === preset
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {datePreset === 'custom' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="mt-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500/50 transition-all [color-scheme:dark]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Time pickers (event + study only) */}
              <AnimatePresence>
                {(activeTab === 'event' || activeTab === 'study') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Time</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500/50 transition-all [color-scheme:dark]"
                      />
                      <span className="text-gray-500 text-xs">to</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Subject (study only) */}
              <AnimatePresence>
                {activeTab === 'study' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Calculus 101"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Importance */}
              <ImportanceSlider value={importance} onChange={setImportance} />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
