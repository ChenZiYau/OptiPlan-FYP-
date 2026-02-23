import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, PenLine, X, Droplets, BookOpen, BrainCircuit } from 'lucide-react';
import { HoverTip } from '@/components/HoverTip';
import { Link } from 'react-router-dom';

const MOODS = [
  { emoji: '\uD83D\uDE22', label: 'Awful' },
  { emoji: '\uD83D\uDE15', label: 'Meh' },
  { emoji: '\uD83D\uDE10', label: 'Okay' },
  { emoji: '\uD83D\uDE42', label: 'Good' },
  { emoji: '\uD83E\uDD29', label: 'Great' },
];

const DEFAULT_HABITS = [
  { id: 'h1', label: 'Hydrate', icon: Droplets },
  { id: 'h2', label: 'Read', icon: BookOpen },
  { id: 'h3', label: 'Deep Work', icon: BrainCircuit },
];

export function WellnessWidget() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());
  const [journalOpen, setJournalOpen] = useState(false);
  const todayKey = new Date().toISOString().slice(0, 10);
  const [journalText, setJournalText] = useState(() => localStorage.getItem(`wellness-journal-${todayKey}`) ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const journalTextRef = useRef(journalText);

  function toggleHabit(id: string) {
    setCompletedHabits(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const handleJournalChange = useCallback((value: string) => {
    setJournalText(value);
    journalTextRef.current = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(`wellness-journal-${todayKey}`, value);
    }, 1500);
  }, [todayKey]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      localStorage.setItem(`wellness-journal-${todayKey}`, journalTextRef.current);
    };
  }, [todayKey]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <motion.div
        layout
        className="rounded-2xl bg-[#18162e] border border-white/10 p-5 hover:border-white/20 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-white">Wellness</h3>
          </div>
          <Link to="/dashboard/wellness" className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-medium">
            Full View →
          </Link>
        </div>

        {/* Mood Row */}
        <p className="text-[10px] text-gray-500 mb-2">Feeling?</p>
        <div className="flex gap-2 mb-4">
          {MOODS.map((mood, i) => (
            <HoverTip key={i} label={mood.label}>
              <button
                onClick={() => setSelectedMood(i)}
                className={`w-9 h-9 rounded-full text-base flex items-center justify-center transition-all ${
                  selectedMood === i
                    ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#18162e] scale-110 bg-purple-500/20'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >{mood.emoji}</button>
            </HoverTip>
          ))}
        </div>

        {/* Habit Checkboxes */}
        <div className="flex gap-2 mb-4">
          {DEFAULT_HABITS.map(habit => {
            const done = completedHabits.has(habit.id);
            return (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  done
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-white/[0.03] border border-white/10 text-gray-500 hover:text-gray-300'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center ${
                  done ? 'border-green-400 bg-green-400' : 'border-gray-600'
                }`}>
                  {done && (
                    <svg className="w-2 h-2 text-[#18162e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                {habit.label}
              </button>
            );
          })}
        </div>

        {/* Journal Button */}
        <button
          onClick={() => setJournalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
        >
          <PenLine className="w-3.5 h-3.5" /> Open Daily Journal
        </button>
      </motion.div>

      {/* Journal Slide-Over */}
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
                <textarea
                  value={journalText}
                  onChange={e => handleJournalChange(e.target.value)}
                  placeholder="What's on your mind today? Brain dump your thoughts, stress, or wins..."
                  className="w-full h-full min-h-[400px] bg-transparent text-gray-200 text-sm leading-relaxed placeholder:text-gray-600 outline-none resize-none"
                />
              </div>
              <div className="px-6 py-3 border-t border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-gray-500">Auto-saves as you type</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
