import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { uuid } from '@/lib/utils';
import type {
  FinanceSettings,
  Transaction,
  TransactionInsert,
  BudgetRow,
} from '@/types/supabase';

// ── Category helpers ────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Education',
  'Health',
  'Bills',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Shopping: '#ec4899',
  Entertainment: '#a855f7',
  Education: '#6366f1',
  Health: '#10b981',
  Bills: '#ef4444',
  Other: '#6b7280',
};

// ── Date helpers ────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function startOfMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function startOfYearISO() {
  return `${new Date().getFullYear()}-01-01`;
}

// ── Hook ────────────────────────────────────────────────────────────────────

/** Default per-category budget when user hasn't set one */
export const DEFAULT_CATEGORY_BUDGET = 500;
/** Default total monthly budget = 8 categories × $500 */
export const DEFAULT_MONTHLY_BUDGET = EXPENSE_CATEGORIES.length * DEFAULT_CATEGORY_BUDGET;

export interface FinanceData {
  // Raw data
  settings: FinanceSettings | null;
  transactions: Transaction[];
  budgets: BudgetRow[];
  loading: boolean;

  // Computed values
  totalBalance: number;
  totalMonthlyBudget: number;
  budgetRemaining: number;
  todaySpending: number;
  weekSpending: number;
  monthSpending: number;
  monthIncome: number;

  // Settings mutations
  saveSettings: (updates: {
    starting_balance?: number;
    main_income?: number;
    side_income?: number;
    monthly_budget?: number;
  }) => Promise<void>;

