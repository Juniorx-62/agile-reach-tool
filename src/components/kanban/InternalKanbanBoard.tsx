import React, { useMemo, useState } from 'react';
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
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, User, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  useTasks, 
  Task, 
  TaskStatus, 
  TASK_STATUS_LABELS, 
  TASK_STATUS_ORDER,
  TASK_PRIORITY_LABELS,
  TASK_AREA_LABELS,
} from '@/hooks/useInternalData';

interface InternalKanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskUpdate: (id: string, updates: Partial<Task>) => Promise<void>;
  onCreateTask?: (status: TaskStatus) => void;
}

function TaskCard({ 
  task, 
  isDragging, 
  onClick 
}: { 
  task: Task; 
  isDragging?: boolean; 
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'P1': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'P2': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'P3': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border bg-card hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg rotate-2"
      )}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
            {task.priority}
          </Badge>
          {task.area && (
            <Badge variant="secondary" className="text-xs">
              {TASK_AREA_LABELS[task.area]}
            </Badge>
          )}
        </div>

        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>

        {task.project && (
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: task.project.color }}
            />
            <span className="text-xs text-muted-foreground truncate">
              {task.project.name}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignee.photo_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {task.assignee.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {task.assignee.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="text-xs">Não atribuído</span>
            </div>
          )}

          {task.estimated_hours && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{task.estimated_hours}h</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskColumn({ 
  status, 
  title, 
  tasks, 
  onCreateTask,
  onTaskClick,
}: { 
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onCreateTask?: () => void;
  onTaskClick?: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const getColumnColor = () => {
    switch (status) {
      case 'backlog': return 'border-t-muted-foreground';
      case 'todo': return 'border-t-blue-500';
      case 'in_progress': return 'border-t-purple-500';
      case 'in_review': return 'border-t-orange-500';
      case 'done': return 'border-t-green-500';
      default: return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 min-w-72 rounded-lg border border-t-4 bg-muted/30",
        getColumnColor(),
        isOver && "bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        {onCreateTask && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateTask}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {tasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onClick={() => onTaskClick?.(task)}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhuma tarefa
          </p>
        )}
      </div>
    </div>
  );
}

export function InternalKanbanBoard({ 
  tasks, 
  onTaskClick,
  onTaskUpdate,
  onCreateTask,
}: InternalKanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
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
      grouped[task.status].push(task);
    });

    // Sort by priority within each column (P0 first)
    Object.keys(grouped).forEach(status => {
      grouped[status as TaskStatus].sort((a, b) => {
        const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    });

    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as TaskStatus;

    if (TASK_STATUS_ORDER.includes(targetStatus)) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== targetStatus) {
        await onTaskUpdate(taskId, { 
          status: targetStatus,
          is_delivered: targetStatus === 'done',
          completed_at: targetStatus === 'done' ? new Date().toISOString() : null,
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
    >
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {TASK_STATUS_ORDER.map(status => (
          <TaskColumn
            key={status}
            status={status}
            title={TASK_STATUS_LABELS[status]}
            tasks={tasksByStatus[status]}
            onCreateTask={() => onCreateTask?.(status)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="w-72">
            <TaskCard task={activeTask} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
