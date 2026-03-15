import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  PenLine, X, Heart, Smile, TrendingUp, Save, BookOpen, Calendar,
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

const PAST_JOURNALS_KEY = 'wellness-past-journals';

/** Get today's date key in GMT+8 */
function getTodayKeyGMT8(): string {
  const now = new Date();
  const gmt8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return gmt8.toISOString().slice(0, 10);
}

/** Load past journal entries from localStorage */
function loadPastJournals(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(PAST_JOURNALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

/** Save past journal entries to localStorage */
function savePastJournals(entries: JournalEntry[]) {
  localStorage.setItem(PAST_JOURNALS_KEY, JSON.stringify(entries));
}

/** Archive today's journal if the day has rolled over (midnight GMT+8) */
function archiveIfNewDay(todayKey: string): JournalEntry[] {
  const past = loadPastJournals();
  const lastSavedDay = localStorage.getItem('wellness-last-journal-day');

  if (lastSavedDay && lastSavedDay !== todayKey) {
    // The last saved day is different from today — archive it
    const oldText = localStorage.getItem(`wellness-journal-${lastSavedDay}`) ?? '';
    const oldMood = localStorage.getItem(`wellness-mood-${lastSavedDay}`);

    if (oldText.trim()) {
      const alreadyArchived = past.some(e => e.date === lastSavedDay);
      if (!alreadyArchived) {
        const completedRaw = localStorage.getItem(`optiplan-completed-habits-${lastSavedDay}`);
        let habitsCompleted: string[] = [];
        try {
          if (completedRaw) habitsCompleted = JSON.parse(completedRaw);
        } catch { /* ignore */ }

        past.unshift({
          id: lastSavedDay,
          date: lastSavedDay,
          text: oldText,
          mood: oldMood !== null ? parseInt(oldMood, 10) : null,
          habitsCompleted,
        });
        savePastJournals(past);
      }
    }
    // Clean up the old day's journal from localStorage
    localStorage.removeItem(`wellness-journal-${lastSavedDay}`);
  }

  localStorage.setItem('wellness-last-journal-day', todayKey);
  return past;
}

/** Build mood history from localStorage for the past 7 days */
function buildMoodHistory(): (number | null)[] {
  const history: (number | null)[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const stored = localStorage.getItem(`wellness-mood-${key}`);
    history.push(stored !== null ? parseInt(stored, 10) : null);
  }
  return history;
}

const PAST_LABELS = (() => {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  return days;
})();

// ── Component ───────────────────────────────────────────────────────────────

export function WellnessPage() {
  const { habits, addHabit, removeHabit, completedHabits, toggleHabit } = useHabits();
  const todayKey = getTodayKeyGMT8();
  const [selectedMood, setSelectedMood] = useState<number | null>(() => {
    const stored = localStorage.getItem(`wellness-mood-${todayKey}`);
    return stored ? parseInt(stored, 10) : null;
  });
  const [journalOpen, setJournalOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [journalText, setJournalText] = useState(() => localStorage.getItem(`wellness-journal-${todayKey}`) ?? '');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [moodHistory, setMoodHistory] = useState<(number | null)[]>(buildMoodHistory);

  // Archive previous day's journal on mount (outside useState to avoid side-effects in render)
  useEffect(() => {
    setEntries(archiveIfNewDay(todayKey));
  }, [todayKey]);
  const [previewEntry, setPreviewEntry] = useState<JournalEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const journalTextRef = useRef(journalText);

  // Check for day rollover every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDay = getTodayKeyGMT8();
      if (currentDay !== todayKey) {
        window.location.reload();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [todayKey]);

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
    }, 1500);
  }, [todayKey]);

  // Save immediately on unmount so navigation doesn't lose unsaved text
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      localStorage.setItem(`wellness-journal-${todayKey}`, journalTextRef.current);
    };
  }, [todayKey]);

  const handleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    localStorage.setItem(`wellness-journal-${todayKey}`, journalText);
    setSaving(true);
    toast.success('Journal saved!');
    setTimeout(() => setSaving(false), 1200);
  }, [todayKey, journalText]);

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
          <p className="text-xs text-gray-500 mt-1">total</p>
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
            <div className="flex justify-between gap-1 sm:gap-2">
              {MOODS.map((mood, i) => (
                <HoverTip key={i} label={`Log as ${mood.label}`}>
                  <button
                    onClick={() => { setSelectedMood(i); localStorage.setItem(`wellness-mood-${todayKey}`, String(i)); setMoodHistory(buildMoodHistory()); toast.success(`Mood logged: ${mood.label} ${mood.emoji}`); }}
                    className="flex-1 flex flex-col items-center gap-1.5 group min-w-0"
                  >
                    <div className={`w-full max-w-[3rem] aspect-square rounded-xl sm:rounded-2xl text-lg sm:text-2xl flex items-center justify-center transition-all ${
                      selectedMood === i
                        ? `ring-2 ring-purple-500 ring-offset-2 ring-offset-[#18162e] scale-110 bg-gradient-to-br ${mood.color}`
                        : 'bg-white/5 group-hover:bg-white/10'
                    }`}>
                      {mood.emoji}
                    </div>
                    <span className={`text-[10px] w-full text-center truncate transition-colors ${selectedMood === i ? 'text-purple-400 font-semibold' : 'text-gray-600'}`}>
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
              {moodHistory.map((mood, i) => {
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
            {moodHistory.every(m => m === null) && (
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
              {habits.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No habits yet. Click "Manage" to add some.</p>
              )}
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

        {/* ── Right Column: Journal & Past Journals ────────────────────── */}
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
              <div className="flex items-center gap-3">
                {journalText.trim() && !saving && (
                  <span className="flex items-center gap-1 text-[10px] text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Auto-saved
                  </span>
                )}
                {saving && (
                  <span className="flex items-center gap-1 text-[10px] text-purple-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Saved!
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={!journalText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
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

          {/* Past Journals */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-[#18162e] border border-white/10 p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-4">Past Journals</h3>
            {entries.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No past journals yet.</p>
                <p className="text-xs text-gray-600 mt-1">Your journals will appear here after midnight (GMT+8).</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(entry => {
                  const entryDate = new Date(entry.date + 'T00:00:00');
                  const moodData = entry.mood !== null ? MOODS[entry.mood] : null;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setPreviewEntry(entry)}
                      className="w-full text-left p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04] transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
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
                      <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{entry.text}</p>
                      <span className="text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">
                        Click to read more
                      </span>
                    </button>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={!journalText.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() => setJournalOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
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

      {/* ── Past Journal Preview Modal ──────────────────────────────── */}
      <AnimatePresence>
        {previewEntry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewEntry(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:max-h-[80vh] bg-[#12101f] border border-white/10 rounded-2xl z-50 flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  {previewEntry.mood !== null && (
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${MOODS[previewEntry.mood].color} flex items-center justify-center text-xl`}>
                      {MOODS[previewEntry.mood].emoji}
                    </div>
                  )}
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {new Date(previewEntry.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </h2>
                    <div className="flex items-center gap-3 mt-0.5">
                      {previewEntry.mood !== null && (
                        <span className="text-[10px] text-gray-500">
                          Feeling {MOODS[previewEntry.mood].label}
                        </span>
                      )}
                      {previewEntry.habitsCompleted.length > 0 && (
                        <span className="text-[10px] text-gray-500">
                          {previewEntry.habitsCompleted.length} habits completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewEntry(null)}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] font-medium text-purple-400 uppercase tracking-wider">Journal Entry</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {previewEntry.text}
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-gray-600">
                  {previewEntry.text.split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  onClick={() => setPreviewEntry(null)}
                  className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
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
