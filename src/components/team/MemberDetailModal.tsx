import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, Phone, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { TeamMember } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MemberDetailModalProps {
  member: TeamMember | null;
  open: boolean;
  onClose: () => void;
}

export function MemberDetailModal({ member, open, onClose }: MemberDetailModalProps) {
  const { tasks, projects, sprints } = useApp();
  
  if (!member) return null;
  
  const memberTasks = tasks.filter(t => t.assignees.includes(member.id));
  const completedTasks = memberTasks.filter(t => t.isDelivered);
  const pendingTasks = memberTasks.filter(t => !t.isDelivered);
  
  const memberProjects = [...new Set(memberTasks.map(t => t.projectId))];
  const projectData = memberProjects.map(pid => projects.find(p => p.id === pid)).filter(Boolean);

  const totalHours = memberTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const completedHours = completedTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const remainingHours = totalHours - completedHours;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <AvatarPlaceholder
              name={member.name}
              photoUrl={member.photoUrl}
              size="xl"
            />
            <div>
              <DialogTitle className="text-2xl">{member.name}</DialogTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 mt-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="stat-card text-center">
                <p className="text-2xl font-bold text-foreground">{memberTasks.length}</p>
                <p className="text-xs text-muted-foreground">Total Tarefas</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-2xl font-bold text-success">{completedTasks.length}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-2xl font-bold text-warning">{pendingTasks.length}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-2xl font-bold text-primary">{totalHours}h</p>
                <p className="text-xs text-muted-foreground">Total Horas</p>
              </div>
            </div>

            {/* Hours Progress */}
            <div className="stat-card">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progresso de Horas</span>
                <span className="text-sm text-muted-foreground">
                  {completedHours}h concluídas • {remainingHours}h restantes
                </span>
              </div>
              <div className="progress-bar h-3">
                <div 
                  className="progress-fill gradient-primary"
                  style={{ width: totalHours > 0 ? `${(completedHours / totalHours) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Projects */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Projetos ({projectData.length})</h4>
              <div className="flex flex-wrap gap-2">
                {projectData.map((project) => (
                  <span key={project!.id} className="badge-status badge-info">
                    {project!.name}
                  </span>
                ))}
                {projectData.length === 0 && (
                  <span className="text-sm text-muted-foreground">Nenhum projeto atribuído</span>
                )}
              </div>
            </div>

            {/* Tasks List */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                Tarefas Atribuídas ({memberTasks.length})
              </h4>
              <div className="space-y-2">
                {memberTasks.length > 0 ? (
                  memberTasks.map((task) => {
                    const project = projects.find(p => p.id === task.projectId);
                    const sprint = sprints.find(s => s.id === task.sprintId);
                    
                    return (
                      <div 
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {task.isDelivered ? (
                            <CheckCircle2 className="w-5 h-5 text-success" />
                          ) : task.hasIncident ? (
                            <AlertCircle className="w-5 h-5 text-warning" />
                          ) : (
                            <Clock className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className={cn(
                              'text-sm font-medium',
                              task.isDelivered && 'line-through text-muted-foreground'
                            )}>
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {project?.name} • {sprint?.name} • {task.estimatedHours}h
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          'badge-status text-xs',
                          task.isDelivered ? 'badge-success' : 'badge-warning'
                        )}>
                          {task.isDelivered ? 'Entregue' : 'Pendente'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma tarefa atribuída
                  </p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
