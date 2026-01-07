import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar, Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { useApp } from '@/contexts/AppContext';
import { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { projects, sprints, tasks } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);

  const project = projects.find(p => p.id === id);
  const projectSprints = sprints.filter(s => s.projectId === id);
  const projectTasks = tasks.filter(t => t.projectId === id);

  const currentSprintId = activeSprintId || projectSprints[0]?.id;
  const currentSprintTasks = projectTasks.filter(t => t.sprintId === currentSprintId);

  const stats = useMemo(() => {
    const completed = projectTasks.filter(t => t.isDelivered);
    const totalHours = projectTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const completedHours = completed.reduce((sum, t) => sum + t.estimatedHours, 0);

    return {
      total: projectTasks.length,
      completed: completed.length,
      pending: projectTasks.length - completed.length,
      totalHours,
      completedHours,
      progress: projectTasks.length > 0 ? (completed.length / projectTasks.length) * 100 : 0,
    };
  }, [projectTasks]);

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-muted-foreground">Projeto não encontrado</p>
        <Link to="/projects" className="text-primary hover:underline mt-2 inline-block">
          Voltar para projetos
        </Link>
      </div>
    );
  }

  return (
    <>
      <Header 
        title={project.name} 
        subtitle={`${projectSprints.length} sprints • ${projectTasks.length} tarefas`}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Back link */}
        <Link 
          to="/projects" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para projetos
        </Link>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card flex flex-col items-center justify-center md:col-span-1">
            <ProgressRing progress={stats.progress} size={100} />
            <p className="text-sm text-muted-foreground mt-2">Progresso Geral</p>
          </div>
          <div className="md:col-span-3 grid grid-cols-3 gap-4">
            <StatCard
              title="Total de Tarefas"
              value={stats.total}
              icon={<span className="text-2xl">📋</span>}
            />
            <StatCard
              title="Horas Estimadas"
              value={`${stats.totalHours}h`}
              icon={<span className="text-2xl">⏱️</span>}
              subtitle={`${stats.completedHours}h realizadas`}
            />
            <StatCard
              title="Taxa de Conclusão"
              value={`${Math.round(stats.progress)}%`}
              icon={<span className="text-2xl">🎯</span>}
              variant={stats.progress > 75 ? 'success' : 'default'}
            />
          </div>
        </div>

        {/* Sprints Tabs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Sprints</h3>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nova Sprint
            </Button>
          </div>

          {projectSprints.length > 0 ? (
            <Tabs value={currentSprintId} onValueChange={setActiveSprintId}>
              <TabsList className="bg-muted/50 p-1">
                {projectSprints.map((sprint) => (
                  <TabsTrigger 
                    key={sprint.id} 
                    value={sprint.id}
                    className="data-[state=active]:bg-card"
                  >
                    {sprint.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {projectSprints.map((sprint) => {
                const sprintTasks = projectTasks.filter(t => t.sprintId === sprint.id);
                const completedTasks = sprintTasks.filter(t => t.isDelivered);
                
                return (
                  <TabsContent key={sprint.id} value={sprint.id} className="mt-4">
                    {/* Sprint Info */}
                    <div className="stat-card mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {format(new Date(sprint.startDate), "dd MMM", { locale: ptBR })} - {format(new Date(sprint.endDate), "dd MMM yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="h-4 w-px bg-border" />
                          <span className="text-sm">
                            <span className="font-medium text-success">{completedTasks.length}</span>
                            <span className="text-muted-foreground"> / {sprintTasks.length} tarefas</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar w-32">
                            <div 
                              className="progress-fill gradient-primary"
                              style={{ width: sprintTasks.length > 0 ? `${(completedTasks.length / sprintTasks.length) * 100}%` : '0%' }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {sprintTasks.length > 0 ? Math.round((completedTasks.length / sprintTasks.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sprint Tasks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {sprintTasks.map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task}
                          onClick={() => setSelectedTask(task)}
                        />
                      ))}
                      {sprintTasks.length === 0 && (
                        <div className="col-span-4 text-center py-8 text-muted-foreground">
                          Nenhuma tarefa nesta sprint
                        </div>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <div className="text-center py-8 stat-card">
              <p className="text-muted-foreground">Nenhuma sprint cadastrada</p>
              <Button className="mt-4" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Criar Primeira Sprint
              </Button>
            </div>
          )}
        </div>
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
