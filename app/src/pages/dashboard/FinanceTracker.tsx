import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingDown,
  Wallet,
  Calendar,
  Trash2,
  Plus,
  Pencil,
  Check,
  X,
  Utensils,
  Car,
  ShoppingBag,
  Gamepad2,
  GraduationCap,
  Heart,
  Receipt,
  MoreHorizontal,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  spendingByCategory,
  spendingTrends,
} from '@/hooks/useFinanceData';
import { HoverTip } from '@/components/HoverTip';
import { AddTransactionModal } from '@/components/dashboard/AddTransactionModal';
import { SetBudgetModal } from '@/components/dashboard/SetBudgetModal';
import type { LucideIcon } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Full precision: $1,234.56 */
function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Compact: $1.2k, $10k, $1.5m — used on stat cards */
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

type TimeRange = 'week' | 'month' | 'year';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Entertainment: Gamepad2,
  Education: GraduationCap,
  Health: Heart,
  Bills: Receipt,
  Other: MoreHorizontal,
};

const DONUT_COLORS = [
  '#a855f7', '#ec4899', '#3b82f6', '#10b981',
  '#f59e0b', '#6366f1', '#ef4444', '#6b7280',
];

// ── Component ───────────────────────────────────────────────────────────────

export function FinanceTracker() {
  const {
    settings,
    transactions,
    budgets,
    totalBalance,
    totalMonthlyBudget,
    budgetRemaining,
    todaySpending,
    weekSpending,
    monthSpending,
    deleteTransaction,
    upsertBudgetLimit,
    saveSettings,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [pieRange, setPieRange] = useState<TimeRange>('month');
  const [trendRange, setTrendRange] = useState<TimeRange>('month');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [balancePopover, setBalancePopover] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');
  const [mainIncomeInput, setMainIncomeInput] = useState('');
  const [sideIncomeInput, setSideIncomeInput] = useState('');

  // ── Computed chart data ───────────────────────────────────────────────

  const donutData = useMemo(
    () => spendingByCategory(transactions, pieRange),
    [transactions, pieRange],
  );

  const trendData = useMemo(
    () => spendingTrends(transactions, trendRange),
    [transactions, trendRange],
  );

  const recentExpenses = useMemo(
    () => transactions.filter((t) => t.type === 'expense').slice(0, 8),
    [transactions],
  );

  const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'expense' && t.transaction_date >= monthStart) {
        map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
      }
    }
    return map;
  }, [transactions, monthStart]);

  // ── Stat cards ────────────────────────────────────────────────────────

  const statCards = [
    {
      title: "Today's Spending",
      value: fmtCompact(todaySpending),
      subtitle: 'Today',
      color: 'from-red-500/20 to-red-500/5',
      borderColor: 'border-red-500/20',
      valueColor: 'text-red-400',
      icon: TrendingDown,
      iconColor: 'text-red-400',
    },
    {
      title: 'This Week',
      value: fmtCompact(weekSpending),
      subtitle: 'Mon – Sun',
      color: 'from-yellow-500/20 to-yellow-500/5',
      borderColor: 'border-yellow-500/20',
      valueColor: 'text-yellow-400',
      icon: Calendar,
      iconColor: 'text-yellow-400',
    },
    {
      title: 'This Month',
      value: fmtCompact(monthSpending),
      subtitle: new Date().toLocaleString('en-US', { month: 'long' }),
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/20',
      valueColor: 'text-purple-400',
      icon: DollarSign,
      iconColor: 'text-purple-400',
    },
  ];

  function openBalancePopover() {
    setBalanceInput(String(settings?.starting_balance ?? 0));
    setMainIncomeInput(String(settings?.main_income ?? 0));
    setSideIncomeInput(String(settings?.side_income ?? 0));
    setBalancePopover(true);
  }

  async function saveBalancePopover() {
    await saveSettings({
      starting_balance: parseFloat(balanceInput) || 0,
      main_income: parseFloat(mainIncomeInput) || 0,
      side_income: parseFloat(sideIncomeInput) || 0,
    });
    toast.success('Balance & income updated');
    setBalancePopover(false);
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id);
    toast.success('Expense deleted');
    setDeleteConfirm(null);
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Finance Tracker</h1>
          <p className="text-sm text-gray-400">Track spending, manage budgets, and plan finances</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <HoverTip label="Set monthly budget limits">
            <button
              onClick={() => setBudgetModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Wallet className="w-4 h-4" /> Set Budget
            </button>
          </HoverTip>
          <HoverTip label="Record income or expense">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-purple-500/80 hover:bg-purple-500 text-white transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          </HoverTip>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl bg-gradient-to-br ${card.color} border ${card.borderColor} p-5`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
                  {card.title}
                </p>
                <p className={`mt-2 text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
                <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </motion.div>
        ))}

        {/* Total Balance — clickable, opens popout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="group/bal relative rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 p-5 cursor-pointer hover:border-green-500/40 transition-colors"
          onClick={() => !balancePopover && openBalancePopover()}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium tracking-wider text-gray-400 uppercase">
                Total Balance
              </p>
              <p className="mt-2 text-2xl font-bold text-green-400">
                {fmtCompact(totalBalance)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Budget left: {fmtCompact(budgetRemaining)} of {fmtCompact(totalMonthlyBudget)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
          </div>

          {/* Hover info card — appears below */}
          {!balancePopover && (
            <div className="hidden group-hover/bal:block absolute z-40 top-full left-0 right-0 mt-2 rounded-xl bg-[#1a1735] border border-white/10 p-4 shadow-2xl shadow-black/50">
              {/* Arrow */}
              <div className="absolute bottom-full left-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#1a1735]" />
              <p className="text-xs font-semibold text-white mb-1.5">What is Total Balance?</p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                This is your <span className="text-green-400 font-medium">overall wealth</span> — starting balance + income minus all expenses. Your monthly budget of <span className="text-purple-400 font-semibold">{fmtCompact(totalMonthlyBudget)}</span> is separate.
              </p>
              <div className="mt-2.5 pt-2 border-t border-white/10">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  To change your monthly budget, use the <span className="text-purple-300 font-medium">"Set Budget"</span> button above or scroll to the <span className="text-purple-300 font-medium">Budget Overview</span> section below.
                </p>
              </div>
            </div>
          )}

          {/* Popout edit card */}
          <AnimatePresence>
            {balancePopover && (
              <PopoverCard onClose={() => setBalancePopover(false)}>
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-400" /> Edit Balance & Income
                </h4>
                <div className="space-y-3">
                  {[
                    { label: 'Starting Balance', value: balanceInput, setter: setBalanceInput },
                    { label: 'Main Income', value: mainIncomeInput, setter: setMainIncomeInput },
                    { label: 'Side Income', value: sideIncomeInput, setter: setSideIncomeInput },
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
                          onKeyDown={(e) => e.key === 'Enter' && saveBalancePopover()}
                          className="w-full pl-7 pr-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/40 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Total: <span className="text-green-400 font-semibold">${fmt(
                      (parseFloat(balanceInput) || 0) +
                      (parseFloat(mainIncomeInput) || 0) +
                      (parseFloat(sideIncomeInput) || 0)
                    )}</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setBalancePopover(false); }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); saveBalancePopover(); }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </PopoverCard>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Middle Section (2 columns) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Spending by Category (Donut) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-[#18162e] border border-white/10 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Spending by Category</h3>
            <PillToggle value={pieRange} onChange={setPieRange} />
          </div>

          {donutData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-xs text-gray-500">No spending data yet</p>
            </div>
          ) : (
            <>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[entry.name] ?? DONUT_COLORS[i % DONUT_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const entry = payload[0];
                        const name = entry.name as string;
                        const value = entry.value as number;
                        const total = donutData.reduce((s, d) => s + d.value, 0);
                        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                        const color =
                          CATEGORY_COLORS[name] ??
                          DONUT_COLORS[donutData.findIndex((d) => d.name === name) % DONUT_COLORS.length];
                        return (
                          <div className="rounded-xl bg-[#1e1b3a] border border-white/10 px-4 py-3 shadow-xl min-w-[180px]">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-sm font-bold text-white">{name}</span>
                            </div>
                            <div className="flex items-baseline justify-between gap-4">
                              <span className="text-xs text-gray-400">Amount</span>
                              <span className="text-base font-bold" style={{ color }}>
                                ${fmt(value)}
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between gap-4 mt-1">
                              <span className="text-xs text-gray-400">Share</span>
                              <span className="text-sm font-semibold text-gray-200">{pct}%</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[d.name] ?? DONUT_COLORS[i % DONUT_COLORS.length],
                      }}
                    />
                    <span className="text-xs text-gray-400 truncate flex-1">{d.name}</span>
                    <span className="text-xs font-medium text-gray-300">${fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* RIGHT column: Recent Expenses + Spending Trends */}
        <div className="space-y-6">
          {/* Recent Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl bg-[#18162e] border border-white/10 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Recent Expenses</h3>
              <span className="text-xs text-gray-500">{recentExpenses.length} items</span>
            </div>

            {recentExpenses.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">No transactions recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {recentExpenses.map((tx) => {
                  const Icon = CATEGORY_ICONS[tx.category] ?? DollarSign;
                  return (
                    <div
                      key={tx.id}
                      className="group/tx relative flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 group"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[tx.category] ?? '#6b7280'}20`,
                        }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: CATEGORY_COLORS[tx.category] ?? '#6b7280' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {tx.description || tx.category}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tx.category} · {tx.transaction_date}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-red-400 mr-1">
                        -${fmt(Number(tx.amount))}
                      </span>

                      {/* Hover tooltip */}
                      {tx.description && (
                        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tx:block pointer-events-none">
                          <div className="bg-[#0B0A1A] text-xs text-gray-300 border border-white/10 rounded-lg p-2 shadow-xl max-w-[260px] whitespace-normal">
                            {tx.description}
                          </div>
                        </div>
                      )}

                      {deleteConfirm === tx.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition"
                            title="Confirm delete"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1 rounded bg-white/5 text-gray-400 hover:bg-white/10 transition"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(tx.id)}
                          className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Spending Trends */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl bg-[#18162e] border border-white/10 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Spending Trends</h3>
              <PillToggle value={trendRange} onChange={setTrendRange} />
            </div>

            {trendData.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center">
                <p className="text-xs text-gray-500">No data yet. Start tracking to see trends.</p>
              </div>
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1e1b3a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`$${fmt(v)}`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#a855f7"
                      fill="url(#spendGrad)"
                      strokeWidth={2}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Budget Overview ───────────────────────────────────────────────── */}
      <BudgetOverviewCard
        budgets={budgets}
        categorySpending={categorySpending}
        onUpdateLimit={upsertBudgetLimit}
      />

      <AddTransactionModal open={modalOpen} onOpenChange={setModalOpen} />
      <SetBudgetModal open={budgetModalOpen} onOpenChange={setBudgetModalOpen} />
    </div>
  );
}

// ── Popover Card (click-away to close) ──────────────────────────────────────

function PopoverCard({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay so the opening click doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-50 top-full left-0 right-0 mt-2 rounded-xl bg-[#1a1735] border border-white/10 p-5 shadow-2xl shadow-black/40"
    >
      {children}
    </motion.div>
  );
}

// ── Pill Toggle ─────────────────────────────────────────────────────────────

function PillToggle({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}) {
  const options: TimeRange[] = ['week', 'month', 'year'];
  return (
    <div className="flex rounded-lg bg-white/5 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`relative px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
            value === o ? 'text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {value === o && (
            <motion.div
              layoutId="pillToggle"
              className="absolute inset-0 bg-purple-500/20 border border-purple-500/30 rounded-md"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{o}</span>
        </button>
      ))}
    </div>
  );
}

