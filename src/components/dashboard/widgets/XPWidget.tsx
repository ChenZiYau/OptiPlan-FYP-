import { motion } from 'framer-motion';
import { Flame, Trophy, Zap } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext';
import { xpProgressInLevel, ACHIEVEMENTS } from '@/types/gamification';

export function XPWidget() {
  const { totalXP, level, streak, unlockedAchievements, loading } = useGamification();

  if (loading) {
    return (
      <motion.div layout className="rounded-2xl bg-[#18162e] border border-white/10 p-5 animate-pulse">
        <div className="h-4 bg-white/5 rounded w-24 mb-4" />
        <div className="h-8 bg-white/5 rounded w-16 mb-3" />
        <div className="h-2 bg-white/5 rounded w-full" />
      </motion.div>
    );
  }

  const progress = xpProgressInLevel(totalXP);
  const progressPct = Math.min((progress.current / progress.required) * 100, 100);

  // Last 3 unlocked achievements
  const recentAchievements = [...unlockedAchievements]
    .sort((a, b) => b.unlocked_at.localeCompare(a.unlocked_at))
    .slice(0, 3)
    .map((ua) => ACHIEVEMENTS.find((d) => d.id === ua.achievement_id))
    .filter(Boolean);

  return (
    <motion.div
      layout
      className="rounded-2xl bg-[#18162e] border border-white/10 p-5 hover:border-white/20 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">XP & Level</h3>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-orange-500/15 text-orange-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <Flame className="w-3 h-3" />
            {streak} day{streak !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Level Badge + XP */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Level {level}</p>
          <p className="text-gray-400 text-xs">{totalXP.toLocaleString()} XP total</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-1">
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
      <p className="text-[10px] text-gray-500 mb-4">
        {progress.current}/{progress.required} XP to Level {level + 1}
      </p>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="w-3 h-3 text-yellow-400" />
            <span className="text-[10px] font-medium text-gray-400">Recent Achievements</span>
          </div>
          <div className="space-y-1.5">
            {recentAchievements.map((def) => (
              <div
                key={def!.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]"
              >
                <span className="text-sm">{def!.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white font-medium truncate">{def!.title}</p>
                  <p className="text-[9px] text-gray-500 truncate">{def!.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentAchievements.length === 0 && (
        <p className="text-[10px] text-gray-500 text-center py-2">
          Complete tasks to earn achievements!
        </p>
      )}
    </motion.div>
  );
}
