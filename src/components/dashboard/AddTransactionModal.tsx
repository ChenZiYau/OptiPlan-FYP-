import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFinance } from '@/contexts/FinanceContext';
import { EXPENSE_CATEGORIES, DEFAULT_CATEGORY_BUDGET } from '@/hooks/useFinanceData';
import { useCurrency } from '@/hooks/useCurrency';
import {
  DollarSign,
  Calendar,
  FileText,
  Tag,
  TrendingDown,
  Loader2,
} from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DatePreset = 'today' | 'yesterday' | 'custom';

export function AddTransactionModal({ open, onOpenChange }: Props) {
  const { addTransaction, monthSpending, totalMonthlyBudget, budgets, transactions } = useFinance();
  const { symbol } = useCurrency();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function getDate() {
    if (datePreset === 'today') return new Date().toISOString().slice(0, 10);
    if (datePreset === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    }
    return customDate;
  }

  function reset() {
    setAmount('');
    setCategory('');
    setDatePreset('today');
    setCustomDate('');
    setDescription('');
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }
    if (datePreset === 'custom' && !customDate) {
      setError('Please select a date.');
      return;
    }
    const txDate = getDate();
    if (!txDate) {
      setError('Please select a date.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addTransaction({
        type: 'expense',
        amount: parsedAmount,
        category,
        transaction_date: txDate,
        description: description.trim() || null,
        is_recurring: false,
      });
      toast.success(`Expense of ${symbol}${parsedAmount.toFixed(2)} added`, {
        description: `${category} · ${txDate}`,
      });

      // Budget warnings
      const newMonthTotal = monthSpending + parsedAmount;
      if (newMonthTotal > totalMonthlyBudget) {
        toast.warning('You\'ve exceeded your monthly budget!', {
          description: `${symbol}${newMonthTotal.toFixed(2)} spent of ${symbol}${totalMonthlyBudget.toFixed(2)} budget`,
        });
      } else if (newMonthTotal >= totalMonthlyBudget * 0.9) {
        toast.warning('Approaching monthly budget limit', {
          description: `${symbol}${newMonthTotal.toFixed(2)} spent — ${Math.round((newMonthTotal / totalMonthlyBudget) * 100)}% used`,
        });
      }

      // Per-category budget warning
      const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
      const catSpent = transactions
        .filter(t => t.type === 'expense' && t.category === category && t.transaction_date >= monthStart)
        .reduce((sum, t) => sum + Number(t.amount), 0) + parsedAmount;
      const catBudget = budgets.find(b => b.category === category);
      const catLimit = catBudget?.limit_amount ?? DEFAULT_CATEGORY_BUDGET;
      if (catSpent > catLimit) {
        toast.warning(`${category} budget exceeded!`, {
          description: `${symbol}${catSpent.toFixed(2)} spent of ${symbol}${catLimit.toFixed(2)} limit`,
        });
      }

      reset();
      onOpenChange(false);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#131127] border-white/10 text-white sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            Add Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
              <DollarSign className="w-3.5 h-3.5" /> Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">
                {symbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-14 pr-4 py-3 text-2xl font-bold bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
              <Tag className="w-3.5 h-3.5" /> Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all ${
                    category === c
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
              <Calendar className="w-3.5 h-3.5" /> Date
            </label>
            <div className="flex gap-2">
              {(['today', 'yesterday', 'custom'] as DatePreset[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDatePreset(p)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all capitalize ${
                    datePreset === p
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {datePreset === 'custom' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="mt-2 w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
              <FileText className="w-3.5 h-3.5" /> Note (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="w-full px-3 py-2.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>


          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-red-500/80 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {submitting ? 'Saving...' : 'Add Expense'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
