import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { AddTransactionModal } from '@/components/dashboard/AddTransactionModal';
import type { LucideIcon } from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    transactions,
    budgets,
    totalBalance,
    budgetRemaining,
    todaySpending,
    weekSpending,
    monthSpending,
    deleteTransaction,
    upsertBudgetLimit,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [pieRange, setPieRange] = useState<TimeRange>('month');
  const [trendRange, setTrendRange] = useState<TimeRange>('month');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  // Budget data with spent amounts for current month
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

  // ── Stat card colors ──────────────────────────────────────────────────

  const statCards = [
    {
      title: "Today's Spending",
      value: `$${fmt(todaySpending)}`,
      subtitle: 'Today',
      color: 'from-red-500/20 to-red-500/5',
      borderColor: 'border-red-500/20',
      valueColor: 'text-red-400',
      icon: TrendingDown,
      iconColor: 'text-red-400',
    },
    {
      title: 'This Week',
      value: `$${fmt(weekSpending)}`,
      subtitle: 'Mon – Sun',
      color: 'from-yellow-500/20 to-yellow-500/5',
      borderColor: 'border-yellow-500/20',
      valueColor: 'text-yellow-400',
      icon: Calendar,
      iconColor: 'text-yellow-400',
    },
    {
      title: 'This Month',
      value: `$${fmt(monthSpending)}`,
      subtitle: new Date().toLocaleString('en-US', { month: 'long' }),
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/20',
      valueColor: 'text-purple-400',
      icon: DollarSign,
      iconColor: 'text-purple-400',
    },
    {
      title: 'Total Balance',
      value: `$${fmt(totalBalance)}`,
      subtitle: `Budget remaining: $${fmt(budgetRemaining)}`,
      color: 'from-green-500/20 to-green-500/5',
      borderColor: 'border-green-500/20',
      valueColor: 'text-green-400',
      icon: Wallet,
      iconColor: 'text-green-400',
    },
  ];

  async function handleDelete(id: string) {
    await deleteTransaction(id);
    setDeleteConfirm(null);
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Finance Tracker</h1>
          <p className="text-sm text-gray-400">Track spending, manage budgets, and plan finances</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-purple-500/80 hover:bg-purple-500 text-white transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
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
                      contentStyle={{
                        background: '#1e1b3a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`$${fmt(value)}`, 'Spent']}
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
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 group"
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

                      {/* Delete */}
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h3 className="text-sm font-semibold text-white mb-4">Budget Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {EXPENSE_CATEGORIES.map((cat) => {
            const budget = budgets.find((b) => b.category === cat);
            const limit = budget?.limit_amount ?? 500;
            const spent = categorySpending[cat] ?? 0;
            return (
              <BudgetCard
                key={cat}
                category={cat}
                spent={spent}
                limit={limit}
                onUpdateLimit={(newLimit) => upsertBudgetLimit(cat, newLimit)}
              />
            );
          })}
        </div>
      </motion.div>

      <AddTransactionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
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

// ── Budget Card ─────────────────────────────────────────────────────────────

function BudgetCard({
  category,
  spent,
  limit,
  onUpdateLimit,
}: {
  category: string;
  spent: number;
  limit: number;
  onUpdateLimit: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(limit));

  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const barColor = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#10b981';
  const Icon = CATEGORY_ICONS[category] ?? DollarSign;

  function handleSave() {
    const val = parseFloat(editValue);
    if (val > 0) onUpdateLimit(val);
    setEditing(false);
  }

  return (
    <div className="rounded-xl bg-[#18162e] border border-white/10 p-4 group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${CATEGORY_COLORS[category]}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: CATEGORY_COLORS[category] }} />
          </div>
          <span className="text-sm font-medium text-white">{category}</span>
        </div>
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1"
            >
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:ring-1 focus:ring-purple-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button onClick={handleSave} className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setEditing(false)} className="p-1 rounded bg-white/5 text-gray-400 hover:bg-white/10">
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="edit-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => {
                setEditValue(String(limit));
                setEditing(true);
              }}
              className="p-1 rounded text-gray-600 hover:text-purple-400 hover:bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-all"
              title="Edit limit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-gray-400 mb-2">
        <span className="text-white font-semibold">${fmt(spent)}</span>{' '}
        of ${fmt(limit)}
      </p>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
        />
      </div>

      <p className="text-[10px] text-gray-500 mt-1.5 text-right">{Math.round(pct)}% used</p>
    </div>
  );
}
