import { Menu, Flame, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/contexts/GamificationContext';
import { xpProgressInLevel } from '@/types/gamification';
import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  title: string;
  onMenuToggle: () => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardHeader({ title, onMenuToggle }: DashboardHeaderProps) {
  const { profile } = useAuth();
  const { totalXP, level, streak } = useGamification();
  const firstName = profile?.display_name?.split(' ')[0] ?? 'there';

  const progress = xpProgressInLevel(totalXP);
  const progressPct = Math.min((progress.current / progress.required) * 100, 100);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0A0A0A]/80 dm-surface backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors duration-150"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">{title}</h1>
          <p className="text-xs text-zinc-500 hidden sm:block">
            {getGreeting()}, {firstName}
          </p>
        </div>
      </div>

      <Link
        to="/dashboard/achievements"
        className="flex items-center gap-2 sm:gap-3 group"
        title="View Achievements"
      >
        {/* Streak badge */}
        {streak > 0 && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-3 h-3 text-orange-400" />
            <span className="text-[10px] font-semibold text-orange-400">{streak}d</span>
          </div>
        )}

        {/* XP badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 group-hover:border-indigo-500/30 transition-colors duration-150">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-400">Lv {level}</span>
          </div>
          <div className="w-16 sm:w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 hidden sm:inline tabular-nums">
            {progress.current}/{progress.required}
          </span>
        </div>
      </Link>
    </header>
  );
}
