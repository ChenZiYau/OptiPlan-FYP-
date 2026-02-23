import { useState } from 'react';
import { CheckSquare, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import { StatCard } from '@/components/admin/StatCard';
import { useDashboard } from '@/contexts/DashboardContext';
import { useFinance } from '@/contexts/FinanceContext';
import { CalendarWidget } from '@/components/dashboard/widgets/CalendarWidget';
import { FinanceWidget } from '@/components/dashboard/widgets/FinanceWidget';
import { TasksWidget } from '@/components/dashboard/widgets/TasksWidget';
import { TimetableWidget } from '@/components/dashboard/widgets/TimetableWidget';
import { StudyHubWidget } from '@/components/dashboard/widgets/StudyHubWidget';
import { WellnessWidget } from '@/components/dashboard/widgets/WellnessWidget';

function fmtCompact(n: number) {
  const num = Number(n) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return `${sign}$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}m`;
  }
  if (abs >= 100_000) {
    return `${sign}$${Math.round(abs / 1_000)}k`;
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return `${sign}$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

export function DashboardOverview() {
  const { items } = useDashboard();
  const { todaySpending } = useFinance();
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayItems = items.filter(i => i.date === todayISO);
  const todayTasks = todayItems.filter(i => i.type === 'task');

  const allTasks = items.filter(i => i.type === 'task');
  const completedTasks = allTasks.filter(i => i.status === 'completed');
  const productivityPct = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Tasks Today" value={todayTasks.length} subtitle={`${todayItems.length} total items`} icon={CheckSquare} />
        <StatCard title="Focus Time" value="0h" subtitle="Use Pomodoro in Study Hub" icon={Clock} />
        <StatCard title="Productivity" value={`${productivityPct}%`} subtitle={`${completedTasks.length} of ${allTasks.length} tasks done`} icon={TrendingUp} />
        <StatCard title="Spending Today" value={fmtCompact(todaySpending)} subtitle={todaySpending > 0 ? 'Keep tracking!' : 'No expenses yet'} icon={DollarSign} />
      </div>

      {/* Bento Grid */}
      <LayoutGroup>
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min"
        >
          {/* Calendar — scales between 1x1 and 2x2 */}
          <CalendarWidget
            isExpanded={calendarExpanded}
            onToggleExpand={() => setCalendarExpanded(prev => !prev)}
          />

          {/* Finance */}
          <FinanceWidget />

          {/* Tasks */}
          <TasksWidget />

          {/* Today's Classes */}
          <TimetableWidget />

          {/* Study Hub */}
          <StudyHubWidget />

          {/* Wellness */}
          <WellnessWidget />
        </motion.div>
      </LayoutGroup>
    </div>
  );
}
