import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Task, TaskStatus, TASK_STATUS_LABELS, TASK_STATUS_ORDER } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useApp } from '@/contexts/AppContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onCreateTask?: (status: TaskStatus) => void;
}

export function KanbanBoard({ 
  tasks, 
  onTaskClick, 
  onTaskEdit, 
  onTaskDelete,
  onCreateTask 
}: KanbanBoardProps) {
  const { updateTask } = useApp();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };

    tasks.forEach(task => {
      const status = task.status || (task.isDelivered ? 'done' : 'backlog');
      grouped[status].push(task);
    });

    // Sort by priority within each column (P0 first)
    Object.keys(grouped).forEach(status => {
      grouped[status as TaskStatus].sort((a, b) => a.priority - b.priority);
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as TaskStatus;

    // Check if dropped on a column
    if (TASK_STATUS_ORDER.includes(targetStatus)) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== targetStatus) {
        updateTask(taskId, { 
          status: targetStatus,
          isDelivered: targetStatus === 'done',
          completedAt: targetStatus === 'done' ? new Date() : undefined,
        });
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find which column the task is being dragged over
    const overColumn = TASK_STATUS_ORDER.find(status => status === overId);
    if (overColumn) return; // Already handled by handleDragEnd

    // Check if dragging over another task
    const overTask = tasks.find(t => t.id === overId);
    if (overTask) {
      const activeTask = tasks.find(t => t.id === activeId);
      if (activeTask && activeTask.status !== overTask.status) {
        // Move to the same column as the task being dragged over
        updateTask(activeId as string, {
          status: overTask.status,
          isDelivered: overTask.status === 'done',
          completedAt: overTask.status === 'done' ? new Date() : undefined,
        });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {TASK_STATUS_ORDER.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              title={TASK_STATUS_LABELS[status]}
              tasks={tasksByStatus[status]}
              onTaskClick={onTaskClick}
              onTaskEdit={onTaskEdit}
              onTaskDelete={onTaskDelete}
              onCreateTask={() => onCreateTask?.(status)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay>
        {activeTask && (
          <KanbanCard task={activeTask} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}
