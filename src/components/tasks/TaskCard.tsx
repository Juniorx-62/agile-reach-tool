import { Clock, AlertCircle, CheckCircle2, User, MoreVertical, Edit, Trash2 } from 'lucide-react';
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

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const priorityLabels: Record<number, string> = {
  0: 'P0',
  1: 'P1',
  2: 'P2',
  3: 'P3',
  4: 'P4',
  5: 'P5',
};

// P0 = Critical (highest priority - red), P5 = Lowest (muted)
const priorityColors: Record<number, string> = {
  0: 'bg-destructive/15 text-destructive',
  1: 'bg-destructive/15 text-destructive',
  2: 'bg-warning/15 text-warning',
  3: 'bg-warning/15 text-warning',
  4: 'bg-info/15 text-info',
  5: 'bg-muted text-muted-foreground',
};

const typeLabels: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Full Stack',
};

const categoryLabels: Record<string, string> = {
  refinement: 'Refinamento',
  feature: 'Feature',
  bug: 'Bug',
};

const categoryColors: Record<string, string> = {
  refinement: 'badge-info',
  feature: 'badge-success',
  bug: 'badge-destructive',
};

export function TaskCard({ task, onClick, onEdit, onDelete }: TaskCardProps) {
  const { members, projects, sprints } = useApp();
  
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
      onClick={onClick}
      className={cn(
        'stat-card cursor-pointer group relative',
        task.isDelivered && 'opacity-75'
      )}
    >
      {/* Actions Menu */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
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

      <div className="flex items-start justify-between gap-3 pr-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('badge-status', priorityColors[task.priority])}>
              {priorityLabels[task.priority]}
            </span>
            <span className={cn('badge-status', categoryColors[task.category])}>
              {categoryLabels[task.category]}
            </span>
            <span className="badge-status badge-muted">
              {typeLabels[task.type]}
            </span>
          </div>
          
          <h4 className="font-medium text-foreground mt-2 line-clamp-2 group-hover:text-primary transition-colors">
            {task.title}
          </h4>
          
          <p className="text-xs text-muted-foreground mt-1">
            {task.demandId} • {project?.name} • {sprint?.name}
          </p>
        </div>

        {task.isDelivered ? (
          <div className="p-2 rounded-full bg-success/10">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
        ) : task.hasIncident ? (
          <div className="p-2 rounded-full bg-warning/10">
            <AlertCircle className="w-5 h-5 text-warning" />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{task.estimatedHours}h</span>
        </div>

        <div className="flex items-center">
          {assigneeMembers.length > 0 ? (
            <div className="flex -space-x-2">
              {assigneeMembers.slice(0, 3).map((member) => (
                <AvatarPlaceholder
                  key={member!.id}
                  name={member!.name}
                  photoUrl={member!.photoUrl}
                  size="sm"
                  className="ring-2 ring-card"
                />
              ))}
              {assigneeMembers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground ring-2 ring-card">
                  +{assigneeMembers.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-xs">Sem responsável</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
