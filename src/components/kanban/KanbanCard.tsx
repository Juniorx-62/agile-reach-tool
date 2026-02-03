import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, AlertCircle, CheckCircle2, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Task } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatHoursDisplay } from '@/lib/formatters';

interface KanbanCardProps {
  task: Task;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
}

const priorityLabels: Record<number, string> = {
  0: 'P0',
  1: 'P1',
  2: 'P2',
  3: 'P3',
  4: 'P4',
  5: 'P5',
};

const priorityColors: Record<number, string> = {
  0: 'bg-destructive/15 text-destructive',
  1: 'bg-destructive/15 text-destructive',
  2: 'bg-warning/15 text-warning',
  3: 'bg-warning/15 text-warning',
  4: 'bg-info/15 text-info',
  5: 'bg-muted text-muted-foreground',
};

const typeLabels: Record<string, string> = {
  frontend: 'FE',
  backend: 'BE',
  fullstack: 'FS',
};

const typeColors: Record<string, string> = {
  frontend: 'bg-primary/15 text-primary',
  backend: 'bg-success/15 text-success',
  fullstack: 'bg-accent/15 text-accent',
};

const categoryLabels: Record<string, string> = {
  refinement: 'Ref',
  feature: 'Feat',
  bug: 'Bug',
};

const categoryColors: Record<string, string> = {
  refinement: 'bg-info/15 text-info',
  feature: 'bg-success/15 text-success',
  bug: 'bg-destructive/15 text-destructive',
};

export function KanbanCard({ task, onClick, onEdit, onDelete, isDragging }: KanbanCardProps) {
  const { members, projects, sprints } = useApp();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assigneeMembers = task.assignees
    .map(id => members.find(m => m.id === id))
    .filter(Boolean);
  
  const project = projects.find(p => p.id === task.projectId);
  const sprint = sprints.find(s => s.id === task.sprintId);

  const handleMenuAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-card rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing group relative shadow-sm hover:shadow-md transition-all touch-manipulation',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg ring-2 ring-primary rotate-2',
      )}
      onClick={(e) => {
        // Only trigger onClick if not dragging
        if (!isSortableDragging && onClick) {
          onClick();
        }
      }}
    >
      {/* Actions Menu */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => handleMenuAction(e as any, onEdit)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => handleMenuAction(e as any, onDelete)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Badges Row */}
      <div className="flex items-center gap-1 flex-wrap mb-2">
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', priorityColors[task.priority])}>
          {priorityLabels[task.priority]}
        </span>
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', typeColors[task.type])}>
          {typeLabels[task.type]}
        </span>
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', categoryColors[task.category])}>
          {categoryLabels[task.category]}
        </span>
        {task.hasIncident && (
          <AlertCircle className="w-3.5 h-3.5 text-warning" />
        )}
        {task.isDelivered && (
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
        )}
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1 pr-6">
        {task.title}
      </h4>

      {/* Project & Sprint */}
      <p className="text-[11px] text-muted-foreground truncate mb-2">
        {project?.name} • {sprint?.name}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="text-[11px]">{formatHoursDisplay(task.estimatedHours)}</span>
        </div>

        {assigneeMembers.length > 0 ? (
          <div className="flex -space-x-1.5">
            {assigneeMembers.slice(0, 2).map((member) => (
              <AvatarPlaceholder
                key={member!.id}
                name={member!.name}
                photoUrl={member!.photoUrl}
                size="xs"
                className="ring-1 ring-card"
              />
            ))}
            {assigneeMembers.length > 2 && (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground ring-1 ring-card">
                +{assigneeMembers.length - 2}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
