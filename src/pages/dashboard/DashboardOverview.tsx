import { CheckSquare, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { Progress } from '@/components/ui/progress';
import { InteractiveCalendar } from '@/components/dashboard/InteractiveCalendar';
import { useDashboard } from '@/contexts/DashboardContext';
import { mockExpenses, mockAchievements, userXP } from '@/constants/dashboardData';

const priorityColors = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-green-500/20 text-green-400',
};

const importanceToLegacy: Record<number, 'high' | 'medium' | 'low'> = { 3: 'high', 2: 'medium', 1: 'low' };

export function DashboardOverview() {
  const { items } = useDashboard();

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayItems = items.filter((i) => i.date === todayISO);
  const todayTasks = todayItems.filter((i) => i.type === 'task');
  const topExpenses = mockExpenses.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Tasks Today" value={todayTasks.length} subtitle={`${todayItems.length} total items`} icon={CheckSquare} />
        <StatCard title="Focus Time" value="0h" subtitle="Start a session to track" icon={Clock} />
        <StatCard title="Productivity" value="0%" subtitle="Complete tasks to build up" icon={TrendingUp} />
        <StatCard title="Spending Today" value="$0.00" subtitle="No expenses yet" icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar — 2 cols */}
        <div className="lg:col-span-2">
          <InteractiveCalendar />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Today's items */}
          <div className="rounded-xl bg-[#18162e] border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Today's Items</h3>
            {todayItems.length === 0 ? (
              <p className="text-xs text-gray-500">No items for today. Click "+ New Task" to add one.</p>
            ) : (
              <div className="space-y-2">
                {todayItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/10">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.type}{item.type !== 'task' && 'startTime' in item ? ` · ${item.startTime}` : ''}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${priorityColors[importanceToLegacy[item.importance]]}`}>
                      {importanceToLegacy[item.importance]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finance snapshot */}
          <div className="rounded-xl bg-[#18162e] border border-white/10 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Recent Expenses</h3>
            {topExpenses.length === 0 ? (
              <p className="text-xs text-gray-500">No expenses recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {topExpenses.map((exp) => (
                  <div key={exp.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <exp.icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{exp.description}</p>
                      <p className="text-xs text-gray-500">{exp.date}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">-${exp.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gamification */}
          <div className="rounded-xl bg-[#18162e] border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Level Progress</h3>
              <span className="text-xs text-purple-400 font-semibold">Lv {userXP.level}</span>
            </div>
            <Progress value={(userXP.current / userXP.nextLevel) * 100} className="h-2 mb-1" />
            <p className="text-xs text-gray-500 mb-4">{userXP.current} / {userXP.nextLevel} XP</p>

            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Achievements</h4>
            <div className="grid grid-cols-2 gap-2">
              {mockAchievements.map((a) => (
                <div
                  key={a.id}
                  className={`p-2 rounded-lg border text-center ${
                    a.unlocked
                      ? 'bg-purple-900/20 border-purple-500/30'
                      : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}
                >
                  <a.icon className={`w-5 h-5 mx-auto mb-1 ${a.unlocked ? 'text-purple-400' : 'text-gray-600'}`} />
                  <p className="text-[10px] font-medium text-white truncate">{a.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
