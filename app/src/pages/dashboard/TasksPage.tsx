import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { HoverTip } from '@/components/HoverTip';
import { motion } from 'framer-motion';
import { useDashboard } from '@/contexts/DashboardContext';
import type { DashboardItem, TaskStatus, Importance, ItemType } from '@/types/dashboard';
import { TaskFilters } from '@/components/dashboard/tasks/TaskFilters';
import type { ViewMode } from '@/components/dashboard/tasks/TaskFilters';
import { KanbanBoard } from '@/components/dashboard/tasks/KanbanBoard';
import { ListView } from '@/components/dashboard/tasks/ListView';
import { TaskDetailDrawer } from '@/components/dashboard/tasks/TaskDetailDrawer';

export function TasksPage() {
  const { items, updateItem, removeItem, openModal } = useDashboard();

  // View & filter state
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [importanceFilter, setImportanceFilter] = useState<Importance | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');

  // Drawer state
  const [drawerItem, setDrawerItem] = useState<DashboardItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // All items (tasks, events, study)
  const taskItems = useMemo(() => items, [items]);

  // Apply filters
  const filteredItems = useMemo(() => {
    let result = taskItems;

    if (typeFilter !== 'all') {
      result = result.filter((i) => i.type === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((i) => (i.status ?? 'todo') === statusFilter);
    }

    if (importanceFilter !== 'all') {
      result = result.filter((i) => i.importance === importanceFilter);
    }

    return result;
  }, [taskItems, search, statusFilter, importanceFilter, typeFilter]);

  const handleStatusChange = useCallback(
    (id: string, status: TaskStatus) => {
      updateItem(id, { status });
    },
    [updateItem],
  );

  const handleCardClick = useCallback((item: DashboardItem) => {
    setDrawerItem(item);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    // Delay clearing item so exit animation plays with content
    setTimeout(() => setDrawerItem(null), 300);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      removeItem(id);
      if (drawerItem?.id === id) {
        handleDrawerClose();
      }
    },
    [removeItem, drawerItem, handleDrawerClose],
  );

  // Stats
  const todoCount = taskItems.filter((i) => (i.status ?? 'todo') === 'todo').length;
  const inProgressCount = taskItems.filter((i) => i.status === 'in-progress').length;
  const completedCount = taskItems.filter((i) => i.status === 'completed').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">All Items</h1>
          <p className="text-sm text-gray-400 mt-1">
            {todoCount} to do · {inProgressCount} in progress · {completedCount} completed
          </p>
        </div>

        <HoverTip label="Create a new task">
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        </HoverTip>
      </div>

      {/* Filters */}
      <TaskFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        importanceFilter={importanceFilter}
        onImportanceFilterChange={setImportanceFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {/* Content */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          items={filteredItems}
          onStatusChange={handleStatusChange}
          onCardClick={handleCardClick}
          onDelete={handleDelete}
        />
      ) : (
        <ListView
          items={filteredItems}
          onStatusChange={handleStatusChange}
          onCardClick={handleCardClick}
          onDelete={handleDelete}
        />
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        item={drawerItem}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onUpdate={updateItem}
        onDelete={handleDelete}
      />
    </motion.div>
  );
}
