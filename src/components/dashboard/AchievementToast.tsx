import { toast } from 'sonner';

/**
 * Show a styled achievement unlock toast.
 * Call this instead of raw toast.success() when an achievement unlocks.
 */
export function showAchievementToast(icon: string, title: string, xpReward: number) {
  toast.success(
    `${icon} Achievement Unlocked: ${title} (+${xpReward} XP)`,
    {
      duration: 5000,
      style: {
        background: 'linear-gradient(135deg, #1a1735 0%, #2d1b69 100%)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        boxShadow: '0 0 20px rgba(168, 85, 247, 0.15)',
      },
    },
  );
}

/**
 * Show a level-up toast notification.
 */
export function showLevelUpToast(newLevel: number) {
  toast.success(
    `Level Up! You are now Level ${newLevel}`,
    {
      duration: 4000,
      style: {
        background: 'linear-gradient(135deg, #1a1735 0%, #4a1d96 100%)',
        border: '1px solid rgba(250, 204, 21, 0.4)',
        boxShadow: '0 0 20px rgba(250, 204, 21, 0.15)',
      },
    },
  );
}
