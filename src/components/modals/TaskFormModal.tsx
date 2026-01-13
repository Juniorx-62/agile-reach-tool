import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useApp } from '@/contexts/AppContext';
import { Task, TaskType, TaskCategory, TaskPriority } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSummarizeTask } from '@/hooks/useSummarizeTask';

interface TaskFormModalProps {
  task?: Task | null;
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultSprintId?: string;
}

// P0 = Critical (highest), P5 = Lowest
const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 0, label: 'P0 - Crítica' },
  { value: 1, label: 'P1 - Muito Alta' },
  { value: 2, label: 'P2 - Alta' },
  { value: 3, label: 'P3 - Média' },
  { value: 4, label: 'P4 - Baixa' },
  { value: 5, label: 'P5 - Muito Baixa' },
];

export function TaskFormModal({ task, open, onClose, defaultProjectId, defaultSprintId }: TaskFormModalProps) {
  const { addTask, updateTask, projects, sprints, members } = useApp();
  const { summarize, isLoading: isSummarizing } = useSummarizeTask();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    sprintId: '',
    demandId: '',
    priority: 3 as TaskPriority,
    title: '',
    description: '',
    summary: '',
    type: 'frontend' as TaskType,
    category: 'feature' as TaskCategory,
    assignees: [] as string[],
    estimatedHours: 0,
    hasIncident: false,
    isDelivered: false,
  });

  const filteredSprints = formData.projectId 
    ? sprints.filter(s => s.projectId === formData.projectId)
    : sprints;

  useEffect(() => {
    if (task) {
      setFormData({
        projectId: task.projectId,
        sprintId: task.sprintId,
        demandId: task.demandId,
        priority: task.priority,
        title: task.title,
        description: task.description || '',
        summary: (task as any).summary || '',
        type: task.type,
        category: task.category,
        assignees: task.assignees,
        estimatedHours: task.estimatedHours,
        hasIncident: task.hasIncident,
        isDelivered: task.isDelivered,
      });
    } else {
      setFormData({
        projectId: defaultProjectId || '',
        sprintId: defaultSprintId || '',
        demandId: '',
        priority: 3,
        title: '',
        description: '',
        summary: '',
        type: 'frontend',
        category: 'feature',
        assignees: [],
        estimatedHours: 0,
        hasIncident: false,
        isDelivered: false,
      });
    }
  }, [task, open, defaultProjectId, defaultSprintId]);

  const handleGenerateSummary = async () => {
    const result = await summarize(formData.description);
    if (result) {
      setFormData(prev => ({ ...prev, summary: result }));
      toast({
        title: 'Resumo gerado',
        description: 'O resumo foi gerado com sucesso pela IA.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({ title: 'Erro', description: 'O título é obrigatório', variant: 'destructive' });
      return;
    }
    if (!formData.projectId) {
      toast({ title: 'Erro', description: 'Selecione um projeto', variant: 'destructive' });
      return;
    }
    if (!formData.sprintId) {
      toast({ title: 'Erro', description: 'Selecione uma sprint', variant: 'destructive' });
      return;
    }
    if (!formData.demandId.trim()) {
      toast({ title: 'Erro', description: 'O ID da demanda é obrigatório', variant: 'destructive' });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const taskData = {
      ...formData,
      completedAt: formData.isDelivered ? new Date() : undefined,
    };

    if (task) {
      updateTask(task.id, taskData);
      toast({ title: 'Sucesso', description: 'Tarefa atualizada com sucesso!' });
    } else {
      addTask(taskData);
      toast({ title: 'Sucesso', description: 'Tarefa criada com sucesso!' });
    }

    setLoading(false);
    onClose();
  };

  const toggleAssignee = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(memberId)
        ? prev.assignees.filter(id => id !== memberId)
        : [...prev.assignees, memberId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Projeto *</Label>
                <Select 
                  value={formData.projectId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value, sprintId: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sprint *</Label>
                <Select 
                  value={formData.sprintId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sprintId: value }))}
                  disabled={!formData.projectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSprints.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID da Demanda *</Label>
                <Input
                  value={formData.demandId}
                  onChange={(e) => setFormData(prev => ({ ...prev, demandId: e.target.value }))}
                  placeholder="Ex: PROJ-123"
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select 
                  value={String(formData.priority)} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: Number(value) as TaskPriority }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título da tarefa"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição detalhada da tarefa..."
                rows={3}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleGenerateSummary}
                disabled={isSummarizing || formData.description.length < 10}
                className="mt-2"
              >
                {isSummarizing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando resumo...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar resumo com IA
                  </>
                )}
              </Button>
            </div>

            {formData.summary && (
              <div className="space-y-2">
                <Label>Resumo da tarefa (IA)</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Resumo gerado pela IA..."
                  rows={3}
                  className="bg-primary/5 border-primary/20"
                />
                <p className="text-xs text-muted-foreground">
                  Este resumo foi gerado por IA e pode ser editado.
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: TaskType) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">Frontend</SelectItem>
                    <SelectItem value="backend">Backend</SelectItem>
                    <SelectItem value="fullstack">Full Stack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: TaskCategory) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="refinement">Refinamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estimativa (horas)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsáveis</Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
                {members.map(member => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={member.id}
                      checked={formData.assignees.includes(member.id)}
                      onCheckedChange={() => toggleAssignee(member.id)}
                    />
                    <label htmlFor={member.id} className="text-sm cursor-pointer">{member.name}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasIncident"
                  checked={formData.hasIncident}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasIncident: !!checked }))}
                />
                <label htmlFor="hasIncident" className="text-sm">Possui intercorrência</label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDelivered"
                  checked={formData.isDelivered}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDelivered: !!checked }))}
                />
                <label htmlFor="isDelivered" className="text-sm">Entregue</label>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="gradient-primary text-white">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {task ? 'Salvar' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
