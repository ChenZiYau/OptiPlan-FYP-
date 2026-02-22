import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { StatCard } from '@/components/admin/StatCard';
import { mockExpenses, mockBudgets, donutChartData, DONUT_COLORS, areaChartData } from '@/constants/dashboardData';

export function FinanceTracker() {
  const totalSpent = mockBudgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Balance" value="$0.00" subtitle="Add income to get started" icon={Wallet} />
        <StatCard title="Monthly Income" value="$0.00" subtitle="No income recorded" icon={TrendingUp} />
        <StatCard title="Monthly Expenses" value={totalSpent > 0 ? `$${totalSpent.toLocaleString()}` : '$0.00'} subtitle={totalSpent > 0 ? `${mockBudgets.length} categories` : 'No expenses yet'} icon={TrendingDown} />
        <StatCard title="Savings Rate" value="0%" subtitle="Set a savings goal" icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut chart */}
        <div className="rounded-xl bg-[#18162e] border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Spending Breakdown</h3>
          {donutChartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-xs text-gray-500">No spending data yet</p>
            </div>
          ) : (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutChartData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e1b3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                {donutChartData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i] }} />
                    <span className="text-xs text-gray-400 truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Expenses list */}
        <div className="rounded-xl bg-[#18162e] border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Recent Transactions</h3>
          {mockExpenses.length === 0 ? (
            <p className="text-xs text-gray-500">No transactions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {mockExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <exp.icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{exp.description}</p>
                    <p className="text-xs text-gray-500">{exp.category} · {exp.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-400">-${exp.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Budget grid */}
        <div className="rounded-xl bg-[#18162e] border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Budgets</h3>
          {mockBudgets.length === 0 ? (
            <p className="text-xs text-gray-500">No budgets set up yet.</p>
          ) : (
            <div className="space-y-4">
              {mockBudgets.map((b) => {
                const pct = Math.round((b.spent / b.limit) * 100);
                const over = pct > 90;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{b.category}</span>
                      <span className={`text-xs font-medium ${over ? 'text-red-400' : 'text-gray-500'}`}>
                        ${b.spent} / ${b.limit}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: b.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Area chart — full width */}
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Income vs Expenses (6 months)</h3>
        {areaChartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-xs text-gray-500">No financial history yet. Start tracking to see trends.</p>
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e1b3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="income" stroke="#a855f7" fill="url(#incomeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="#ec4899" fill="url(#expenseGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
