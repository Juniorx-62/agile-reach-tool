import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Clock, 
  Users, 
  AlertTriangle,
  Plus,
  LayoutGrid,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { 
  useTasks, 
  useProjects, 
  useSprints, 
  useInternalMembers,
  Task,
  TASK_STATUS_LABELS,
  TASK_AREA_LABELS,
} from '@/hooks/useInternalData';
import { cn } from '@/lib/utils';

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle,
  variant,
  onClick,
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  subtitle?: string;
  variant?: 'default' | 'warning' | 'success';
  onClick?: () => void;
}) {
  const getBgColor = () => {
    switch (variant) {
      case 'warning': return 'bg-yellow-500/10';
      case 'success': return 'bg-green-500/10';
      default: return 'bg-primary/10';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'warning': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      default: return 'text-primary';
    }
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all",
        onClick && "cursor-pointer hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", getBgColor())}>
            <Icon className={cn("h-6 w-6", getIconColor())} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-500/10 text-red-500';
      case 'P1': return 'bg-orange-500/10 text-orange-500';
      case 'P2': return 'bg-yellow-500/10 text-yellow-500';
      case 'P3': return 'bg-green-500/10 text-green-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge className={getPriorityColor(task.priority)}>
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
            <span className="text-xs text-muted-foreground">
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
              <span className="text-xs text-muted-foreground">
                {task.assignee.name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Não atribuído</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { projects } = useProjects();
  const { sprints } = useSprints();
  const { members } = useInternalMembers();

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.is_delivered);
    const pending = tasks.filter(t => !t.is_delivered);
    const totalHours = tasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const completedHours = completed.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const overdue = tasks.filter(t => {
      if (t.is_delivered || !t.due_date) return false;
      return new Date(t.due_date) < new Date();
    });

    return {
      total: tasks.length,
      completed: completed.length,
      pending: pending.length,
      totalHours: Math.round(totalHours),
      completedHours: Math.round(completedHours),
      remainingHours: Math.round(totalHours - completedHours),
      progress: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0,
      overdue: overdue.length,
    };
  }, [tasks]);

  const recentPendingTasks = useMemo(() => {
    return tasks
      .filter(t => !t.is_delivered)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
  }, [tasks]);

  const memberWorkload = useMemo(() => {
    return members.map(member => {
      const memberTasks = tasks.filter(t => t.assignee_id === member.id && !t.is_delivered);
      return {
        id: member.id,
        name: member.name,
        taskCount: memberTasks.length,
        photo_url: member.photo_url,
      };
    }).filter(m => m.taskCount > 0).sort((a, b) => b.taskCount - a.taskCount).slice(0, 5);
  }, [tasks, members]);

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Visão geral do progresso dos projetos"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/tasks')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
          <Button variant="outline" onClick={() => navigate('/tasks?view=kanban')}>
            <LayoutGrid className="h-4 w-4 mr-2" />
            Ver Kanban
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Tarefas"
            value={stats.total}
            icon={CheckSquare}
            subtitle={`${stats.completed} concluídas`}
            onClick={() => navigate('/tasks')}
          />
          <StatCard
            title="Horas Estimadas"
            value={`${stats.totalHours}h`}
            icon={Clock}
            subtitle={`${stats.completedHours}h realizadas`}
            onClick={() => navigate('/tasks')}
          />
          <StatCard
            title="Membros Ativos"
            value={members.length}
            icon={Users}
            subtitle={`${projects.length} projetos`}
            onClick={() => navigate('/team')}
          />
          <StatCard
            title="Em Atraso"
            value={stats.overdue}
            icon={AlertTriangle}
            variant={stats.overdue > 0 ? 'warning' : 'default'}
            subtitle="Tarefas atrasadas"
            onClick={() => navigate('/tasks?status=pending')}
          />
        </div>

        {/* Progress and Workload Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sprint Progress */}
          <Card className="flex flex-col items-center justify-center py-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">
              Progresso Geral
            </h3>
            <ProgressRing progress={stats.progress} size={160} label="concluído" />
            <div className="flex gap-6 mt-4 text-sm">
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/tasks?status=completed')}
              >
                <p className="font-bold text-green-500">{stats.completed}</p>
                <p className="text-muted-foreground">Concluídas</p>
              </div>
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/tasks?status=pending')}
              >
                <p className="font-bold text-yellow-500">{stats.pending}</p>
                <p className="text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </Card>

          {/* Member Workload */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Carga por Membro</CardTitle>
            </CardHeader>
            <CardContent>
              {memberWorkload.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">Sem tarefas atribuídas</p>
              ) : (
                <div className="space-y-3">
                  {memberWorkload.map((member) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/tasks?member=${member.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{member.name}</span>
                      </div>
                      <Badge variant="secondary">
                        {member.taskCount} {member.taskCount === 1 ? 'tarefa' : 'tarefas'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Pending Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Tarefas Pendentes Recentes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tasks?status=pending')}>
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando tarefas...
              </div>
            ) : recentPendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma tarefa pendente!</p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/tasks')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Tarefa
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentPendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => navigate('/tasks?view=kanban')}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
