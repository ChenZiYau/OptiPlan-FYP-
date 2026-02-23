import { CheckSquare, Columns3, Tag, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const previewFeatures = [
  { icon: Columns3, label: 'Kanban Boards', desc: 'Drag-and-drop task organization' },
  { icon: Tag, label: 'Labels & Priorities', desc: 'Color-coded urgency levels' },
  { icon: Clock, label: 'Due Dates & Reminders', desc: 'Never miss a deadline' },
];

export function TasksPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-center mb-4 mx-auto">
          <CheckSquare className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-xl font-display font-semibold text-white mb-2">Tasks</h2>
        <p className="text-gray-400 text-sm max-w-md mb-6">
          Full task management with drag-and-drop boards, priorities, and deadlines is coming soon.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
          {previewFeatures.map((f) => (
            <div
              key={f.label}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-left"
            >
              <f.icon className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-xs font-semibold text-white">{f.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>

        <span className="inline-block mt-6 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/20 text-[10px] font-semibold text-purple-300 uppercase tracking-wider">
          Coming Soon
        </span>
      </motion.div>
    </div>
  );
}