  // Transaction mutations
  addTransaction: (tx: Omit<TransactionInsert, 'user_id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget mutations
  upsertBudgetLimit: (category: string, limitAmount: number) => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
}

export function useFinanceData(): FinanceData {
  const { user } = useAuth();
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch all data ──────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setTransactions([]);
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const [settingsRes, txRes, budgetsRes] = await Promise.all([
      supabase
        .from('finance_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', user.id),
    ]);

    if (settingsRes.data) setSettings(settingsRes.data);
    if (txRes.data) setTransactions(txRes.data);
    if (budgetsRes.data) setBudgets(budgetsRes.data);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Computed values ─────────────────────────────────────────────────────

  const today = todayISO();
  const weekStart = startOfWeekISO();
  const monthStart = startOfMonthISO();

  const todaySpending = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense' && t.transaction_date === today)
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions, today],
  );

  const weekSpending = useMemo(
    () =>
      transactions
        .filter(
          (t) => t.type === 'expense' && t.transaction_date >= weekStart,
        )
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions, weekStart],
  );

  const monthSpending = useMemo(
    () =>
      transactions
        .filter(
          (t) => t.type === 'expense' && t.transaction_date >= monthStart,
        )
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions, monthStart],
  );

  const monthIncome = useMemo(
    () =>
      transactions
        .filter(
          (t) => t.type === 'income' && t.transaction_date >= monthStart,
        )
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions, monthStart],
  );

  const totalOtherIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions],
  );

  const totalExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions],
  );

  const totalBalance = useMemo(() => {
    const s = settings;
    const base =
      Number(s?.starting_balance ?? 0) +
      Number(s?.main_income ?? 0) +
      Number(s?.side_income ?? 0);
    return base + totalOtherIncome - totalExpenses;
  }, [settings, totalOtherIncome, totalExpenses]);

  // Total monthly budget: explicit setting > sum of category limits > default
  const totalMonthlyBudget = useMemo(() => {
    const explicit = Number(settings?.monthly_budget ?? 0);
    if (explicit > 0) return explicit;
    // Fall back to sum of per-category limits (with $500 default each)
    const sumLimits = EXPENSE_CATEGORIES.reduce((sum, cat) => {
      const b = budgets.find((r) => r.category === cat);
      return sum + (b?.limit_amount ?? DEFAULT_CATEGORY_BUDGET);
    }, 0);
    return sumLimits;
  }, [settings, budgets]);

  // Budget remaining = monthly budget - this month's spending
  const budgetRemaining = useMemo(
    () => totalMonthlyBudget - monthSpending,
    [totalMonthlyBudget, monthSpending],
  );

  // ── Mutations ───────────────────────────────────────────────────────────

  const saveSettings = useCallback(
    async (updates: {
      starting_balance?: number;
      main_income?: number;
      side_income?: number;
      monthly_budget?: number;
    }) => {
      if (!user) return;

      // Optimistic update
      setSettings((prev) => {
        if (prev) return { ...prev, ...updates };
        return {
          id: '',
          user_id: user.id,
          starting_balance: 0,
          main_income: 0,
          side_income: 0,
          monthly_budget: 0,
          ...updates,
        };
      });

      const { data, error } = await supabase
        .from('finance_settings')
        .upsert(
          { user_id: user.id, ...updates },
          { onConflict: 'user_id' },
        )
        .select()
        .single();

      if (error) {
        // Rollback — re-fetch
        const { data: fresh } = await supabase
          .from('finance_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setSettings(fresh);
      } else if (data) {
        setSettings(data);
      }
    },
    [user],
  );

  const addTransaction = useCallback(
    async (tx: Omit<TransactionInsert, 'user_id'>) => {
      if (!user) return;

      const row: TransactionInsert = { ...tx, user_id: user.id };

      const { data, error } = await supabase
        .from('transactions')
        .insert(row)
        .select()
        .single();

      if (!error && data) {
        setTransactions((prev) => [data, ...prev]);
      }
    },
    [user],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) return;

      // Optimistic removal
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        // Re-fetch on failure
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false });
        if (data) setTransactions(data);
      }
    },
    [user],
  );

  const upsertBudgetLimit = useCallback(
    async (category: string, limitAmount: number) => {
      if (!user) return;

      // Optimistic
      setBudgets((prev) => {
        const idx = prev.findIndex((b) => b.category === category);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], limit_amount: limitAmount };
          return copy;
        }
        return [
          ...prev,
          {
            id: uuid(),
            user_id: user.id,
            category,
            limit_amount: limitAmount,
          },
        ];
      });

      const { error } = await supabase.from('budgets').upsert(
        { user_id: user.id, category, limit_amount: limitAmount },
        { onConflict: 'user_id,category' },
      );

      if (error) {
        const { data } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id);
        if (data) setBudgets(data);
      }
    },
    [user],
  );

  // ── Helpers for charts ────────────────────────────────────────────────

  return {
    settings,
    transactions,
    budgets,
    loading,
    totalBalance,
    totalMonthlyBudget,
    budgetRemaining,
    todaySpending,
    weekSpending,
    monthSpending,
    monthIncome,
    saveSettings,
    addTransaction,
    deleteTransaction,
    upsertBudgetLimit,
    refresh: fetchAll,
  };
}

// ── Utility: group spending by category for a time range ──────────────────

export function spendingByCategory(
  transactions: Transaction[],
  range: 'week' | 'month' | 'year',
) {
  let cutoff: string;
  if (range === 'week') cutoff = startOfWeekISO();
  else if (range === 'month') cutoff = startOfMonthISO();
  else cutoff = startOfYearISO();

  const map: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'expense' && t.transaction_date >= cutoff) {
      map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
    }
  }

  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

// ── Utility: spending trends (daily totals for area chart) ────────────────

export function spendingTrends(
  transactions: Transaction[],
  range: 'week' | 'month' | 'year',
) {
  let cutoff: string;
  if (range === 'week') cutoff = startOfWeekISO();
  else if (range === 'month') cutoff = startOfMonthISO();
  else cutoff = startOfYearISO();

  const map: Record<string, { income: number; expenses: number }> = {};

  for (const t of transactions) {
    if (t.transaction_date >= cutoff) {
      if (!map[t.transaction_date]) {
        map[t.transaction_date] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        map[t.transaction_date].income += Number(t.amount);
      } else {
        map[t.transaction_date].expenses += Number(t.amount);
      }
    }
  }

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      ...data,
    }));
}