// ── Budget Overview Card ────────────────────────────────────────────────────

function BudgetOverviewCard({
  budgets,
  categorySpending,
  onUpdateLimit,
}: {
  budgets: { category: string; limit_amount: number }[];
  categorySpending: Record<string, number>;
  onUpdateLimit: (category: string, limit: number) => void;
}) {
  const [setAllValue, setSetAllValue] = useState('');
  const [applyingAll, setApplyingAll] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  async function handleSetAll() {
    const val = parseFloat(setAllValue);
    if (!val || val <= 0) return;
    setApplyingAll(true);
    await Promise.all(EXPENSE_CATEGORIES.map((cat) => onUpdateLimit(cat, val)));
    setApplyingAll(false);
    setSetAllValue('');
  }

  function openEditPopover(cat: string, currentLimit: number) {
    setEditingCat(cat);
    setEditValue(String(currentLimit));
  }

  function saveEdit() {
    if (!editingCat) return;
    const val = parseFloat(editValue);
    if (val > 0) onUpdateLimit(editingCat, val);
    setEditingCat(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-xl bg-[#18162e] border border-white/10 p-5"
    >
      {/* Header + Set All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h3 className="text-sm font-semibold text-white">Budget Overview</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">Set all limits:</span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={setAllValue}
              onChange={(e) => setSetAllValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetAll()}
              placeholder="500.00"
              className="w-28 pl-6 pr-2 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <button
            onClick={handleSetAll}
            disabled={applyingAll || !setAllValue}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {applyingAll ? 'Applying...' : 'Apply All'}
          </button>
        </div>
      </div>

      {/* Category rows */}
      <div className="space-y-3">
        {EXPENSE_CATEGORIES.map((cat, i) => {
          const budget = budgets.find((b) => b.category === cat);
          const limit = budget?.limit_amount ?? 500;
          const spent = categorySpending[cat] ?? 0;
          const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const barColor = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#10b981';
          const Icon = CATEGORY_ICONS[cat] ?? DollarSign;
          const isEditing = editingCat === cat;

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.03 }}
              className="relative group"
            >
              <div
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/[0.03] transition-colors"
                onClick={() => !isEditing && openEditPopover(cat, limit)}
              >
                {/* Icon + name */}
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${CATEGORY_COLORS[cat]}20` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: CATEGORY_COLORS[cat] }} />
                </div>
                <span className="text-sm font-medium text-white w-28 truncate">{cat}</span>

                {/* Progress bar */}
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                  />
                </div>

                {/* Spent / Limit */}
                <span className="text-xs text-gray-300 tabular-nums text-right shrink-0">
                  <span className="text-white font-semibold">{fmtCompact(spent)}</span>
                  <span className="text-gray-500"> / {fmtCompact(limit)}</span>
                </span>

                <Pencil className="w-3 h-3 text-gray-600 group-hover:text-purple-400 shrink-0 transition-colors" />

                <span
                  className="text-[10px] font-medium w-8 text-right tabular-nums shrink-0"
                  style={{ color: barColor }}
                >
                  {Math.round(pct)}%
                </span>
              </div>

              {/* Popout edit card */}
              <AnimatePresence>
                {isEditing && (
                  <PopoverCard onClose={() => setEditingCat(null)}>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: `${CATEGORY_COLORS[cat]}20` }}
                      >
                        <Icon className="w-3 h-3" style={{ color: CATEGORY_COLORS[cat] }} />
                      </div>
                      {cat} Budget
                    </h4>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 mb-1 block">Monthly Limit</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') setEditingCat(null);
                            }}
                            autoFocus
                            className="w-full pl-7 pr-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Spent: <span className="text-white font-medium">${fmt(spent)}</span>
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingCat(null)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </PopoverCard>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
