import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { Loader2, Calendar, Layers } from 'lucide-react';

interface GlobalSprintModalProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSprintModal({ open, onClose }: GlobalSprintModalProps) {
  const { generateGlobalSprints, projects } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    durationDays: 14,
    namePattern: 'Sprint #',
    startNumber: 1,
    endCriteria: 'end_of_year' as 'end_of_year' | 'custom_date',
    customEndDate: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd'),
  });

  // Preview calculation
  const calculatePreview = () => {
    const start = new Date(formData.startDate);
    const endDate = formData.endCriteria === 'end_of_year' 
      ? new Date(start.getFullYear(), 11, 31)
      : new Date(formData.customEndDate);
    
    let count = 0;
    let currentStart = new Date(start);
    
    while (currentStart < endDate) {
      const currentEnd = addDays(currentStart, formData.durationDays - 1);
      if (currentEnd > endDate) break;
      count++;
      currentStart = addDays(currentEnd, 1);
    }
    
    return count;
  };

  const sprintCount = calculatePreview();
  const totalSprintsToCreate = sprintCount * projects.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate) {
      toast({ title: 'Erro', description: 'Data de início é obrigatória', variant: 'destructive' });
      return;
    }
    
    if (formData.durationDays < 1 || formData.durationDays > 60) {
      toast({ title: 'Erro', description: 'Duração deve ser entre 1 e 60 dias', variant: 'destructive' });
      return;
    }

    if (projects.length === 0) {
      toast({ title: 'Erro', description: 'Crie pelo menos um projeto antes de gerar sprints', variant: 'destructive' });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    generateGlobalSprints({
      startDate: new Date(formData.startDate),
      durationDays: formData.durationDays,
      namePattern: formData.namePattern,
      startNumber: formData.startNumber,
      endCriteria: formData.endCriteria,
      customEndDate: formData.endCriteria === 'custom_date' ? new Date(formData.customEndDate) : undefined,
    });

    toast({ 
      title: 'Sucesso', 
      description: `${totalSprintsToCreate} sprints geradas para ${projects.length} projeto(s)!` 
    });

    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Gerar Sprints Globais
          </DialogTitle>
          <DialogDescription>
            Crie sprints automaticamente para todos os projetos com o mesmo calendário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Data de Início da Primeira Sprint</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Padrão de Nome</Label>
            <Input
              value={formData.namePattern}
              onChange={(e) => setFormData(prev => ({ ...prev, namePattern: e.target.value }))}
              placeholder="Sprint #"
            />
            <p className="text-xs text-muted-foreground">
              Use "#" para o número sequencial. Ex: "Sprint #" → Sprint 01, Sprint 02...
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duração da Sprint (dias)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={formData.durationDays}
                onChange={(e) => setFormData(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Número Inicial</Label>
              <Input
                type="number"
                min={1}
                value={formData.startNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, startNumber: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: Sprint 01, Sprint 02...
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Critério de Término</Label>
            <RadioGroup 
              value={formData.endCriteria} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, endCriteria: v as 'end_of_year' | 'custom_date' }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="end_of_year" id="end_of_year" />
                <Label htmlFor="end_of_year" className="text-sm font-normal cursor-pointer">
                  Até o fim do ano
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom_date" id="custom_date" />
                <Label htmlFor="custom_date" className="text-sm font-normal cursor-pointer">
                  Data específica
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.endCriteria === 'custom_date' && (
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={formData.customEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, customEndDate: e.target.value }))}
              />
            </div>
          )}

          {/* Preview */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              Prévia
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>{sprintCount}</strong> sprints serão criadas</p>
              <p><strong>{projects.length}</strong> projeto(s) receberão as sprints</p>
              <p>Total: <strong>{totalSprintsToCreate}</strong> registros de sprint</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || projects.length === 0} 
              className="gradient-primary text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gerar {totalSprintsToCreate} Sprints
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}