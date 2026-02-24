import { Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/contexts/DashboardContext';

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
  const { items } = useDashboard();
  const firstName = profile?.display_name?.split(' ')[0] ?? 'there';

  // Dynamic XP: 10 XP per completed task, level up every 100 XP
  const completedCount = items.filter(i => i.type === 'task' && i.status === 'completed').length;
  const totalXP = completedCount * 10;
  const level = Math.floor(totalXP / 100) + 1;
  const currentInLevel = totalXP % 100;
  const nextLevel = 100;

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B0A1A]/80 dm-surface backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
          <p className="text-xs text-gray-500 hidden sm:block">
            {getGreeting()}, {firstName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* XP badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30">
          <span className="text-xs font-semibold text-purple-300">Lv {level}</span>
          <div className="w-16 sm:w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${(currentInLevel / nextLevel) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 hidden sm:inline">
            {currentInLevel}/{nextLevel}
          </span>
        </div>
      </div>
    </header>
  );
}
