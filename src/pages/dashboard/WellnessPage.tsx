import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  PenLine, X, Heart, Smile, TrendingUp,
} from 'lucide-react';
import { HoverTip } from '@/components/HoverTip';
import { HabitManagerModal } from '@/components/dashboard/wellness/HabitManagerModal';
import { useHabits } from '@/hooks/useHabits';

// ── Types & Data ────────────────────────────────────────────────────────────

const MOODS = [
  { emoji: '\uD83D\uDE22', label: 'Awful', color: 'from-red-500 to-rose-500' },
  { emoji: '\uD83D\uDE15', label: 'Meh', color: 'from-orange-500 to-amber-500' },
  { emoji: '\uD83D\uDE10', label: 'Okay', color: 'from-yellow-500 to-amber-400' },
  { emoji: '\uD83D\uDE42', label: 'Good', color: 'from-emerald-500 to-green-400' },
  { emoji: '\uD83E\uDD29', label: 'Great', color: 'from-purple-500 to-pink-500' },
];

interface JournalEntry {
  id: string;
  date: string;
  text: string;
  mood: number | null;
  habitsCompleted: string[];
}

// Past 7 days mock mood log for the chart
const MOOD_HISTORY = [null, null, null, null, null, null, null];
const PAST_LABELS = (() => {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  return days;
})();

const MOCK_ENTRIES: JournalEntry[] = [];

// ── Component ───────────────────────────────────────────────────────────────

