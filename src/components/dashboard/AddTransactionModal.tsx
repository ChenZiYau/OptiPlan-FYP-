import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFinance } from '@/contexts/FinanceContext';
import { EXPENSE_CATEGORIES } from '@/hooks/useFinanceData';
import {
  DollarSign,
  Calendar,
  FileText,
  Tag,
  Repeat,
  TrendingDown,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TxType = 'expense' | 'income';
type DatePreset = 'today' | 'yesterday' | 'custom';

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Refund',
  'Other',
];

export function AddTransactionModal({ open, onOpenChange }: Props) {
  const { addTransaction } = useFinance();

  const [txType, setTxType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState('');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories =
    txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

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
    setIsRecurring(false);
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
    const txDate = getDate();
    if (!txDate) {
      setError('Please select a date.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addTransaction({
        type: txType,
        amount: parsedAmount,
        category,
        transaction_date: txDate,
        description: description.trim() || null,
        is_recurring: isRecurring,
      });
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
          <DialogTitle className="text-lg font-semibold">
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        {/* Expense / Income toggle */}
        <div className="px-6 pt-4">
          <div className="flex rounded-lg bg-white/5 p-1">
            {(['expense', 'income'] as TxType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTxType(t);
                  setCategory('');
                }}
                className={`relative flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  txType === t ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {txType === t && (
                  <motion.div
                    layoutId="txTypeTab"
                    className={`absolute inset-0 rounded-md ${
                      t === 'expense'
                        ? 'bg-red-500/20 border border-red-500/30'
                        : 'bg-green-500/20 border border-green-500/30'
                    }`}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {t === 'expense' ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  {t === 'expense' ? 'Expense' : 'Income'}
                </span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
              <DollarSign className="w-3.5 h-3.5" /> Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 text-2xl font-bold bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              {categories.map((c) => (
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

          {/* Recurring toggle */}
          <div className="flex items-center justify-between py-2">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <Repeat className="w-4 h-4 text-gray-400" />
              Recurring Subscription/Bill
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => setIsRecurring(!isRecurring)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isRecurring ? 'bg-purple-500' : 'bg-white/10'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  isRecurring ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
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
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              txType === 'expense'
                ? 'bg-red-500/80 hover:bg-red-500 text-white'
                : 'bg-green-500/80 hover:bg-green-500 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : txType === 'expense' ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            {submitting
              ? 'Saving...'
              : `Add ${txType === 'expense' ? 'Expense' : 'Income'}`}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
