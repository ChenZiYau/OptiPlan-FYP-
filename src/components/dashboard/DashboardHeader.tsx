import { Menu, Settings } from 'lucide-react';
import { userXP } from '@/constants/dashboardData';

interface DashboardHeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export function DashboardHeader({ title, onMenuToggle }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B0A1A]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-display font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30">
          <span className="text-xs font-semibold text-purple-300">Lv {userXP.level}</span>
          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              style={{ width: `${(userXP.current / userXP.nextLevel) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400">{userXP.current}/{userXP.nextLevel}</span>
        </div>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Settings className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
