import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Clock, 
  Users, 
  AlertTriangle,
  Target,
  LayoutGrid,
  Plus,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard, StatIcons } from '@/components/dashboard/StatCard';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { HoursChart } from '@/components/dashboard/HoursChart';
import { TaskDistributionChart } from '@/components/dashboard/TaskDistributionChart';
import { MemberWorkloadChart } from '@/components/dashboard/MemberWorkloadChart';
import { 
  useTasks, 
  useProjects, 
  useSprints, 
  useInternalMembers,
  Task,
  TASK_AREA_LABELS,
} from '@/hooks/useInternalData';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { projects } = useProjects();
  const { sprints } = useSprints();
  const { members } = useInternalMembers();

  // Calculate dashboard statistics
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

  // Data for hours chart (by sprint or project)
  const hoursChartData = useMemo(() => {
    // Group by project for the chart
    const projectData = projects.slice(0, 5).map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const estimated = projectTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const completed = projectTasks.filter(t => t.is_delivered).reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      return {
        name: project.name.length > 10 ? project.name.substring(0, 10) + '...' : project.name,
        estimated,
        completed,
      };
    });

    return projectData.length > 0 ? projectData : [
      { name: 'Sem projetos', estimated: 0, completed: 0 }
    ];
  }, [projects, tasks]);

  // Data for task distribution by area
  const areaDistributionData = useMemo(() => {
    const areaColors: Record<string, string> = {
      frontend: 'hsl(217, 91%, 60%)',
      backend: 'hsl(142, 71%, 45%)',
      fullstack: 'hsl(262, 83%, 58%)',
      design: 'hsl(333, 71%, 51%)',
      devops: 'hsl(25, 95%, 53%)',
      qa: 'hsl(174, 72%, 46%)',
    };

    const areaCounts: Record<string, number> = {};
    tasks.forEach(task => {
      const area = task.area || 'other';
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    });

    return Object.entries(areaCounts).map(([area, count]) => ({
      name: TASK_AREA_LABELS[area as keyof typeof TASK_AREA_LABELS] || 'Outros',
      value: count,
      color: areaColors[area] || 'hsl(var(--muted-foreground))',
    }));
  }, [tasks]);

  // Data for task distribution by priority
  const priorityDistributionData = useMemo(() => {
    const priorityColors: Record<string, string> = {
      P0: 'hsl(0, 84%, 60%)',
      P1: 'hsl(25, 95%, 53%)',
      P2: 'hsl(45, 93%, 47%)',
      P3: 'hsl(142, 71%, 45%)',
    };

    const priorityCounts: Record<string, number> = {};
    tasks.forEach(task => {
      priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
    });

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority,
      value: count,
      color: priorityColors[priority] || 'hsl(var(--muted-foreground))',
    }));
  }, [tasks]);

  // Data for member workload
  const memberWorkloadData = useMemo(() => {
    return members.map(member => {
      const memberTasks = tasks.filter(t => t.assignee_id === member.id && !t.is_delivered);
      const totalHours = memberTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      return {
        name: member.name,
        memberId: member.id,
        tasks: memberTasks.length,
        hours: Math.round(totalHours),
      };
    }).sort((a, b) => b.tasks - a.tasks);
  }, [members, tasks]);

  // Handlers for interactive charts
  const handleAreaClick = (areaName: string) => {
    const areaKey = Object.entries(TASK_AREA_LABELS).find(([_, label]) => label === areaName)?.[0];
    if (areaKey) {
      navigate(`/tasks?area=${areaKey}`);
    }
  };

  const handlePriorityClick = (priority: string) => {
    navigate(`/tasks?priority=${priority}`);
  };

  const handleMemberClick = (memberId: string) => {
    navigate(`/tasks?member=${memberId}`);
  };

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Visão geral do progresso dos projetos"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            onClick={() => navigate('/tasks')}
            className="gradient-primary text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
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
            icon={<StatIcons.tasks className="w-6 h-6" />}
            subtitle={`${stats.completed} concluídas`}
            className="cursor-pointer"
            onClick={() => navigate('/tasks')}
          />
          <StatCard
            title="Horas Estimadas"
            value={`${stats.totalHours}h`}
            icon={<StatIcons.clock className="w-6 h-6" />}
            subtitle={`${stats.completedHours}h realizadas`}
          />
          <StatCard
            title="Membros Ativos"
            value={members.length}
            icon={<StatIcons.users className="w-6 h-6" />}
            subtitle={`${projects.length} projetos`}
            className="cursor-pointer"
            onClick={() => navigate('/team')}
          />
          <StatCard
            title="Em Atraso"
            value={stats.overdue}
            icon={<StatIcons.alert className="w-6 h-6" />}
            subtitle="Tarefas atrasadas"
            variant={stats.overdue > 0 ? 'warning' : 'default'}
            className="cursor-pointer"
            onClick={() => navigate('/tasks?status=pending')}
          />
        </div>

        {/* Charts Row 1: Progress + Hours Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <p className="font-bold text-success">{stats.completed}</p>
                <p className="text-muted-foreground">Concluídas</p>
              </div>
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/tasks?status=pending')}
              >
                <p className="font-bold text-warning">{stats.pending}</p>
                <p className="text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </Card>

          {/* Hours Chart */}
          <div className="lg:col-span-2">
            <HoursChart data={hoursChartData} />
          </div>
        </div>

        {/* Charts Row 2: Distribution Charts + Member Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Distribution by Area */}
          <TaskDistributionChart 
            data={areaDistributionData}
            title="Distribuição por Área"
            onSegmentClick={handleAreaClick}
          />

          {/* Task Distribution by Priority */}
          <TaskDistributionChart 
            data={priorityDistributionData}
            title="Distribuição por Prioridade"
            onSegmentClick={handlePriorityClick}
          />

          {/* Member Workload */}
          <MemberWorkloadChart 
            data={memberWorkloadData}
            onMemberClick={handleMemberClick}
          />
        </div>

        {/* Recent Tasks */}
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
            ) : (
              <RecentTasksList 
                tasks={tasks.filter(t => !t.is_delivered).slice(0, 6)} 
                onTaskClick={() => navigate('/tasks?view=kanban')}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Recent Tasks List Component
function RecentTasksList({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: () => void }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Nenhuma tarefa pendente!</p>
      </div>
    );
  }

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <Card 
          key={task.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={onTaskClick}
        >
          <CardContent className="p-4 space-y-2">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
