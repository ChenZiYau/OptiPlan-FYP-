import { MoreHorizontal, GripVertical, Calendar, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { DashboardItem, Importance } from '@/types/dashboard';

const IMPORTANCE_CONFIG: Record<Importance, { label: string; color: string; bg: string }> = {
  1: { label: 'Low', color: '#22c55e', bg: 'bg-green-500/10' },
  2: { label: 'Medium', color: '#f59e0b', bg: 'bg-amber-500/10' },
  3: { label: 'High', color: '#ef4444', bg: 'bg-red-500/10' },
};

interface TaskCardProps {
  item: DashboardItem;
  onClick: () => void;
  onDelete: () => void;
  variant?: 'kanban' | 'list';
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function TaskCard({ item, onClick, onDelete, variant = 'kanban', isDragging, dragHandleProps }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const imp = IMPORTANCE_CONFIG[item.importance];

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  if (variant === 'list') {
    return (
      <div
        className={`group flex items-center gap-3 px-4 py-3 bg-[#18162e] border border-white/10 rounded-lg hover:border-purple-500/30 transition-all cursor-pointer ${
          item.status === 'completed' ? 'opacity-60' : ''
        }`}
        onClick={onClick}
      >
        <div {...dragHandleProps} className="cursor-grab text-gray-600 hover:text-gray-400 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm text-white truncate ${item.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
            {item.title}
          </p>
          {item.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
          )}
        </div>

        <span
          className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${imp.color}20`, color: imp.color }}
        >
          {imp.label}
        </span>

        <span className="shrink-0 text-[10px] text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {item.date}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#1e1c38] border border-white/10 rounded-lg shadow-xl z-50 py-1 min-w-[120px]">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Kanban variant
  return (
    <div
      className={`group bg-[#18162e] border border-white/10 rounded-lg p-3 hover:border-purple-500/30 transition-all cursor-pointer ${
        isDragging ? 'opacity-50 shadow-2xl ring-2 ring-purple-500/40' : ''
      } ${item.status === 'completed' ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div {...dragHandleProps} className="cursor-grab text-gray-600 hover:text-gray-400 transition-colors">
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <p className={`text-sm font-medium text-white truncate ${item.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
            {item.title}
          </p>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#1e1c38] border border-white/10 rounded-lg shadow-xl z-50 py-1 min-w-[120px]">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-white/5 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {item.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.description}</p>
      )}

      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${imp.color}20`, color: imp.color }}
        >
          {imp.label}
        </span>
        <span className="text-[10px] text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {item.date}
        </span>
      </div>
    </div>
  );
}
