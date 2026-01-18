import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { useApp } from '@/contexts/AppContext';
import { Task, TaskType, TaskCategory } from '@/types';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, members, deleteTask, selectedProjectId, selectedSprintId } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [incidentFilter, setIncidentFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Initialize filters from URL params
  useEffect(() => {
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const member = searchParams.get('member');
    const hasIncident = searchParams.get('hasIncident');

    if (type) setTypeFilter(type);
    if (category) setCategoryFilter(category);
    if (status) setStatusFilter(status as FilterStatus);
    if (priority) setPriorityFilter(priority);
    if (member) setMemberFilter(member);
    if (hasIncident) setIncidentFilter(hasIncident);
  }, [searchParams]);

  // Update URL when filters change
  const updateUrlParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    updateUrlParams('type', value);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    updateUrlParams('category', value);
  };

  const handleStatusFilter = (value: FilterStatus) => {
    setStatusFilter(value);
    updateUrlParams('status', value);
  };

  const handlePriorityFilter = (value: string) => {
    setPriorityFilter(value);
    updateUrlParams('priority', value);
  };

  const handleMemberFilter = (value: string) => {
    setMemberFilter(value);
    updateUrlParams('member', value);
  };

  const handleIncidentFilter = (value: string) => {
    setIncidentFilter(value);
    updateUrlParams('hasIncident', value);
  };

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

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // Incident filter
    if (incidentFilter === 'true') {
      result = result.filter(t => t.hasIncident);
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
  }, [tasks, selectedProjectId, selectedSprintId, search, statusFilter, memberFilter, priorityFilter, typeFilter, categoryFilter, incidentFilter, sortOrder]);

  const statusFilters: { label: string; value: FilterStatus }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Concluídas', value: 'completed' },
    { label: 'Pendentes', value: 'pending' },
  ];

  const handleDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;
    
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    deleteTask(taskToDelete.id);
    setIsDeleting(false);
    setTaskToDelete(null);
    toast({ title: 'Sucesso', description: 'Tarefa excluída com sucesso!' });
  }, [taskToDelete, deleteTask]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setMemberFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setIncidentFilter('all');
    setSortOrder('newest');
    setSearchParams({});
  };

  const hasActiveFilters = statusFilter !== 'all' || memberFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all' || incidentFilter !== 'all';

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

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Limpar filtros
            </Button>
          )}
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
                onClick={() => handleStatusFilter(filter.value)}
                className={cn(
                  'filter-chip',
                  statusFilter === filter.value && 'filter-chip-active'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={handleTypeFilter}>
            <SelectTrigger className="w-[150px] bg-card">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="frontend">Frontend</SelectItem>
              <SelectItem value="backend">Backend</SelectItem>
              <SelectItem value="fullstack">Fullstack</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
            <SelectTrigger className="w-[160px] bg-card">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="refinement">Refinamento</SelectItem>
            </SelectContent>
          </Select>

          {/* Member Filter */}
          <Select value={memberFilter} onValueChange={handleMemberFilter}>
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
          <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
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

          {/* Incident Filter */}
          <Select value={incidentFilter} onValueChange={handleIncidentFilter}>
            <SelectTrigger className={cn("w-[150px] bg-card", incidentFilter === 'true' && "border-warning text-warning")}>
              <SelectValue placeholder="Intercorrência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="true">Com Intercorrência</SelectItem>
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
              onDelete={() => setTaskToDelete(task)}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir a tarefa "${taskToDelete?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}