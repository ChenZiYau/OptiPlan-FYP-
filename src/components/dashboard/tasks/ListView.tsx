import { Circle, CheckCircle2 } from 'lucide-react';
import type { DashboardItem, TaskStatus } from '@/types/dashboard';
import { TaskCard } from './TaskCard';

const STATUS_ORDER: TaskStatus[] = ['in-progress', 'todo', 'completed'];

interface ListViewProps {
  items: DashboardItem[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onCardClick: (item: DashboardItem) => void;
  onDelete: (id: string) => void;
}

export function ListView({ items, onStatusChange, onCardClick, onDelete }: ListViewProps) {
  const sortedItems = [...items].sort((a, b) => {
    const aIdx = STATUS_ORDER.indexOf(a.status ?? 'todo');
    const bIdx = STATUS_ORDER.indexOf(b.status ?? 'todo');
    if (aIdx !== bIdx) return aIdx - bIdx;
    return b.importance - a.importance;
  });

  return (
    <div className="space-y-2">
      {sortedItems.length === 0 && (
        <div className="flex items-center justify-center h-40 text-sm text-gray-500 border border-dashed border-white/10 rounded-lg">
          No tasks yet. Create one to get started.
        </div>
      )}

      {sortedItems.map((item) => {
        const isCompleted = item.status === 'completed';
        return (
          <div key={item.id} className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(item.id, isCompleted ? 'todo' : 'completed');
              }}
              className="shrink-0 transition-colors"
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Circle className="w-5 h-5 text-gray-600 hover:text-purple-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <TaskCard
                item={item}
                onClick={() => onCardClick(item)}
                onDelete={() => onDelete(item.id)}
                variant="list"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
