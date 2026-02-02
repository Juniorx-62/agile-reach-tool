import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { KanbanCard } from './KanbanCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onCreateTask?: () => void;
}

const statusColors: Record<TaskStatus, string> = {
  backlog: 'border-muted-foreground/30',
  todo: 'border-info/50',
  in_progress: 'border-warning/50',
  in_review: 'border-primary/50',
  done: 'border-success/50',
};

const statusHeaderColors: Record<TaskStatus, string> = {
  backlog: 'bg-muted/50',
  todo: 'bg-info/10',
  in_progress: 'bg-warning/10',
  in_review: 'bg-primary/10',
  done: 'bg-success/10',
};

export function KanbanColumn({ 
  status, 
  title, 
  tasks, 
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  onCreateTask 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-[300px] min-w-[300px] rounded-lg border-2 bg-card/50 transition-colors',
        statusColors[status],
        isOver && 'border-primary ring-2 ring-primary/20'
      )}
    >
      {/* Column Header */}
      <div className={cn('p-3 rounded-t-md', statusHeaderColors[status])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-background/80 text-muted-foreground">
              {tasks.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCreateTask}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="p-2 space-y-2 min-h-[100px]">
            {tasks.map(task => (
              <KanbanCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
                onEdit={() => onTaskEdit?.(task)}
                onDelete={() => onTaskDelete?.(task)}
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                Arraste tarefas aqui
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
