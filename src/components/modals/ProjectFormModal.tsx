import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { Project, ProjectStatus } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ProjectFormModalProps {
  project?: Project | null;
  open: boolean;
  onClose: () => void;
}

export function ProjectFormModal({ project, open, onClose }: ProjectFormModalProps) {
  const { addProject, updateProject } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    status: 'active' as ProjectStatus,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        status: project.status,
      });
    } else {
      setFormData({
        name: '',
        status: 'active',
      });
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do projeto é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));

    if (project) {
      updateProject(project.id, formData);
      toast({
        title: 'Sucesso',
        description: 'Projeto atualizado com sucesso!',
      });
    } else {
      addProject(formData);
      toast({
        title: 'Sucesso',
        description: 'Projeto criado com sucesso!',
      });
    }

    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome do projeto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: ProjectStatus) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="finished">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gradient-primary text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {project ? 'Salvar' : 'Criar Projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
