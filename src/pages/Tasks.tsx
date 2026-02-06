import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { InternalKanbanBoard } from '@/components/kanban/InternalKanbanBoard';
import { InternalTaskFormModal } from '@/components/kanban/InternalTaskFormModal';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { 
  useTasks, 
  useProjects, 
  useSprints, 
  useInternalMembers,
  Task,
  TaskStatus,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_AREA_LABELS,
} from '@/hooks/useInternalData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type FilterStatus = 'all' | 'completed' | 'pending';
type SortOrder = 'newest' | 'oldest' | 'priority';
type ViewMode = 'list' | 'kanban';

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { projects } = useProjects();
  const { sprints } = useSprints();
  const { members } = useInternalMembers();
  const { toast } = useToast();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('backlog');
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (searchParams.get('view') as ViewMode) || 'kanban';
  });

  // Initialize filters from URL params
  useEffect(() => {
    const area = searchParams.get('area');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const member = searchParams.get('member');
    const project = searchParams.get('project');
    const view = searchParams.get('view');

    if (area) setAreaFilter(area);
    if (status) setStatusFilter(status as FilterStatus);
    if (priority) setPriorityFilter(priority);
    if (member) setMemberFilter(member);
    if (project) setProjectFilter(project);
    if (view === 'kanban' || view === 'list') setViewMode(view);
  }, [searchParams]);

  // Update URL when filters change
  const updateUrlParams = useCallback((key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleViewModeChange = (value: string) => {
    if (value === 'list' || value === 'kanban') {
      setViewMode(value);
      updateUrlParams('view', value);
    }
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Project filter
    if (projectFilter !== 'all') {
      result = result.filter(t => t.project_id === projectFilter);
    }

    // Search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter === 'completed') {
      result = result.filter(t => t.is_delivered);
    } else if (statusFilter === 'pending') {
      result = result.filter(t => !t.is_delivered);
    }

    // Member filter
    if (memberFilter !== 'all') {
      result = result.filter(t => t.assignee_id === memberFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    // Area filter
    if (areaFilter !== 'all') {
      result = result.filter(t => t.area === areaFilter);
    }

    // Sort
    if (sortOrder === 'newest') {
      result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOrder === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortOrder === 'priority') {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      result = [...result].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    return result;
  }, [tasks, projectFilter, search, statusFilter, memberFilter, priorityFilter, areaFilter, sortOrder]);

  const handleDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteTask(taskToDelete.id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
    setIsDeleting(false);
    setTaskToDelete(null);
  }, [taskToDelete, deleteTask]);

  const handleSaveTask = async (data: Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
  };

  const handleCreateTaskFromKanban = (status: TaskStatus) => {
    setDefaultStatus(status);
    setEditingTask(null);
    setShowCreateModal(true);
  };

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setMemberFilter('all');
    setPriorityFilter('all');
    setAreaFilter('all');
    setProjectFilter('all');
    setSortOrder('newest');
    const newParams = new URLSearchParams();
    if (viewMode !== 'kanban') {
      newParams.set('view', viewMode);
    }
    setSearchParams(newParams, { replace: true });
  };

  const hasActiveFilters = statusFilter !== 'all' || memberFilter !== 'all' || priorityFilter !== 'all' || areaFilter !== 'all' || projectFilter !== 'all';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'P1': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'P2': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'P3': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <Header 
        title="Tarefas" 
        subtitle={`${filteredTasks.length} tarefas encontradas`}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => {
                setDefaultStatus('backlog');
                setEditingTask(null);
                setShowCreateModal(true);
              }}
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

          <ToggleGroup type="single" value={viewMode} onValueChange={handleViewModeChange}>
            <ToggleGroupItem value="list" aria-label="Visualizar lista">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Visualizar kanban">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto pb-2">
          {/* Search */}
          <div className="relative flex-shrink-0 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por título..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>

          {/* Project Filter */}
          <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); updateUrlParams('project', v); }}>
            <SelectTrigger className="w-[160px] bg-card flex-shrink-0">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Area Filter */}
          <Select value={areaFilter} onValueChange={(v) => { setAreaFilter(v); updateUrlParams('area', v); }}>
            <SelectTrigger className="w-[130px] bg-card flex-shrink-0">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {Object.entries(TASK_AREA_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Member Filter */}
          <Select value={memberFilter} onValueChange={(v) => { setMemberFilter(v); updateUrlParams('member', v); }}>
            <SelectTrigger className="w-[160px] bg-card flex-shrink-0">
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
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); updateUrlParams('priority', v); }}>
            <SelectTrigger className="w-[130px] bg-card flex-shrink-0">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort - Only show in list view */}
          {viewMode === 'list' && (
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
              <SelectTrigger className="w-[140px] bg-card flex-shrink-0">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigas</SelectItem>
                <SelectItem value="priority">Por prioridade</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* View Content */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando tarefas...
          </div>
        ) : viewMode === 'kanban' ? (
          <InternalKanbanBoard
            tasks={filteredTasks}
            onTaskClick={(task) => setEditingTask(task)}
            onTaskUpdate={updateTask}
            onCreateTask={handleCreateTaskFromKanban}
          />
        ) : (
          <>
            {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTasks.map((task) => (
                <Card 
                  key={task.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setEditingTask(task)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority))}>
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
                        <span className="text-xs text-muted-foreground truncate">
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
                      <Badge variant="outline" className="text-xs">
                        {TASK_STATUS_LABELS[task.status]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">Nenhuma tarefa encontrada</p>
                <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou crie uma nova tarefa</p>
                <Button 
                  onClick={() => {
                    setEditingTask(null);
                    setShowCreateModal(true);
                  }}
                  className="mt-4 gradient-primary text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Tarefa
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      <InternalTaskFormModal
        task={editingTask}
        open={showCreateModal || !!editingTask}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        projects={projects}
        sprints={sprints}
        members={members}
        defaultStatus={defaultStatus}
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
