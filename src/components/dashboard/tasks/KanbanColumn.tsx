import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { DashboardItem, TaskStatus } from '@/types/dashboard';
import { SortableTaskCard } from './KanbanBoard';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; dotColor: string }> = {
  'todo': { label: 'To Do', color: 'text-indigo-400', dotColor: 'bg-indigo-400' },
  'in-progress': { label: 'In Progress', color: 'text-amber-400', dotColor: 'bg-amber-400' },
  'completed': { label: 'Completed', color: 'text-emerald-400', dotColor: 'bg-emerald-400' },
};

interface KanbanColumnProps {
  status: TaskStatus;
  items: DashboardItem[];
  onCardClick: (item: DashboardItem) => void;
  onDelete: (id: string) => void;
}

export function KanbanColumn({ status, items, onCardClick, onDelete }: KanbanColumnProps) {
  const config = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-h-[300px] rounded-xl bg-white/[0.02] border transition-colors ${
        isOver ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/[0.06]'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
        <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
        <span className="ml-auto text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <SortableTaskCard
              key={item.id}
              item={item}
              onClick={() => onCardClick(item)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
          {items.length === 0 && (
            <div className="flex items-center justify-center h-20 text-xs text-gray-600 border border-dashed border-white/10 rounded-lg">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
