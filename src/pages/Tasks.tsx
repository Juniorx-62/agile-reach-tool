import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { useApp } from '@/contexts/AppContext';
import { Task } from '@/types';
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
import { toast } from '@/hooks/use-toast';

type FilterStatus = 'all' | 'completed' | 'pending';
type SortOrder = 'newest' | 'oldest' | 'priority';

export default function Tasks() {
  const { tasks, members, deleteTask, selectedProjectId, selectedSprintId } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

    // Sort - P0 is highest priority (critical), P5 is lowest
    if (sortOrder === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortOrder === 'priority') {
      // P0 = critical (first), P5 = lowest (last)
      result = [...result].sort((a, b) => a.priority - b.priority);
    }

    return result;
  }, [tasks, selectedProjectId, selectedSprintId, search, statusFilter, memberFilter, priorityFilter, sortOrder]);

  const statusFilters: { label: string; value: FilterStatus }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Concluídas', value: 'completed' },
    { label: 'Pendentes', value: 'pending' },
  ];

  const handleDeleteTask = (task: Task) => {
    if (confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`)) {
      deleteTask(task.id);
      toast({ title: 'Sucesso', description: 'Tarefa excluída com sucesso!' });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  return (
    <>
      <Header 
        title="Tarefas" 
        subtitle={`${filteredTasks.length} tarefas encontradas`}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="gradient-primary text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

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

          {/* Priority Filter - P0 is highest */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] bg-card">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="0">P0 - Crítica</SelectItem>
              <SelectItem value="1">P1 - Muito Alta</SelectItem>
              <SelectItem value="2">P2 - Alta</SelectItem>
              <SelectItem value="3">P3 - Média</SelectItem>
              <SelectItem value="4">P4 - Baixa</SelectItem>
              <SelectItem value="5">P5 - Muito Baixa</SelectItem>
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
              onEdit={() => handleEditTask(task)}
              onDelete={() => handleDeleteTask(task)}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Nenhuma tarefa encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou crie uma nova tarefa</p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="mt-4 gradient-primary text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Tarefa
            </Button>
          </div>
        )}
      </div>

      {/* View Task Modal */}
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

      {/* Create/Edit Task Modal */}
      <TaskFormModal
        task={editingTask}
        open={showCreateModal || !!editingTask}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTask(null);
        }}
        defaultProjectId={selectedProjectId || undefined}
        defaultSprintId={selectedSprintId || undefined}
      />
    </>
  );
}
