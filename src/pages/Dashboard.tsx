import { useMemo, useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  Folder
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { TaskDistributionChart } from '@/components/dashboard/TaskDistributionChart';
import { MemberWorkloadChart } from '@/components/dashboard/MemberWorkloadChart';
import { HoursChart } from '@/components/dashboard/HoursChart';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { useApp } from '@/contexts/AppContext';
import { Task } from '@/types';

export default function Dashboard() {
  const { tasks, members, projects, sprints, selectedProjectId, selectedSprintId } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedProjectId) {
      result = result.filter(t => t.projectId === selectedProjectId);
    }
    if (selectedSprintId) {
      result = result.filter(t => t.sprintId === selectedSprintId);
    }
    return result;
  }, [tasks, selectedProjectId, selectedSprintId]);

  const stats = useMemo(() => {
    const completed = filteredTasks.filter(t => t.isDelivered);
    const pending = filteredTasks.filter(t => !t.isDelivered);
    const totalHours = filteredTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const completedHours = completed.reduce((sum, t) => sum + t.estimatedHours, 0);
    const withIncidents = filteredTasks.filter(t => t.hasIncident);

    return {
      total: filteredTasks.length,
      completed: completed.length,
      pending: pending.length,
      totalHours,
      completedHours,
      remainingHours: totalHours - completedHours,
      progress: filteredTasks.length > 0 ? (completed.length / filteredTasks.length) * 100 : 0,
      incidents: withIncidents.length,
    };
  }, [filteredTasks]);

  const typeDistribution = useMemo(() => {
    const frontend = filteredTasks.filter(t => t.type === 'frontend').length;
    const backend = filteredTasks.filter(t => t.type === 'backend').length;
    const fullstack = filteredTasks.filter(t => t.type === 'fullstack').length;

    return [
      { name: 'Frontend', value: frontend, color: 'hsl(217, 91%, 50%)' },
      { name: 'Backend', value: backend, color: 'hsl(142, 71%, 45%)' },
      { name: 'Full Stack', value: fullstack, color: 'hsl(38, 92%, 50%)' },
    ];
  }, [filteredTasks]);

  const categoryDistribution = useMemo(() => {
    const feature = filteredTasks.filter(t => t.category === 'feature').length;
    const bug = filteredTasks.filter(t => t.category === 'bug').length;
    const refinement = filteredTasks.filter(t => t.category === 'refinement').length;

    return [
      { name: 'Feature', value: feature, color: 'hsl(142, 71%, 45%)' },
      { name: 'Bug', value: bug, color: 'hsl(0, 84%, 60%)' },
      { name: 'Refinamento', value: refinement, color: 'hsl(199, 89%, 48%)' },
    ];
  }, [filteredTasks]);

  const memberWorkload = useMemo(() => {
    return members.map(member => {
      const memberTasks = filteredTasks.filter(t => t.assignees.includes(member.id));
      const hours = memberTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
      return {
        name: member.name,
        tasks: memberTasks.length,
        hours,
      };
    }).filter(m => m.tasks > 0).sort((a, b) => b.tasks - a.tasks);
  }, [filteredTasks, members]);

  const hoursOverTime = useMemo(() => {
    // Simplified mock data for the hours chart
    return [
      { name: 'Sem 1', estimated: 40, completed: 32 },
      { name: 'Sem 2', estimated: 48, completed: 45 },
      { name: 'Sem 3', estimated: 36, completed: 28 },
      { name: 'Sem 4', estimated: 52, completed: 48 },
    ];
  }, []);

  const recentPendingTasks = useMemo(() => {
    return filteredTasks
      .filter(t => !t.isDelivered)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [filteredTasks]);

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Visão geral do progresso dos projetos"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Tarefas"
            value={stats.total}
            icon={<CheckSquare className="w-5 h-5 text-primary" />}
            subtitle={`${stats.completed} concluídas`}
          />
          <StatCard
            title="Horas Estimadas"
            value={`${stats.totalHours}h`}
            icon={<Clock className="w-5 h-5 text-info" />}
            subtitle={`${stats.completedHours}h realizadas`}
          />
          <StatCard
            title="Membros Ativos"
            value={members.length}
            icon={<Users className="w-5 h-5 text-success" />}
            subtitle={`${projects.filter(p => p.status === 'active').length} projetos ativos`}
          />
          <StatCard
            title="Intercorrências"
            value={stats.incidents}
            icon={<AlertTriangle className="w-5 h-5 text-warning" />}
            variant={stats.incidents > 0 ? 'warning' : 'default'}
            subtitle="Tarefas com problemas"
          />
        </div>

        {/* Progress and Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sprint Progress */}
          <div className="stat-card flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">
              Progresso da Sprint
            </h3>
            <ProgressRing progress={stats.progress} size={160} label="concluído" />
            <div className="flex gap-6 mt-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-success">{stats.completed}</p>
                <p className="text-muted-foreground">Concluídas</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-warning">{stats.pending}</p>
                <p className="text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </div>

          {/* Type Distribution */}
          <TaskDistributionChart 
            data={typeDistribution} 
            title="Distribuição por Tipo"
          />

          {/* Category Distribution */}
          <TaskDistributionChart 
            data={categoryDistribution} 
            title="Distribuição por Categoria"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MemberWorkloadChart data={memberWorkload} />
          <HoursChart data={hoursOverTime} />
        </div>

        {/* Recent Pending Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Tarefas Pendentes Recentes</h3>
            <a href="/tasks" className="text-sm text-primary hover:underline">Ver todas</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentPendingTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onClick={() => setSelectedTask(task)}
              />
            ))}
            {recentPendingTasks.length === 0 && (
              <div className="col-span-4 text-center py-8 text-muted-foreground">
                Nenhuma tarefa pendente encontrada
              </div>
            )}
          </div>
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
