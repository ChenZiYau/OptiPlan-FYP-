import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Sparkles, Trophy, BookOpen, DollarSign, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { HoverTip } from '@/components/HoverTip';
import { useDashboard } from '@/contexts/DashboardContext';
import { useFinance } from '@/contexts/FinanceContext';

// Wrapped data will be computed dynamically inside the component

// ── Animated counter hook ───────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration = 2000, active = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) { setValue(0); return; }
    let start = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      if (current !== start) {
        start = current;
        setValue(current);
      }
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration, active]);

  return value;
}

// ── Slide definitions ───────────────────────────────────────────────────────

interface WrappedData {
  tasksCompleted: number;
  totalTasks: number;
  moneySaved: number;
  totalBudget: number;
  flashcardsMastered: number;
  focusHours: number;
  topSubject: string;
  streakDays: number;
  percentile: number;
}

interface SlideProps {
  active: boolean;
  data: WrappedData;
}

function SlideProductivity({ active, data }: SlideProps) {
  const count = useAnimatedCounter(data.tasksCompleted, 2500, active);
  const pct = data.totalTasks > 0 ? Math.round((data.tasksCompleted / data.totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={active ? { scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-8"
      >
        <CheckCircle2 className="w-10 h-10 text-white" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3 }}
        className="text-gray-400 text-sm uppercase tracking-widest mb-4"
      >
        This semester, you crushed it.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={active ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
        className="mb-4"
      >
        <span className="text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          {count}
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.8 }}
        className="text-xl text-white font-semibold mb-2"
      >
        tasks completed
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
        className="text-gray-500 text-sm"
      >
        That's a {pct}% completion rate. Absolute machine.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={active ? { opacity: 1, width: '60%' } : {}}
        transition={{ delay: 1.2, duration: 1 }}
        className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mt-8"
      />
    </div>
  );
}

