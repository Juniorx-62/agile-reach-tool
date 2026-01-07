import { useState, useMemo } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { useApp } from '@/contexts/AppContext';
import { Task, TaskPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'completed' | 'pending';
type SortOrder = 'newest' | 'oldest' | 'priority';

export default function Tasks() {
  const { tasks, members, projects, sprints, selectedProjectId, selectedSprintId } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Project filter
    if (selectedProjectId) {
      result = result.filter(t => t.projectId === selectedProjectId);
    }

    // Sprint filter
    if (selectedSprintId) {
      result = result.filter(t => t.sprintId === selectedSprintId);
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.demandId.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter === 'completed') {
      result = result.filter(t => t.isDelivered);
    } else if (statusFilter === 'pending') {
      result = result.filter(t => !t.isDelivered);
    }

    // Member filter
    if (memberFilter !== 'all') {
      result = result.filter(t => t.assignees.includes(memberFilter));
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === Number(priorityFilter));
    }

    // Sort
    if (sortOrder === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortOrder === 'priority') {
      result = [...result].sort((a, b) => b.priority - a.priority);
    }

    return result;
  }, [tasks, selectedProjectId, selectedSprintId, search, statusFilter, memberFilter, priorityFilter, sortOrder]);

  const statusFilters: { label: string; value: FilterStatus }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Concluídas', value: 'completed' },
    { label: 'Pendentes', value: 'pending' },
  ];

  return (
    <>
      <Header 
        title="Tarefas" 
        subtitle={`${filteredTasks.length} tarefas encontradas`}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por título ou demanda..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  'filter-chip',
                  statusFilter === filter.value && 'filter-chip-active'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Member Filter */}
          <Select value={memberFilter} onValueChange={setMemberFilter}>
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os membros</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="5">P5 - Crítica</SelectItem>
              <SelectItem value="4">P4 - Alta</SelectItem>
              <SelectItem value="3">P3 - Média</SelectItem>
              <SelectItem value="2">P2 - Baixa</SelectItem>
              <SelectItem value="1">P1 - Muito baixa</SelectItem>
              <SelectItem value="0">P0 - Sem</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-[160px] bg-card">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigas</SelectItem>
              <SelectItem value="priority">Por prioridade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Nenhuma tarefa encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros</p>
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
