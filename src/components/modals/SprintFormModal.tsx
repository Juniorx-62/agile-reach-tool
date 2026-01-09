import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { Sprint } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SprintFormModalProps {
  sprint?: Sprint | null;
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export function SprintFormModal({ sprint, open, onClose, defaultProjectId }: SprintFormModalProps) {
  const { addSprint, updateSprint, projects } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (sprint) {
      setFormData({
        projectId: sprint.projectId,
        name: sprint.name,
        startDate: format(new Date(sprint.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(sprint.endDate), 'yyyy-MM-dd'),
      });
    } else {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 14);
      
      setFormData({
        projectId: defaultProjectId || '',
        name: '',
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });
    }
  }, [sprint, open, defaultProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Erro', description: 'O nome da sprint é obrigatório', variant: 'destructive' });
      return;
    }
    if (!formData.projectId) {
      toast({ title: 'Erro', description: 'Selecione um projeto', variant: 'destructive' });
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast({ title: 'Erro', description: 'As datas são obrigatórias', variant: 'destructive' });
      return;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast({ title: 'Erro', description: 'A data de início deve ser anterior à data de término', variant: 'destructive' });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const sprintData = {
      projectId: formData.projectId,
      name: formData.name,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    };

    if (sprint) {
      updateSprint(sprint.id, sprintData);
      toast({ title: 'Sucesso', description: 'Sprint atualizada com sucesso!' });
    } else {
      addSprint(sprintData);
      toast({ title: 'Sucesso', description: 'Sprint criada com sucesso!' });
    }

    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{sprint ? 'Editar Sprint' : 'Nova Sprint'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Projeto *</Label>
            <Select 
              value={formData.projectId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
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
            <Label>Nome da Sprint *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Sprint 24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Término *</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gradient-primary text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {sprint ? 'Salvar' : 'Criar Sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
