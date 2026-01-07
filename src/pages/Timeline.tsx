import { useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, Clock, Circle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

export default function Timeline() {
  const { tasks, projects, sprints, members, selectedProjectId, selectedSprintId } = useApp();

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedProjectId) {
      result = result.filter(t => t.projectId === selectedProjectId);
    }
    if (selectedSprintId) {
      result = result.filter(t => t.sprintId === selectedSprintId);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tasks, selectedProjectId, selectedSprintId]);

  const getTimelineEvents = (task: typeof tasks[0]) => {
    const events = [];
    const project = projects.find(p => p.id === task.projectId);
    const sprint = sprints.find(s => s.id === task.sprintId);
    const assigneeNames = task.assignees
      .map(id => members.find(m => m.id === id)?.name)
      .filter(Boolean);

    // Creation event
    events.push({
      type: 'created',
      date: task.createdAt,
      icon: Circle,
      color: 'text-primary bg-primary/10',
      label: 'Tarefa criada',
    });

    // Incident event
    if (task.hasIncident) {
      events.push({
        type: 'incident',
        date: task.createdAt, // Would need actual incident date
        icon: AlertCircle,
        color: 'text-warning bg-warning/10',
        label: 'Intercorrência registrada',
      });
    }

    // Completion event
    if (task.isDelivered && task.completedAt) {
      events.push({
        type: 'completed',
        date: task.completedAt,
        icon: CheckCircle2,
        color: 'text-success bg-success/10',
        label: 'Tarefa entregue',
      });
    }

    return { task, events, project, sprint, assigneeNames };
  };

  const timelineData = filteredTasks.map(getTimelineEvents);

  return (
    <>
      <Header 
        title="Linha do Tempo" 
        subtitle="Histórico de atividades das tarefas"
      />
      
      <div className="p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {timelineData.length > 0 ? (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              {timelineData.map(({ task, events, project, sprint, assigneeNames }) => (
                <div key={task.id} className="relative pl-16 pb-8">
                  {/* Task Card */}
                  <div className="stat-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          {task.demandId} • {project?.name} • {sprint?.name}
                        </p>
                        <h4 className="font-semibold text-foreground">{task.title}</h4>
                      </div>
                      <span className={cn(
                        'badge-status',
                        task.isDelivered ? 'badge-success' : 'badge-warning'
                      )}>
                        {task.isDelivered ? 'Entregue' : 'Pendente'}
                      </span>
                    </div>

                    {assigneeNames.length > 0 && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Responsáveis: {assigneeNames.join(', ')}
                      </p>
                    )}

                    {/* Events Timeline */}
                    <div className="space-y-3 border-t border-border pt-4">
                      {events.map((event, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className={cn('p-1.5 rounded-full', event.color)}>
                            <event.icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{event.label}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(event.date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Duration indicator */}
                    {task.isDelivered && task.completedAt && (
                      <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          Duração: {differenceInDays(new Date(task.completedAt), new Date(task.createdAt))} dias
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Timeline node */}
                  <div className="absolute left-4 top-6 w-4 h-4 rounded-full border-2 border-primary bg-background" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Nenhuma atividade encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione um projeto ou sprint para ver a linha do tempo
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