export function WellnessPage() {
  const { habits, addHabit, removeHabit, completedHabits, toggleHabit } = useHabits();
  const todayKey = new Date().toISOString().slice(0, 10);
  const [selectedMood, setSelectedMood] = useState<number | null>(() => {
    const stored = localStorage.getItem(`wellness-mood-${todayKey}`);
    return stored ? parseInt(stored, 10) : null;
  });
  const [journalOpen, setJournalOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [journalText, setJournalText] = useState(() => localStorage.getItem(`wellness-journal-${todayKey}`) ?? '');
  const [entries] = useState<JournalEntry[]>(MOCK_ENTRIES);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const journalTextRef = useRef(journalText);

  useEffect(() => {
    if (selectedMood !== null) {
      localStorage.setItem(`wellness-mood-${todayKey}`, selectedMood.toString());
    }
  }, [selectedMood, todayKey]);

  const handleJournalChange = useCallback((value: string) => {
    setJournalText(value);
    journalTextRef.current = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(`wellness-journal-${todayKey}`, value);
      console.log('[auto-save] journal entry saved');
    }, 1500);
  }, [todayKey]);

  // Save immediately on unmount so navigation doesn't lose unsaved text
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      localStorage.setItem(`wellness-journal-${todayKey}`, journalTextRef.current);
    };
  }, [todayKey]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const habitsComplete = completedHabits.size;
  const habitsTotal = habits.length;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Wellness & Journal</h1>
          <p className="text-sm text-gray-500 mt-1">{today}</p>
        </div>
        <HoverTip label="Write a private journal entry for today">
          <button
            onClick={() => setJournalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <PenLine className="w-4 h-4" /> Open Daily Journal
          </button>
        </HoverTip>
      </div>

      {/* ── Top Stats Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl bg-[#18162e] border border-white/10 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Smile className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Today's Mood</span>
          </div>
          <div className="text-3xl">
            {selectedMood !== null ? MOODS[selectedMood].emoji : <span className="text-gray-600">—</span>}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {selectedMood !== null ? MOODS[selectedMood].label : 'Not logged yet'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-[#18162e] border border-white/10 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="text-xs text-gray-400">Habits Today</span>
          </div>
          <div className="text-3xl font-bold text-white">{habitsComplete}<span className="text-lg text-gray-600">/{habitsTotal}</span></div>
          <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
              animate={{ width: `${habitsTotal > 0 ? (habitsComplete / habitsTotal) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl bg-[#18162e] border border-white/10 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-400">Journal Entries</span>
          </div>
          <div className="text-3xl font-bold text-white">{entries.length + (journalText.trim() ? 1 : 0)}</div>
          <p className="text-xs text-gray-500 mt-1">this week</p>
        </motion.div>
      </div>

      {/* ── Main Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column: Mood + Habits ─────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Mood Selector */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-[#18162e] border border-white/10 p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-1">How are you feeling today?</h3>
            <p className="text-xs text-gray-500 mb-4">Tap to log your mood</p>
            <div className="flex justify-between gap-2">
              {MOODS.map((mood, i) => (
                <HoverTip key={i} label={`Log as ${mood.label}`}>
                  <button
                    onClick={() => { setSelectedMood(i); toast.success(`Mood logged: ${mood.label} ${mood.emoji}`); }}
                    className="flex-1 flex flex-col items-center gap-1.5 group"
                  >
                    <div className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                      selectedMood === i
                        ? `ring-2 ring-purple-500 ring-offset-2 ring-offset-[#18162e] scale-110 bg-gradient-to-br ${mood.color}`
                        : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      {mood.emoji}
                    </div>
                    <span className={`text-[10px] transition-colors ${selectedMood === i ? 'text-purple-400 font-semibold' : 'text-gray-600'}`}>
                      {mood.label}
                    </span>
                  </button>
                </HoverTip>
              ))}
            </div>
          </motion.div>

          {/* Mood History Chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl bg-[#18162e] border border-white/10 p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">Mood This Week</h3>
            <div className="flex items-end justify-between gap-2 h-24">
              {MOOD_HISTORY.map((mood, i) => {
                const height = mood !== null ? ((mood + 1) / 5) * 100 : 10;
                const moodData = mood !== null ? MOODS[mood] : null;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                      className={`w-full rounded-t-md ${
                        moodData ? `bg-gradient-to-t ${moodData.color} opacity-60` : 'bg-white/5'
                      }`}
                    />
                    <span className="text-[9px] text-gray-600">{PAST_LABELS[i]}</span>
                  </div>
                );
              })}
            </div>
            {MOOD_HISTORY.every(m => m === null) && (
              <p className="text-[10px] text-gray-600 text-center mt-2">Log your mood to see trends</p>
            )}
          </motion.div>

          {/* Habit Tracker */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-[#18162e] border border-white/10 p-5"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-white">Daily Habits</h3>
              <button
                onClick={() => setManagerOpen(true)}
                className="text-[10px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Manage
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">{habitsComplete} of {habitsTotal} completed</p>
            <div className="space-y-2">
              {habits.map(habit => {
                const done = completedHabits.has(habit.id);
                return (
                  <HoverTip key={habit.id} label={habit.desc} side="right">
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all ${
                        done
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        done ? 'border-green-400 bg-green-400' : 'border-gray-600'
                      }`}>
                        {done && (
                          <svg className="w-3.5 h-3.5 text-[#18162e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <habit.icon className={`w-4 h-4 flex-shrink-0 ${done ? 'text-green-400' : 'text-gray-500'}`} />
                      <div className="text-left min-w-0">
                        <span className={`text-xs font-medium block ${done ? 'text-green-400 line-through' : 'text-gray-200'}`}>
                          {habit.label}
                        </span>
                        <span className="text-[10px] text-gray-600">{habit.desc}</span>
                      </div>
                    </button>
                  </HoverTip>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── Right Column: Journal & Past Entries ────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Journal Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl bg-[#18162e] border border-white/10 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Today's Journal</h3>
              <div className="flex items-center gap-1.5">
                {journalText.trim() && (
                  <span className="flex items-center gap-1 text-[10px] text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Auto-saved
                  </span>
                )}
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              <textarea
                value={journalText}
                onChange={e => handleJournalChange(e.target.value)}
                placeholder="What's on your mind today? Brain dump your thoughts, stress, or wins..."
                className="w-full min-h-[180px] bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-sm text-gray-200 leading-relaxed placeholder:text-gray-600 outline-none focus:border-purple-500/30 resize-none transition-colors"
              />
            </div>
          </motion.div>

          {/* Past Entries */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-[#18162e] border border-white/10 p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">Past Entries</h3>
            {entries.length === 0 ? (
              <div className="text-center py-8">
                <PenLine className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No journal entries yet.</p>
                <p className="text-xs text-gray-600 mt-1">Start writing to track your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map(entry => {
                  const entryDate = new Date(entry.date + 'T00:00:00');
                  const moodData = entry.mood !== null ? MOODS[entry.mood] : null;
                  return (
                    <div key={entry.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {moodData && <span className="text-lg">{moodData.emoji}</span>}
                          <span className="text-xs font-medium text-gray-300">
                            {entryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-600">
                          {entry.habitsCompleted.length} habits done
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">{entry.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Journal Slide-Over ───────────────────────────────────────── */}
      <AnimatePresence>
        {journalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setJournalOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#0B0A1A] border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white">Daily Journal</h2>
                  <p className="text-xs text-gray-500">{today}</p>
                </div>
                <button
                  onClick={() => setJournalOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="prose prose-invert max-w-none">
                  <textarea
                    value={journalText}
                    onChange={e => handleJournalChange(e.target.value)}
                    placeholder="What's on your mind today? Brain dump your thoughts, stress, or wins..."
                    className="w-full h-full min-h-[400px] bg-transparent text-gray-200 text-sm leading-relaxed placeholder:text-gray-600 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-3 border-t border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-gray-500">Auto-saves as you type</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ── Habit Manager Modal ────────────────────────────────────────── */}
      <HabitManagerModal
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
        habits={habits}
        onAddHabit={addHabit}
        onRemoveHabit={removeHabit}
      />
    </motion.div>
  );
}
