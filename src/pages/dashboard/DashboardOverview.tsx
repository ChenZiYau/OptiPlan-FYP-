import { useState } from 'react';
import { CheckSquare, Zap, TrendingUp, DollarSign } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import { StatCard } from '@/components/admin/StatCard';
import { useDashboard } from '@/contexts/DashboardContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useGamification } from '@/contexts/GamificationContext';
import { CalendarWidget } from '@/components/dashboard/widgets/CalendarWidget';
import { FinanceWidget } from '@/components/dashboard/widgets/FinanceWidget';
import { TasksWidget } from '@/components/dashboard/widgets/TasksWidget';
import { XPWidget } from '@/components/dashboard/widgets/XPWidget';
import { TimetableWidget } from '@/components/dashboard/widgets/TimetableWidget';
import { StudyHubWidget } from '@/components/dashboard/widgets/StudyHubWidget';
import { WellnessWidget } from '@/components/dashboard/widgets/WellnessWidget';
import { useCurrency } from '@/hooks/useCurrency';

export function DashboardOverview() {
  const { items, loading } = useDashboard();
  const { todaySpending } = useFinance();
  const { level, totalXP, streak } = useGamification();
  const { fmtCompact } = useCurrency();
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayItems = items.filter(i => i.date === todayISO);

  const completedTasks = items.filter(i => i.status === 'completed');
  const productivityPct = items.length > 0 ? Math.round((completedTasks.length / items.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Items Today" value={loading ? '—' : todayItems.length} subtitle={loading ? 'Loading...' : `${todayItems.filter(i => i.status === 'completed').length} completed`} icon={CheckSquare} />
        <StatCard title="XP Level" value={loading ? '—' : `Lv. ${level}`} subtitle={loading ? 'Loading...' : `${totalXP.toLocaleString()} XP${streak > 0 ? ` · ${streak}🔥` : ''}`} icon={Zap} />
        <StatCard title="Productivity" value={loading ? '—' : `${productivityPct}%`} subtitle={loading ? 'Loading...' : `${completedTasks.length} of ${items.length} items done`} icon={TrendingUp} />
        <StatCard title="Spending Today" value={loading ? '—' : fmtCompact(todaySpending)} subtitle={loading ? 'Loading...' : todaySpending > 0 ? 'Keep tracking!' : 'No expenses yet'} icon={DollarSign} />
      </div>

      {/* Bento Grid */}
      <LayoutGroup>
        <motion.div
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

          {/* XP & Level */}
          <XPWidget />

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
