import { useState } from 'react';
import { CheckSquare, Clock, TrendingUp, DollarSign, Wallet, Save, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatCard } from '@/components/admin/StatCard';
import { Progress } from '@/components/ui/progress';
import { InteractiveCalendar } from '@/components/dashboard/InteractiveCalendar';
import { useDashboard } from '@/contexts/DashboardContext';
import { useFinance } from '@/contexts/FinanceContext';
import { AddTransactionModal } from '@/components/dashboard/AddTransactionModal';
import { mockAchievements, userXP } from '@/constants/dashboardData';

const priorityColors = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-green-500/20 text-green-400',
};

const importanceToLegacy: Record<number, 'high' | 'medium' | 'low'> = { 3: 'high', 2: 'medium', 1: 'low' };

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCompact(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return `${sign}$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}m`;
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return `${sign}$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}

export function DashboardOverview() {
  const { items } = useDashboard();
  const {
    settings,
    transactions,
    totalBalance,
    budgetRemaining,
    monthSpending,
    todaySpending,
    saveSettings,
    loading: financeLoading,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);

  // Local input states for settings (so user can type freely before saving)
  const [startingBal, setStartingBal] = useState<string | null>(null);
  const [mainIncome, setMainIncome] = useState<string | null>(null);
  const [sideIncome, setSideIncome] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Use local state if user is editing, otherwise show DB value
  const startVal = startingBal ?? String(settings?.starting_balance ?? 0);
  const mainVal = mainIncome ?? String(settings?.main_income ?? 0);
  const sideVal = sideIncome ?? String(settings?.side_income ?? 0);

  async function handleSaveSettings() {
    setSaving(true);
    await saveSettings({
      starting_balance: parseFloat(startVal) || 0,
      main_income: parseFloat(mainVal) || 0,
      side_income: parseFloat(sideVal) || 0,
    });
    setStartingBal(null);
    setMainIncome(null);
    setSideIncome(null);
    setSaving(false);
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayItems = items.filter((i) => i.date === todayISO);
  const todayTasks = todayItems.filter((i) => i.type === 'task');
  const recentExpenses = transactions.filter((t) => t.type === 'expense').slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Tasks Today" value={todayTasks.length} subtitle={`${todayItems.length} total items`} icon={CheckSquare} />
        <StatCard title="Focus Time" value="0h" subtitle="Start a session to track" icon={Clock} />
        <StatCard title="Productivity" value="0%" subtitle="Complete tasks to build up" icon={TrendingUp} />
        <StatCard title="Spending Today" value={fmtCompact(todaySpending)} subtitle={todaySpending > 0 ? 'Keep tracking!' : 'No expenses yet'} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar — 2 cols */}
        <div className="lg:col-span-2">
          <InteractiveCalendar />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Income Input Section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl bg-[#18162e] border border-white/10 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-400" /> Income & Balance
              </h3>
              <button
                onClick={handleSaveSettings}
                disabled={saving || financeLoading}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Starting Balance', value: startVal, setter: setStartingBal },
                { label: 'Main Income', value: mainVal, setter: setMainIncome },
                { label: 'Side Income', value: sideVal, setter: setSideIncome },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      onBlur={handleSaveSettings}
                      className="w-full pl-7 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Balance display */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Total Balance</span>
                <span className={`text-lg font-bold ${totalBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmtCompact(totalBalance)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Finance Snapshot */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl bg-[#18162e] border border-white/10 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Finance</h3>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition"
              >
                <Plus className="w-3 h-3" /> Add Expense
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Budget Remaining</p>
                <p className={`text-base font-bold mt-0.5 ${budgetRemaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {fmtCompact(budgetRemaining)}
                </p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">This Month</p>
                <p className="text-base font-bold text-purple-400 mt-0.5">{fmtCompact(monthSpending)}</p>
              </div>
              <div className="col-span-2 rounded-lg bg-white/[0.03] border border-white/5 p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Today</p>
                <p className="text-base font-bold text-white mt-0.5">{fmtCompact(todaySpending)}</p>
              </div>
            </div>

            {/* Recent Expenses */}
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Recent Expenses</h4>
            {recentExpenses.length === 0 ? (
              <p className="text-xs text-gray-500">No expenses recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {recentExpenses.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{tx.description || tx.category}</p>
                      <p className="text-xs text-gray-500">{tx.category} · {tx.transaction_date}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-400">-${fmt(Number(tx.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

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

      <AddTransactionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
