import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { HabitWithIcon } from '@/hooks/useHabits';
import { resolveIcon } from '@/hooks/useHabits';

const COMMON_ICONS = [
  'Droplets', 'BookOpen', 'BrainCircuit', 'Heart', 'Calendar', 'Dumbbell', 'Coffee', 'Moon', 'Sun', 'Book',
  'Code', 'Music', 'PenTool', 'Smile', 'Zap'
];

interface HabitManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: HabitWithIcon[];
  onAddHabit: (habit: Omit<HabitWithIcon, 'id' | 'icon'>) => void;
  onRemoveHabit: (id: string) => void;
}

export function HabitManagerModal({ isOpen, onClose, habits, onAddHabit, onRemoveHabit }: HabitManagerModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIconName, setNewIconName] = useState('CheckCircle');
  const [iconSearch, setIconSearch] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onAddHabit({ label: newLabel.trim(), desc: newDesc.trim(), iconName: newIconName });
    setIsAdding(false);
    setNewLabel('');
    setNewDesc('');
    setNewIconName('CheckCircle');
    setIconSearch('');
  };

  const filteredIcons = COMMON_ICONS.filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()));
  const NewIconPreview = resolveIcon(newIconName);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-[#18162e] border border-white/10 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <h2 className="text-lg font-bold text-white">Manage Daily Habits</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
              {!isAdding ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {habits.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No habits defined. Add one below!</p>
                    ) : (
                      habits.map((habit) => (
                        <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                              <habit.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{habit.label}</p>
                              {habit.desc && <p className="text-xs text-gray-500 truncate">{habit.desc}</p>}
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveHabit(habit.id)}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 shrink-0"
                            title="Remove Habit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-3 rounded-lg border border-dashed border-white/20 text-sm font-medium text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add New Habit
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Habit Name</label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Meditate"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-all"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Description (Optional)</label>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="e.g. 10 minutes of mindfulness"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-2">
                      Icon <NewIconPreview className="w-4 h-4 text-purple-400" />
                    </label>
                    
                    <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin rounded-lg border border-white/5 p-2 bg-black/20">
                      {filteredIcons.map(iconName => {
                        const Icon = (LucideIcons as any)[iconName];
                        if (!Icon) return null;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setNewIconName(iconName)}
                            className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                              newIconName === iconName ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-white hover:bg-white/10 border border-transparent'
                            }`}
                            title={iconName}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newLabel.trim()}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Save Habit
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
