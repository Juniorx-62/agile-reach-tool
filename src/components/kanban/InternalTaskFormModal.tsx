import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Calendar,
  Clock,
  Folder,
  Tag,
  Save,
  X,
} from 'lucide-react';
import { 
  Task, 
  TaskStatus, 
  TaskPriority,
  TaskArea,
  TASK_STATUS_LABELS, 
  TASK_PRIORITY_LABELS,
  TASK_AREA_LABELS,
  Project,
  Sprint,
  InternalMember,
} from '@/hooks/useInternalData';
import { cn } from '@/lib/utils';

interface InternalTaskFormModalProps {
  task?: Task | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
  projects: Project[];
  sprints: Sprint[];
  members: InternalMember[];
  defaultStatus?: TaskStatus;
}

export function InternalTaskFormModal({ 
  task, 
  open, 
  onClose, 
  onSave,
  projects,
  sprints,
  members,
  defaultStatus = 'backlog',
}: InternalTaskFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    sprint_id: '',
    assignee_id: '',
    status: defaultStatus as TaskStatus,
    priority: 'P2' as TaskPriority,
    area: '' as TaskArea | '',
    estimated_hours: '',
    due_date: '',
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        project_id: task.project_id || '',
        sprint_id: task.sprint_id || '',
        assignee_id: task.assignee_id || '',
        status: task.status,
        priority: task.priority,
        area: task.area || '',
        estimated_hours: task.estimated_hours?.toString() || '',
        due_date: task.due_date || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        project_id: '',
        sprint_id: '',
        assignee_id: '',
        status: defaultStatus,
        priority: 'P2',
        area: '',
        estimated_hours: '',
        due_date: '',
      });
    }
  }, [task, defaultStatus, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: formData.title,
        description: formData.description || null,
        project_id: formData.project_id || null,
        sprint_id: formData.sprint_id || null,
        assignee_id: formData.assignee_id || null,
        status: formData.status,
        priority: formData.priority,
        area: formData.area as TaskArea || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        due_date: formData.due_date || null,
      });
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
    setIsSubmitting(false);
  };

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
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Título da tarefa"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva a tarefa..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as TaskStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v as TaskPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(value))}>
                          {value}
                        </Badge>
                        <span>{label.split(' - ')[1]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project and Sprint */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Projeto
              </Label>
              <Select
                value={formData.project_id || '_none'}
                onValueChange={(v) => setFormData({ ...formData, project_id: v === '_none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Sprint
              </Label>
              <Select
                value={formData.sprint_id}
                onValueChange={(v) => setFormData({ ...formData, sprint_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee and Area */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Responsável
              </Label>
              <Select
                value={formData.assignee_id}
                onValueChange={(v) => setFormData({ ...formData, assignee_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Não atribuído</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.photo_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Área
              </Label>
              <Select
                value={formData.area}
                onValueChange={(v) => setFormData({ ...formData, area: v as TaskArea })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {Object.entries(TASK_AREA_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hours and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horas Estimadas
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                placeholder="Ex: 8"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Entrega
              </Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.title.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
