import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DashboardItem, TaskStatus } from '@/types/dashboard';
import { TaskCard } from './TaskCard';
import { KanbanColumn } from './KanbanColumn';

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'completed'];

interface KanbanBoardProps {
  items: DashboardItem[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onCardClick: (item: DashboardItem) => void;
  onDelete: (id: string) => void;
}

// Sortable wrapper around TaskCard
export function SortableTaskCard({
  item,
  onClick,
  onDelete,
}: {
  item: DashboardItem;
  onClick: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { item } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard
        item={item}
        onClick={onClick}
        onDelete={onDelete}
        variant="kanban"
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export function KanbanBoard({ items, onStatusChange, onCardClick, onDelete }: KanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<DashboardItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const getColumnItems = useCallback(
    (status: TaskStatus) => items.filter((item) => (item.status ?? 'todo') === status),
    [items],
  );

  const findItemStatus = useCallback(
    (id: string): TaskStatus | null => {
      const item = items.find((i) => i.id === id);
      if (item) return item.status ?? 'todo';
      // Check if it's a column id
      if (STATUSES.includes(id as TaskStatus)) return id as TaskStatus;
      return null;
    },
    [items],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const item = items.find((i) => i.id === event.active.id);
      if (item) setActiveItem(item);
    },
    [items],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeStatus = findItemStatus(activeId);
      // Determine target status: if dropping over a column, use column id; if over a card, use that card's status
      let overStatus: TaskStatus | null = null;
      if (STATUSES.includes(overId as TaskStatus)) {
        overStatus = overId as TaskStatus;
      } else {
        overStatus = findItemStatus(overId);
      }

      if (activeStatus && overStatus && activeStatus !== overStatus) {
        onStatusChange(activeId, overStatus);
      }
    },
    [findItemStatus, onStatusChange],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);

      if (!over) return;

      const overId = over.id as string;
      const activeId = active.id as string;

      // If dropped over a column directly
      if (STATUSES.includes(overId as TaskStatus)) {
        onStatusChange(activeId, overId as TaskStatus);
      }
    },
    [onStatusChange],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={getColumnItems(status)}
            onCardClick={onCardClick}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="rotate-3 opacity-90">
            <TaskCard
              item={activeItem}
              onClick={() => {}}
              onDelete={() => {}}
              variant="kanban"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
