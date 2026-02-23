import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useFinance } from '@/contexts/FinanceContext';
import {
  EXPENSE_CATEGORIES,
  DEFAULT_CATEGORY_BUDGET,
} from '@/hooks/useFinanceData';

const CATEGORY_EMOJIS: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Shopping: '🛍️',
  Entertainment: '🎮',
  Education: '📚',
  Health: '⚕️',
  Bills: '💳',
  Other: '📦',
};

interface SetBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetBudgetModal({ open, onOpenChange }: SetBudgetModalProps) {
  const { settings, budgets, saveSettings, upsertBudgetLimit } = useFinance();

  // Total monthly budget
  const [totalBudget, setTotalBudget] = useState('');

  // Per-category limits
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (open) {
      const explicit = Number(settings?.monthly_budget ?? 0);
      setTotalBudget(explicit > 0 ? String(explicit) : '');

      const limits: Record<string, string> = {};
      for (const cat of EXPENSE_CATEGORIES) {
        const row = budgets.find((b) => b.category === cat);
        limits[cat] = String(row?.limit_amount ?? DEFAULT_CATEGORY_BUDGET);
      }
      setCategoryLimits(limits);
    }
  }, [open, settings, budgets]);

  function handleReset() {
    setTotalBudget('');
    const limits: Record<string, string> = {};
    for (const cat of EXPENSE_CATEGORIES) {
      limits[cat] = String(DEFAULT_CATEGORY_BUDGET);
    }
    setCategoryLimits(limits);
  }

  async function handleSave() {
    setSaving(true);

    try {
      const totalVal = parseFloat(totalBudget) || 0;

      // Save overall monthly budget to finance_settings
      await saveSettings({ monthly_budget: totalVal });

      // Save each category limit
      await Promise.all(
        EXPENSE_CATEGORIES.map((cat) => {
          const val = parseFloat(categoryLimits[cat]) || DEFAULT_CATEGORY_BUDGET;
          return upsertBudgetLimit(cat, val);
        }),
      );

      toast.success('Monthly budget saved');
      onOpenChange(false);
    } catch {
      toast.error('Failed to save budget');
    } finally {
      setSaving(false);
    }
  }

  function setCatLimit(cat: string, val: string) {
    setCategoryLimits((prev) => ({ ...prev, [cat]: val }));
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 bg-[#18162e] border border-white/10 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Set Monthly Budget</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Monthly Budget */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">
                Total Monthly Budget ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                placeholder={String(EXPENSE_CATEGORIES.length * DEFAULT_CATEGORY_BUDGET)}
                className="w-full bg-[#0B0A1A] border border-white/10 rounded-lg p-3 text-white text-lg font-semibold placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Category Limits Section */}
            <div className="bg-purple-900/10 border-l-2 border-purple-500 p-3 rounded-lg text-sm text-gray-400 my-4">
              Set budget limits for each category (optional)
            </div>

            <div className="grid grid-cols-2 gap-4">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div key={cat}>
                  <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5 block">
                    <span>{CATEGORY_EMOJIS[cat]}</span>
                    <span>{cat}</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={categoryLimits[cat] ?? ''}
                    onChange={(e) => setCatLimit(cat, e.target.value)}
                    placeholder="500"
                    className="w-full bg-[#0B0A1A] border border-white/10 rounded-lg p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
              {/* Reset */}
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Reset to Defaults
              </button>

              {/* Cancel & Save */}
              <div className="flex gap-3">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
