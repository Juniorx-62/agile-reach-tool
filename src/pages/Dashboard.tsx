import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  Clock, 
  Users, 
  AlertTriangle
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import { TaskDistributionChart } from '@/components/dashboard/TaskDistributionChart';
import { MemberWorkloadChart } from '@/components/dashboard/MemberWorkloadChart';
import { HoursChart } from '@/components/dashboard/HoursChart';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { MemberDetailModal } from '@/components/team/MemberDetailModal';
import { useApp, DATA_CHANGED_EVENT } from '@/contexts/AppContext';
import { Task, TeamMember } from '@/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, members, projects, sprints, selectedProjectId, selectedSprintId } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for data changes to force re-render
  useEffect(() => {
    const handleDataChanged = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener(DATA_CHANGED_EVENT, handleDataChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handleDataChanged);
  }, []);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedProjectId) {
      result = result.filter(t => t.projectId === selectedProjectId);
    }
    if (selectedSprintId) {
      result = result.filter(t => t.sprintId === selectedSprintId);
    }
    return result;
  }, [tasks, selectedProjectId, selectedSprintId, refreshKey]);

  const stats = useMemo(() => {
    const completed = filteredTasks.filter(t => t.isDelivered);
    const pending = filteredTasks.filter(t => !t.isDelivered);
    const totalHours = filteredTasks.reduce((sum, t) => {
      const hours = Number(t.estimatedHours) || 0;
      return sum + (isFinite(hours) && hours >= 0 && hours < 100000 ? hours : 0);
    }, 0);
    const completedHours = completed.reduce((sum, t) => {
      const hours = Number(t.estimatedHours) || 0;
      return sum + (isFinite(hours) && hours >= 0 && hours < 100000 ? hours : 0);
    }, 0);
    const withIncidents = filteredTasks.filter(t => t.hasIncident);

    // Helper to format hours with max 1 decimal
    const formatHours = (hours: number) => {
      if (!isFinite(hours) || hours < 0 || hours >= 100000) return 0;
      return Number.isInteger(hours) ? hours : Number(hours.toFixed(1));
    };

    return {
      total: filteredTasks.length,
      completed: completed.length,
      pending: pending.length,
      totalHours: formatHours(totalHours),
      completedHours: formatHours(completedHours),
      remainingHours: formatHours(totalHours - completedHours),
      progress: filteredTasks.length > 0 ? (completed.length / filteredTasks.length) * 100 : 0,
      incidents: withIncidents.length,
    };
  }, [filteredTasks]);

  const typeDistribution = useMemo(() => {
    const frontend = filteredTasks.filter(t => t.type === 'frontend').length;
    const backend = filteredTasks.filter(t => t.type === 'backend').length;
    const fullstack = filteredTasks.filter(t => t.type === 'fullstack').length;

    return [
      { name: 'Frontend', value: frontend, color: 'hsl(217, 91%, 50%)', filterKey: 'frontend' },
      { name: 'Backend', value: backend, color: 'hsl(142, 71%, 45%)', filterKey: 'backend' },
      { name: 'Full Stack', value: fullstack, color: 'hsl(38, 92%, 50%)', filterKey: 'fullstack' },
    ];
  }, [filteredTasks]);

  const categoryDistribution = useMemo(() => {
    const feature = filteredTasks.filter(t => t.category === 'feature').length;
    const bug = filteredTasks.filter(t => t.category === 'bug').length;
    const refinement = filteredTasks.filter(t => t.category === 'refinement').length;

    return [
      { name: 'Feature', value: feature, color: 'hsl(142, 71%, 45%)', filterKey: 'feature' },
      { name: 'Bug', value: bug, color: 'hsl(0, 84%, 60%)', filterKey: 'bug' },
      { name: 'Refinamento', value: refinement, color: 'hsl(199, 89%, 48%)', filterKey: 'refinement' },
    ];
  }, [filteredTasks]);

  const memberWorkload = useMemo(() => {
    return members.map(member => {
      const memberTasks = filteredTasks.filter(t => t.assignees.includes(member.id));
      const hours = memberTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
      return {
        id: member.id,
        memberId: member.id,
        name: member.name,
        tasks: memberTasks.length,
        hours,
      };
    }).filter(m => m.tasks > 0).sort((a, b) => b.tasks - a.tasks);
  }, [filteredTasks, members]);

  const hoursOverTime = useMemo(() => {
    // Helper to safely get hours
    const safeHours = (hours: number) => {
      const val = Number(hours) || 0;
      return isFinite(val) && val >= 0 && val < 100000 ? val : 0;
    };

    // Calculate hours based on actual sprint data
    const sprintData = sprints.slice(0, 4).map(sprint => {
      const sprintTasks = filteredTasks.filter(t => t.sprintId === sprint.id);
      const estimated = sprintTasks.reduce((sum, t) => sum + safeHours(t.estimatedHours), 0);
      const completed = sprintTasks.filter(t => t.isDelivered).reduce((sum, t) => sum + safeHours(t.estimatedHours), 0);
      return {
        name: sprint.name.replace('Sprint ', 'S'),
        sprintId: sprint.id,
        estimated: Number(estimated.toFixed(1)),
        completed: Number(completed.toFixed(1)),
      };
    });

    return sprintData.length > 0 ? sprintData : [
      { name: 'Sem 1', estimated: 40, completed: 32 },
      { name: 'Sem 2', estimated: 48, completed: 45 },
      { name: 'Sem 3', estimated: 36, completed: 28 },
      { name: 'Sem 4', estimated: 52, completed: 48 },
    ];
  }, [sprints, filteredTasks]);

  const recentPendingTasks = useMemo(() => {
    return filteredTasks
      .filter(t => !t.isDelivered)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [filteredTasks]);

  // Handle chart clicks with navigation and filtering
  const handleTypeClick = useCallback((filterKey: string) => {
    navigate(`/tasks?type=${filterKey}`);
  }, [navigate]);

  const handleCategoryClick = useCallback((filterKey: string) => {
    navigate(`/tasks?category=${filterKey}`);
  }, [navigate]);

  const handleMemberClick = useCallback((memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
    }
  }, [members]);

  // Navigate to tasks filtered by status
  const handlePendingClick = useCallback(() => {
    navigate('/tasks?status=pending');
  }, [navigate]);

  const handleCompletedClick = useCallback(() => {
    navigate('/tasks?status=completed');
  }, [navigate]);

  const handleIncidentsClick = useCallback(() => {
    navigate('/tasks?hasIncident=true');
  }, [navigate]);

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Visão geral do progresso dos projetos"
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => navigate('/tasks')} 
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <StatCard
              title="Total de Tarefas"
              value={stats.total}
              icon={<CheckSquare className="w-5 h-5 text-primary" />}
              subtitle={`${stats.completed} concluídas`}
            />
          </div>
          <div 
            onClick={() => navigate('/tasks')} 
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <StatCard
              title="Horas Estimadas"
              value={`${stats.totalHours}h`}
              icon={<Clock className="w-5 h-5 text-info" />}
              subtitle={`${stats.completedHours}h realizadas`}
            />
          </div>
          <div 
            onClick={() => navigate('/team')} 
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <StatCard
              title="Membros Ativos"
              value={members.length}
              icon={<Users className="w-5 h-5 text-success" />}
              subtitle={`${projects.filter(p => p.status === 'active').length} projetos ativos`}
            />
          </div>
          <div 
            onClick={handleIncidentsClick} 
            className="cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <StatCard
              title="Intercorrências"
              value={stats.incidents}
              icon={<AlertTriangle className="w-5 h-5 text-warning" />}
              variant={stats.incidents > 0 ? 'warning' : 'default'}
              subtitle="Tarefas com problemas"
            />
          </div>
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
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleCompletedClick}
              >
                <p className="font-bold text-success">{stats.completed}</p>
                <p className="text-muted-foreground">Concluídas</p>
              </div>
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handlePendingClick}
              >
                <p className="font-bold text-warning">{stats.pending}</p>
                <p className="text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </div>

          {/* Type Distribution */}
          <TaskDistributionChart 
            data={typeDistribution} 
            title="Distribuição por Tipo"
            onSegmentClick={handleTypeClick}
          />

          {/* Category Distribution */}
          <TaskDistributionChart 
            data={categoryDistribution} 
            title="Distribuição por Categoria"
            onSegmentClick={handleCategoryClick}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MemberWorkloadChart 
            data={memberWorkload} 
            onMemberClick={handleMemberClick}
          />
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

      {/* Task Edit Modal */}
      <TaskFormModal
        task={editingTask}
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
      />

      {/* Member Detail Modal */}
      <MemberDetailModal
        member={selectedMember}
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
}
