import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Zap, Search, Filter } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext';
import { ACHIEVEMENTS, CATEGORY_LABELS, CATEGORY_ICONS } from '@/constants/achievements';
import type { AchievementCategory } from '@/constants/achievements';
import { xpProgressInLevel, XP_ACTIONS, DAILY_GOAL_BONUS, DAILY_GOAL_TASK_COUNT } from '@/types/gamification';

export function AchievementsPage() {
  const {
    totalXP, level, streak, unlockedAchievements, runFullAchievementCheck,
  } = useGamification();
  const progress = xpProgressInLevel(totalXP);
  const progressPct = Math.min((progress.current / progress.required) * 100, 100);

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  // Run full achievement check when page loads
  useEffect(() => {
    runFullAchievementCheck();
  }, [runFullAchievementCheck]);

  const unlockedIds = new Set(unlockedAchievements.map((a) => a.achievement_id));

  // Get all unique categories
  const categories = [...new Set(ACHIEVEMENTS.map((a) => a.category))] as AchievementCategory[];

  // Filter achievements
  const filtered = ACHIEVEMENTS.filter((def) => {
    if (selectedCategory !== 'all' && def.category !== selectedCategory) return false;
    if (showUnlockedOnly && !unlockedIds.has(def.id)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return def.title.toLowerCase().includes(q) || def.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by category for display
  const grouped = new Map<string, typeof ACHIEVEMENTS>();
  for (const def of filtered) {
    const key = def.category;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(def);
  }

  // Stats
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;
  const totalAchievementXP = unlockedAchievements.reduce((sum, a) => sum + (a.xp_reward ?? 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-[#18162e] border border-white/10 p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
            <span className="text-white font-bold text-2xl">{level}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">Level {level}</h2>
            <p className="text-sm text-gray-400">{totalXP.toLocaleString()} XP total</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/15 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                <Flame className="w-3.5 h-3.5" />
                {streak} day streak
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-purple-500/15 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Trophy className="w-3.5 h-3.5" />
              {unlockedCount}/{totalAchievements}
            </div>
          </div>
        </div>

        {/* XP Progress bar */}
        <div className="h-3 bg-white/5 rounded-full overflow-hidden mb-1.5">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {progress.current.toLocaleString()}/{progress.required.toLocaleString()} XP to Level {level + 1}
        </p>

        {/* XP breakdown */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="w-3.5 h-3.5 text-green-400" />
            <span>Create: <span className="text-white font-medium">+{XP_ACTIONS.TASK_CREATE} XP</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Complete: <span className="text-white font-medium">+{XP_ACTIONS.TASK_COMPLETE} XP</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Daily Login: <span className="text-white font-medium">+{XP_ACTIONS.DAILY_LOGIN} XP</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Daily Goal ({DAILY_GOAL_TASK_COUNT}): <span className="text-white font-medium">+{DAILY_GOAL_BONUS} XP</span></span>
          </div>
          {totalAchievementXP > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Achievement XP: <span className="text-white font-medium">{totalAchievementXP.toLocaleString()}</span></span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as AchievementCategory | 'all')}
            className="pl-9 pr-8 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        {/* Unlocked toggle */}
        <button
          onClick={() => setShowUnlockedOnly((v) => !v)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
            showUnlockedOnly
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {showUnlockedOnly ? 'Unlocked Only' : 'Show All'}
        </button>
      </motion.div>

      {/* Achievement Groups */}
      {[...grouped.entries()].map(([category, achievements], groupIdx) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + groupIdx * 0.05 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">
              {CATEGORY_ICONS[category as AchievementCategory]}
            </span>
            <h3 className="text-sm font-semibold text-white">
              {CATEGORY_LABELS[category as AchievementCategory]}
            </h3>
            <span className="text-xs text-gray-500">
              {achievements.filter((a) => unlockedIds.has(a.id)).length}/{achievements.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {achievements.map((def, i) => {
              const unlocked = unlockedIds.has(def.id);
              const ua = unlockedAchievements.find((a) => a.achievement_id === def.id);

              return (
                <motion.div
                  key={def.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + groupIdx * 0.05 + i * 0.03 }}
                  className={`rounded-xl border p-4 flex items-center gap-4 transition-all ${
                    unlocked
                      ? 'bg-[#18162e] border-purple-500/30 hover:border-purple-500/50'
                      : 'bg-[#18162e]/50 border-white/5 opacity-50 hover:opacity-70'
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
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-medium ${unlocked ? 'text-yellow-400' : 'text-gray-600'}`}>
                        +{def.xpReward} XP
                      </span>
                      {unlocked && ua && (
                        <span className="text-[10px] text-purple-400">
                          Unlocked {new Date(ua.unlocked_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Checkmark */}
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
        </motion.div>
      ))}

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-gray-500 text-sm">No achievements match your filters.</p>
        </motion.div>
      )}
    </div>
  );
}
