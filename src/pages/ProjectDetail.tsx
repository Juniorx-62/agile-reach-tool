import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar, Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { SprintFormModal } from '@/components/modals/SprintFormModal';
import { useApp } from '@/contexts/AppContext';
import { Task, Sprint } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { projects, sprints, tasks, deleteSprint, deleteTask } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

  const project = projects.find(p => p.id === id);
  const projectSprints = sprints.filter(s => s.projectId === id);
  const projectTasks = tasks.filter(t => t.projectId === id);

  const currentSprintId = activeSprintId || projectSprints[0]?.id;

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

  const handleDeleteSprint = (sprint: Sprint) => {
    if (confirm(`Tem certeza que deseja excluir a sprint "${sprint.name}"? Todas as tarefas associadas também serão excluídas.`)) {
      deleteSprint(sprint.id);
      toast({ title: 'Sucesso', description: 'Sprint excluída com sucesso!' });
    }
  };

  const handleDeleteTask = (task: Task) => {
    if (confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`)) {
      deleteTask(task.id);
      toast({ title: 'Sucesso', description: 'Tarefa excluída com sucesso!' });
    }
  };

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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTaskModal(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova Tarefa
              </Button>
              <Button 
                onClick={() => setShowSprintModal(true)}
                className="gradient-primary text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova Sprint
              </Button>
            </div>
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
                        <div className="flex items-center gap-3">
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingSprint(sprint)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar Sprint
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteSprint(sprint)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Sprint
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                          onEdit={() => setEditingTask(task)}
                          onDelete={() => handleDeleteTask(task)}
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
              <Button 
                onClick={() => setShowSprintModal(true)}
                className="mt-4 gradient-primary text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Criar Primeira Sprint
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={() => {
          if (selectedTask) {
            setEditingTask(selectedTask);
            setSelectedTask(null);
          }
        }}
      />

      {/* Task Create/Edit Modal */}
      <TaskFormModal
        task={editingTask}
        open={showTaskModal || !!editingTask}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        defaultProjectId={id}
        defaultSprintId={currentSprintId}
      />

      {/* Sprint Create/Edit Modal */}
      <SprintFormModal
        sprint={editingSprint}
        open={showSprintModal || !!editingSprint}
        onClose={() => {
          setShowSprintModal(false);
          setEditingSprint(null);
        }}
        defaultProjectId={id}
      />
    </>
  );
}
