import { motion } from 'framer-motion';
import { BookOpen, Layers, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function StudyHubWidget() {
  // Static placeholder — GPA ring
  const gpa = 0;
  const gpaTarget = 4.0;
  const pct = gpaTarget > 0 ? (gpa / gpaTarget) * 100 : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <motion.div
      layout
      className="rounded-2xl bg-[#18162e] border border-white/10 p-5 hover:border-white/20 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Study Hub</h3>
        </div>
        <Link to="/dashboard/studyhub" className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-medium">
          Open →
        </Link>
      </div>

      {/* GPA Ring */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-[88px] h-[88px] flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <motion.circle
              cx="44" cy="44" r={radius}
              fill="none"
              stroke="url(#gpa-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="gpa-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">{gpa > 0 ? gpa.toFixed(1) : '—'}</span>
            <span className="text-[9px] text-gray-500">GPA</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400">Target GPA</p>
          <p className="text-sm font-semibold text-white">{gpaTarget.toFixed(1)}</p>
          <p className="text-[10px] text-gray-500 mt-1">Upload materials to track progress</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/dashboard/studyhub"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" /> Flip Flashcards
        </Link>
        <Link
          to="/dashboard/studyhub"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-semibold hover:bg-green-500/20 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Practice Quiz
        </Link>
      </div>

      <p className="text-[10px] text-gray-600 text-center mt-3">Elementary Calculus Derivatives</p>
    </motion.div>
  );
}
