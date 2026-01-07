import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, MoreVertical, Folder, Calendar, ListTodo, Trash2, Edit } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';
import { Project, ProjectStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const statusLabels: Record<ProjectStatus, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  finished: 'Finalizado',
};

const statusColors: Record<ProjectStatus, string> = {
  active: 'badge-success',
  paused: 'badge-warning',
  finished: 'badge-muted',
};

export default function Projects() {
  const { projects, sprints, tasks, deleteProject } = useApp();

  const getProjectStats = (projectId: string) => {
    const projectSprints = sprints.filter(s => s.projectId === projectId);
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const completedTasks = projectTasks.filter(t => t.isDelivered);
    
    return {
      sprints: projectSprints.length,
      tasks: projectTasks.length,
      completed: completedTasks.length,
      progress: projectTasks.length > 0 
        ? Math.round((completedTasks.length / projectTasks.length) * 100) 
        : 0,
    };
  };

  const handleDelete = (project: Project) => {
    if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
      deleteProject(project.id);
    }
  };

  return (
    <>
      <Header 
        title="Projetos" 
        subtitle={`${projects.length} projetos`}
      />
      
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Actions */}
        <div className="flex items-center justify-end">
          <Button className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const stats = getProjectStats(project.id);
            
            return (
              <div key={project.id} className="stat-card group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Folder className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <Link 
                        to={`/projects/${project.id}`}
                        className="font-semibold text-foreground group-hover:text-primary transition-colors"
                      >
                        {project.name}
                      </Link>
                      <span className={cn('badge-status ml-2', statusColors[project.status])}>
                        {statusLabels[project.status]}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(project)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{stats.sprints} sprints</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ListTodo className="w-4 h-4" />
                    <span>{stats.tasks} tarefas</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{stats.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill gradient-primary"
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                  <span>Atualizado em</span>
                  <span>{format(new Date(project.updatedAt), "dd MMM yyyy", { locale: ptBR })}</span>
                </div>
              </div>
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Nenhum projeto cadastrado</p>
            <Button className="mt-4 gradient-primary text-white">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Projeto
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
