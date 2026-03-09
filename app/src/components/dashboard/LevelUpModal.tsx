import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/contexts/GamificationContext';

export function LevelUpModal() {
  const { pendingLevelUp, dismissLevelUp } = useGamification();
  const isOpen = pendingLevelUp !== null;

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(dismissLevelUp, 5000);
    return () => clearTimeout(timer);
  }, [isOpen, dismissLevelUp]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={dismissLevelUp}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 p-8 rounded-3xl bg-[#18162e] border border-white/10 shadow-2xl max-w-sm mx-4"
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* Particles */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: i % 3 === 0 ? '#a855f7' : i % 3 === 1 ? '#ec4899' : '#facc15',
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    y: [0, -60 - Math.random() * 40],
                    x: [(Math.random() - 0.5) * 60],
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.2 + i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
              ))}
            </div>

            {/* Level Badge */}
            <motion.div
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-purple-500/25"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <span className="text-white font-bold text-4xl">{pendingLevelUp}</span>
            </motion.div>

            {/* Text */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xs uppercase tracking-widest text-purple-400 font-semibold mb-1">
                Level Up!
              </p>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Level {pendingLevelUp}
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Keep completing tasks to reach the next level!
              </p>
            </motion.div>

            {/* Dismiss */}
            <motion.button
              className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              onClick={dismissLevelUp}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