function SlideFinance({ active, data }: SlideProps) {
  const saved = useAnimatedCounter(data.moneySaved, 2000, active);
  const pctSaved = data.totalBudget > 0 ? Math.round((data.moneySaved / data.totalBudget) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={active ? { scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-8"
      >
        <DollarSign className="w-10 h-10 text-white" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3 }}
        className="text-gray-400 text-sm uppercase tracking-widest mb-4"
      >
        You stayed on top of your bag.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={active ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.5, type: 'spring', stiffness: 150 }}
        className="mb-6"
      >
        <span className="text-7xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          ${saved}
        </span>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.8 }}
        className="text-xl text-white font-semibold mb-6"
      >
        saved from your ${data.totalBudget} budget
      </motion.p>

      {/* Mini bar chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
        className="w-64"
      >
        <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
          <span>Spent</span>
          <span>Saved</span>
        </div>
        <div className="h-4 rounded-full bg-white/5 overflow-hidden flex">
          <motion.div
            initial={{ width: 0 }}
            animate={active ? { width: `${100 - pctSaved}%` } : {}}
            transition={{ delay: 1.2, duration: 1 }}
            className="h-full bg-white/10 rounded-l-full"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={active ? { width: `${pctSaved}%` } : {}}
            transition={{ delay: 1.4, duration: 1 }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-r-full"
          />
        </div>
        <div className="flex justify-between text-[11px] mt-1.5">
          <span className="text-gray-400">${data.totalBudget - data.moneySaved}</span>
          <span className="text-emerald-400 font-semibold">${data.moneySaved}</span>
        </div>
      </motion.div>
    </div>
  );
}

function SlideStudy({ active, data }: SlideProps) {
  const cards = useAnimatedCounter(data.flashcardsMastered, 2000, active);
  const hours = useAnimatedCounter(data.focusHours, 2000, active);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={active ? { scale: 1 } : {}}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-8"
      >
        <BookOpen className="w-10 h-10 text-white" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3 }}
        className="text-gray-400 text-sm uppercase tracking-widest mb-6"
      >
        Brain gains.
      </motion.p>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={active ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.5 }}
        >
          <span className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            {cards}
          </span>
          <p className="text-sm text-gray-400 mt-2">flashcards mastered</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={active ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.7 }}
        >
          <span className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-300 bg-clip-text text-transparent">
            {hours}h
          </span>
          <p className="text-sm text-gray-400 mt-2">deep focus time</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
        className="px-5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20"
      >
        <p className="text-sm text-blue-300">
          Top subject: <span className="font-bold text-white">{data.topSubject}</span>
        </p>
      </motion.div>
    </div>
  );
}

function SlideSummary({ active, data, cardRef }: SlideProps & { cardRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div ref={cardRef} className="w-full max-w-sm bg-gradient-to-b from-[#1a1040] to-[#0B0A1A] rounded-2xl border border-white/10 p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={active ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-white">Your Semester Wrapped</h2>
          <p className="text-xs text-gray-500 mt-1">Spring 2026</p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4"
        >
          {[
            { label: 'Tasks Done', value: data.tasksCompleted.toString(), color: 'from-purple-500 to-pink-500' },
            { label: 'Money Saved', value: `$${data.moneySaved}`, color: 'from-emerald-500 to-teal-500' },
            { label: 'Cards Mastered', value: data.flashcardsMastered.toString(), color: 'from-blue-500 to-indigo-500' },
            { label: 'Focus Hours', value: `${data.focusHours}h`, color: 'from-amber-500 to-orange-500' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
              <p className="text-[10px] text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={active ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
        >
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-bold text-amber-300">Top {data.percentile}% of OptiPlan Scholars</span>
        </motion.div>

        {/* Streak */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="text-xs text-gray-500"
        >
          Longest streak: <span className="text-purple-400 font-semibold">{data.streakDays} days</span>
        </motion.p>

        {/* Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ delay: 1.1 }}
          className="pt-2 border-t border-white/[0.06]"
        >
          <p className="text-[10px] text-gray-600 tracking-wider uppercase">OptiPlan &middot; Plan Smarter, Live Better</p>
        </motion.div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

const TOTAL_SLIDES = 4;

export function WrappedPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Pull real data from contexts
  const { items } = useDashboard();
  const { totalMonthlyBudget, monthSpending } = useFinance();

  const allTasks = items.filter(i => i.type === 'task');
  const completedTasks = allTasks.filter(i => i.status === 'completed');
  const moneySaved = Math.max(0, totalMonthlyBudget - monthSpending);

  const WRAPPED_DATA = {
    tasksCompleted: completedTasks.length,
    totalTasks: Math.max(allTasks.length, 1), // avoid division by zero
    moneySaved: Math.round(moneySaved),
    totalBudget: Math.round(totalMonthlyBudget),
    flashcardsMastered: 0, // local state only, no backend
    focusHours: 0,         // Pomodoro is local state only
    topSubject: allTasks.length > 0 ? '—' : '—',
    streakDays: 0,
    percentile: completedTasks.length > 0 ? Math.min(99, Math.round(completedTasks.length * 3)) : 0,
  };

  function goTo(index: number) {
    if (index < 0 || index >= TOTAL_SLIDES) return;
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }

  async function handleDownload() {
    if (!summaryRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(summaryRef.current, {
        backgroundColor: '#0B0A1A',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'optiplan-wrapped-spring-2026.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
    setDownloading(false);
  }

  const slideVariants = {
    enter: (d: number) => ({ y: d > 0 ? 100 : -100, opacity: 0, scale: 0.95 }),
    center: { y: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ y: d > 0 ? -100 : 100, opacity: 0, scale: 0.95 }),
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[#050410]">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, #4c1d95 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #831843 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, #1e1b4b 0%, transparent 50%)',
            animation: 'wrappedBgPulse 8s ease-in-out infinite alternate',
          }}
        />
        <style>{`
          @keyframes wrappedBgPulse {
            0% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1) rotate(2deg); }
            100% { transform: scale(1) rotate(-1deg); }
          }
        `}</style>
      </div>

      {/* Story card container */}
      <div className="relative w-full max-w-md mx-auto" style={{ height: 'min(85vh, 700px)' }}>
        {/* Progress dots */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <HoverTip key={i} label={`Go to slide ${i + 1}`} side="top">
              <button
                onClick={() => goTo(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-purple-400' : i < current ? 'w-4 bg-purple-400/50' : 'w-4 bg-white/20'
                }`}
              />
            </HoverTip>
          ))}
        </div>

        {/* The card */}
        <div className="relative h-full rounded-3xl border border-white/10 bg-[#0B0A1A]/90 backdrop-blur-xl shadow-2xl shadow-purple-900/20 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              {current === 0 && <SlideProductivity active={current === 0} data={WRAPPED_DATA} />}
              {current === 1 && <SlideFinance active={current === 1} data={WRAPPED_DATA} />}
              {current === 2 && <SlideStudy active={current === 2} data={WRAPPED_DATA} />}
              {current === 3 && <SlideSummary active={current === 3} data={WRAPPED_DATA} cardRef={summaryRef} />}
            </motion.div>
          </AnimatePresence>

          {/* Navigation overlay — click left/right halves */}
          <div className="absolute inset-0 flex z-10">
            <button
              onClick={() => goTo(current - 1)}
              className="w-1/3 h-full cursor-pointer focus:outline-none"
              disabled={current === 0}
            />
            <div className="w-1/3" />
            <button
              onClick={() => goTo(current + 1)}
              className="w-1/3 h-full cursor-pointer focus:outline-none"
              disabled={current === TOTAL_SLIDES - 1}
            />
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute -bottom-14 left-0 right-0 flex items-center justify-center gap-3 z-10">
          <HoverTip label="Previous slide">
            <button
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </HoverTip>

          <span className="text-xs text-gray-500 min-w-[3rem] text-center">{current + 1} / {TOTAL_SLIDES}</span>

          {current === TOTAL_SLIDES - 1 ? (
            <HoverTip label="Save summary as an image">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {downloading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Share / Download
                  </>
                )}
              </button>
            </HoverTip>
          ) : (
            <HoverTip label="Next slide">
              <button
                onClick={() => goTo(current + 1)}
                disabled={current === TOTAL_SLIDES - 1}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </HoverTip>
          )}
        </div>
      </div>
    </div>
  );
}
