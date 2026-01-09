import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Clock, Calendar, CheckCircle2, Tag, Folder, Flag, Edit } from 'lucide-react';
import { Task } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

// P0 = Critical (highest), P5 = Lowest
const priorityLabels: Record<number, string> = {
  0: 'Crítica',
  1: 'Muito Alta',
  2: 'Alta',
  3: 'Média',
  4: 'Baixa',
  5: 'Muito Baixa',
};

const typeLabels: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Frontend + Backend',
};

const categoryLabels: Record<string, string> = {
  refinement: 'Refinamento',
  feature: 'Feature',
  bug: 'Bug',
};

export function TaskDetailModal({ task, open, onClose, onEdit }: TaskDetailModalProps) {
  const { members, projects, sprints, updateTask } = useApp();
  
  if (!task) return null;
  
  const assigneeMembers = task.assignees
    .map(id => members.find(m => m.id === id))
    .filter(Boolean);
  
  const project = projects.find(p => p.id === task.projectId);
  const sprint = sprints.find(s => s.id === task.sprintId);

  const handleToggleDelivered = () => {
    updateTask(task.id, { 
      isDelivered: !task.isDelivered,
      completedAt: !task.isDelivered ? new Date() : undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{task.demandId}</p>
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
            </div>
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={cn(
              'badge-status',
              task.isDelivered ? 'badge-success' : 'badge-warning'
            )}>
              {task.isDelivered ? 'Entregue' : 'Pendente'}
            </span>
            {task.hasIncident && (
              <span className="badge-status badge-destructive">
                Com intercorrência
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Folder className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projeto</p>
                <p className="text-sm font-medium">{project?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sprint</p>
                <p className="text-sm font-medium">{sprint?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Flag className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prioridade</p>
                <p className="text-sm font-medium">P{task.priority} - {priorityLabels[task.priority]}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimativa</p>
                <p className="text-sm font-medium">{task.estimatedHours} horas</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Tag className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-sm font-medium">{typeLabels[task.type]}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Tag className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Categoria</p>
                <p className="text-sm font-medium">{categoryLabels[task.category]}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="pt-4 border-t border-border">
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-muted-foreground">Criada em</p>
                <p className="font-medium">
                  {format(new Date(task.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              {task.completedAt && (
                <div className="text-right">
                  <p className="text-muted-foreground">Concluída em</p>
                  <p className="font-medium">
                    {format(new Date(task.completedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assignees */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-3">Responsáveis</p>
            {assigneeMembers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assigneeMembers.map((member) => (
                  <div key={member!.id} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <AvatarPlaceholder
                      name={member!.name}
                      photoUrl={member!.photoUrl}
                      size="sm"
                    />
                    <span className="text-sm font-medium">{member!.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum responsável atribuído</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleToggleDelivered}
              className={cn(
                'flex-1',
                task.isDelivered 
                  ? 'bg-muted hover:bg-muted/80 text-foreground' 
                  : 'bg-success hover:bg-success/90 text-success-foreground'
              )}
            >
              {task.isDelivered ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Marcar como Pendente
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Marcar como Entregue
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
