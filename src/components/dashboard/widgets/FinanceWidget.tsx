import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Utensils, Bus, ShoppingBag, Gamepad2, GraduationCap, HeartPulse, Receipt, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';
import { spendingByCategory, CATEGORY_COLORS, EXPENSE_CATEGORIES, DEFAULT_CATEGORY_BUDGET } from '@/hooks/useFinanceData';
import { Link } from 'react-router-dom';

const CATEGORY_ICONS: Record<string, typeof DollarSign> = {
  Food: Utensils,
  Transport: Bus,
  Shopping: ShoppingBag,
  Entertainment: Gamepad2,
  Education: GraduationCap,
  Health: HeartPulse,
  Bills: Receipt,
  Other: MoreHorizontal,
};

function fmtCompact(n: number) {
  const num = Number(n) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return `${sign}$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function ChartTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-[#131127] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-medium text-white">{name}</p>
      <p className="text-xs text-purple-400">${value.toFixed(2)}</p>
    </div>
  );
}

export function FinanceWidget() {
  const { transactions, budgets, monthSpending, totalMonthlyBudget, budgetRemaining } = useFinance();

  const categoryData = useMemo(() => spendingByCategory(transactions, 'month'), [transactions]);

  const chartData = categoryData.length > 0
    ? categoryData
    : [{ name: 'No spending', value: 1 }];

  const chartColors = chartData.map(d =>
    d.name === 'No spending' ? '#1e1b3a' : (CATEGORY_COLORS[d.name] ?? '#6b7280')
  );

  // Budget rows — show categories that have spending or a budget set
  const budgetRows = useMemo(() => {
    const spendingMap = new Map(categoryData.map(d => [d.name, d.value]));
    return EXPENSE_CATEGORIES.map(cat => {
      const spent = spendingMap.get(cat) ?? 0;
      const budgetRow = budgets.find(b => b.category === cat);
      const limit = budgetRow?.limit_amount ?? DEFAULT_CATEGORY_BUDGET;
      return { category: cat, spent, limit };
    }).filter(r => r.spent > 0 || budgets.some(b => b.category === r.category))
      .slice(0, 5);
  }, [categoryData, budgets]);

  const budgetPct = totalMonthlyBudget > 0 ? Math.min((monthSpending / totalMonthlyBudget) * 100, 100) : 0;

  return (
    <motion.div
      layout
      className="rounded-2xl bg-[#18162e] border border-white/10 p-5 hover:border-white/20 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-semibold text-white">Finance</h3>
        </div>
        <Link to="/dashboard/finance" className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-medium">
          View All →
        </Link>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-[100px] h-[100px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={44}
                paddingAngle={categoryData.length > 1 ? 3 : 0}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={chartColors[idx]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Monthly Spending</p>
          <p className="text-xl font-bold text-white">{fmtCompact(monthSpending)}</p>
          <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            <span className={budgetRemaining >= 0 ? 'text-green-400' : 'text-red-400'}>{fmtCompact(budgetRemaining)}</span> remaining of {fmtCompact(totalMonthlyBudget)}
          </p>
        </div>
      </div>

      {/* Budget Rows */}
      {budgetRows.length > 0 ? (
        <div className="space-y-2.5">
          {budgetRows.map(row => {
            const Icon = CATEGORY_ICONS[row.category] ?? DollarSign;
            const pct = row.limit > 0 ? Math.min((row.spent / row.limit) * 100, 100) : 0;
            const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500';
            return (
              <div key={row.category} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[row.category]}20` }}>
                  <Icon className="w-3 h-3" style={{ color: CATEGORY_COLORS[row.category] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                  ${row.spent.toFixed(0)} / ${row.limit.toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center py-2">No spending recorded this month.</p>
      )}
    </motion.div>
  );
}
