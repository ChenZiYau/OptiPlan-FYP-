import { motion } from 'framer-motion';
import { Trophy, Flame, Zap } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext';
import { ACHIEVEMENTS, xpProgressInLevel } from '@/types/gamification';

export function AchievementsPage() {
  const { totalXP, level, streak, unlockedAchievements } = useGamification();
  const progress = xpProgressInLevel(totalXP);
  const progressPct = Math.min((progress.current / progress.required) * 100, 100);

  const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievement_id));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-[#18162e] border border-white/10 p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-2xl">{level}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">Level {level}</h2>
            <p className="text-sm text-gray-400">{totalXP.toLocaleString()} XP total</p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-500/15 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Flame className="w-3.5 h-3.5" />
              {streak} day streak
            </div>
          )}
        </div>

        {/* XP Progress bar */}
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {progress.current}/{progress.required} XP to Level {level + 1}
        </p>

        {/* XP breakdown */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="w-3.5 h-3.5 text-green-400" />
            <span>Task: <span className="text-white font-medium">+15 XP</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Event: <span className="text-white font-medium">+25 XP</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Study: <span className="text-white font-medium">+50 XP</span></span>
          </div>
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h3 className="text-base font-semibold text-white">
            Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((def, i) => {
            const unlocked = unlockedIds.has(def.id);
            const ua = unlockedAchievements.find((a) => a.achievement_id === def.id);

            return (
              <motion.div
                key={def.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                  unlocked
                    ? 'bg-[#18162e] border-purple-500/30 hover:border-purple-500/50'
                    : 'bg-[#18162e]/50 border-white/5 opacity-50'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${
                    unlocked
                      ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                      : 'bg-white/5 grayscale'
                  }`}
                >
                  {unlocked ? def.icon : '🔒'}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                    {def.title}
                  </p>
                  <p className={`text-xs truncate ${unlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                    {def.description}
                  </p>
                  {unlocked && ua && (
                    <p className="text-[10px] text-purple-400 mt-0.5">
                      Unlocked {new Date(ua.unlocked_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Badge */}
                {unlocked && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
