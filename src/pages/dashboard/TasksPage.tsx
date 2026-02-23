import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboard } from '@/contexts/DashboardContext';
import type { DashboardItem, TaskStatus, Importance } from '@/types/dashboard';
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

  // Drawer state
  const [drawerItem, setDrawerItem] = useState<DashboardItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Only show task-type items (not events/study)
  const taskItems = useMemo(() => items.filter((i) => i.type === 'task'), [items]);

  // Apply filters
  const filteredItems = useMemo(() => {
    let result = taskItems;

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
  }, [taskItems, search, statusFilter, importanceFilter]);

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
          <h1 className="text-2xl font-display font-bold text-white">Tasks</h1>
          <p className="text-sm text-gray-400 mt-1">
            {todoCount} to do · {inProgressCount} in progress · {completedCount} completed
          </p>
        </div>

        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
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
