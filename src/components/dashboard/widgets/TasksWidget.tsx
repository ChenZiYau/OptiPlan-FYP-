import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus, Circle, CheckCircle2 } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';
import type { DashboardItem } from '@/types/dashboard';
import { Link } from 'react-router-dom';

type TabKey = 'todo' | 'in-progress' | 'completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const priorityColors: Record<number, { bg: string; text: string; label: string }> = {
  3: { bg: 'bg-red-500/15', text: 'text-red-400', label: 'High' },
  2: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'Med' },
  1: { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Low' },
};

export function TasksWidget() {
  const { items, updateItem } = useDashboard();
  const [activeTab, setActiveTab] = useState<TabKey>('todo');

  const taskItems = items.filter(i => i.type === 'task');

  const filteredTasks = taskItems.filter(t => {
    const status = t.status ?? 'todo';
    return status === activeTab;
  });

  const counts: Record<TabKey, number> = {
    'todo': taskItems.filter(t => (t.status ?? 'todo') === 'todo').length,
    'in-progress': taskItems.filter(t => t.status === 'in-progress').length,
    'completed': taskItems.filter(t => t.status === 'completed').length,
  };

  function toggleComplete(task: DashboardItem) {
    const current = task.status ?? 'todo';
    const next = current === 'completed' ? 'todo' : 'completed';
    updateItem(task.id, { status: next });
  }

  return (
    <motion.div
      layout
      className="rounded-2xl bg-[#18162e] border border-white/10 p-5 hover:border-white/20 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Tasks</h3>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/tasks"
            className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            <Plus className="w-3 h-3" /> New
          </Link>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-white/[0.03] rounded-lg p-0.5 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 relative px-2 py-1.5 text-[11px] font-medium rounded-md transition-all ${
              activeTab === tab.key
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {activeTab === tab.key && (
              <motion.div
                layoutId="tasks-tab-bg"
                className="absolute inset-0 bg-purple-500/20 border border-purple-500/30 rounded-md"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label} ({counts[tab.key]})</span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-1.5 max-h-[240px] overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-gray-500 text-center py-6"
            >
              {activeTab === 'todo' ? 'No tasks to do — nice work!' : activeTab === 'in-progress' ? 'Nothing in progress.' : 'No completed tasks yet.'}
            </motion.p>
          ) : (
            filteredTasks.slice(0, 8).map(task => {
              const priority = priorityColors[task.importance] ?? priorityColors[1];
              const isCompleted = task.status === 'completed';
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                >
                  <button
                    onClick={() => toggleComplete(task)}
                    className="flex-shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-green-400" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    )}
                  </button>
                  <span className={`flex-1 text-xs truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                    {task.title}
                  </span>
                  <span className={`${priority.bg} ${priority.text} text-[9px] font-semibold px-1.5 py-0.5 rounded`}>
                    {priority.label}
                  </span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
