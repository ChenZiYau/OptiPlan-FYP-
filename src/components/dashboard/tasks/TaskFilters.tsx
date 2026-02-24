import { LayoutGrid, List, Search } from 'lucide-react';
import type { Importance, TaskStatus, ItemType } from '@/types/dashboard';

export type ViewMode = 'kanban' | 'list';

interface TaskFiltersProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: TaskStatus | 'all';
  onStatusFilterChange: (value: TaskStatus | 'all') => void;
  importanceFilter: Importance | 'all';
  onImportanceFilterChange: (value: Importance | 'all') => void;
  typeFilter: ItemType | 'all';
  onTypeFilterChange: (value: ItemType | 'all') => void;
}

export function TaskFilters({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  importanceFilter,
  onImportanceFilterChange,
  typeFilter,
  onTypeFilterChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* View toggle */}
      <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
        <button
          onClick={() => onViewModeChange('kanban')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === 'kanban' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Board
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <List className="w-3.5 h-3.5" /> List
        </button>
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-all"
        />
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as TaskStatus | 'all')}
        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500/50 transition-all [color-scheme:dark]"
      >
        <option value="all">All Status</option>
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      {/* Importance filter */}
      <select
        value={importanceFilter}
        onChange={(e) => {
          const v = e.target.value;
          onImportanceFilterChange(v === 'all' ? 'all' : (Number(v) as Importance));
        }}
        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500/50 transition-all [color-scheme:dark]"
      >
        <option value="all">All Importance</option>
        <option value="1">Low</option>
        <option value="2">Medium</option>
        <option value="3">High</option>
      </select>

      {/* Type filter */}
      <select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value as ItemType | 'all')}
        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500/50 transition-all [color-scheme:dark]"
      >
        <option value="all">All Types</option>
        <option value="task">Task</option>
        <option value="event">Event</option>
        <option value="study">Study</option>
      </select>
    </div>
  );
}
