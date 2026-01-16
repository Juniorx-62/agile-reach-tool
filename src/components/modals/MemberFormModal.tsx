import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { TeamMember } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder';
import { formatPhoneNumber, extractNumbers, getPhoneValidationError, isValidPhoneNumber } from '@/lib/phone-mask';
interface MemberFormModalProps {
  member?: TeamMember | null;
  open: boolean;
  onClose: () => void;
  defaultName?: string;
}

export function MemberFormModal({ member, open, onClose, defaultName }: MemberFormModalProps) {
  const { addMember, updateMember } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    photoUrl: '',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        // Format phone when loading for editing
        phone: formatPhoneNumber(member.phone || ''),
        photoUrl: member.photoUrl || '',
      });
    } else {
      setFormData({
        name: defaultName || '',
        email: '',
        phone: '',
        photoUrl: '',
      });
    }
  }, [member, open, defaultName]);

  // Phone input handler with mask
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  }, []);

  // Get phone validation error for display
  const phoneError = getPhoneValidationError(formData.phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: 'Erro', description: 'O nome é obrigatório', variant: 'destructive' });
      return;
    }
    if (!formData.email.trim()) {
      toast({ title: 'Erro', description: 'O e-mail é obrigatório', variant: 'destructive' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: 'Erro', description: 'E-mail inválido', variant: 'destructive' });
      return;
    }
    
    // Validate phone if provided
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      toast({ title: 'Erro', description: phoneError || 'Telefone inválido', variant: 'destructive' });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Save only the numeric digits to the database
    const dataToSave = {
      ...formData,
      phone: extractNumbers(formData.phone),
    };

    if (member) {
      updateMember(member.id, dataToSave);
      toast({ title: 'Sucesso', description: 'Membro atualizado com sucesso!' });
    } else {
      addMember(dataToSave);
      toast({ title: 'Sucesso', description: 'Membro adicionado com sucesso!' });
    }

    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{member ? 'Editar Membro' : 'Novo Membro'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <AvatarPlaceholder 
              name={formData.name || 'N'} 
              photoUrl={formData.photoUrl}
              size="xl" 
            />
            <div className="flex-1 space-y-2">
              <Label>URL da Foto (opcional)</Label>
              <Input
                value={formData.photoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                placeholder="https://exemplo.com/foto.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para usar avatar automático
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@empresa.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
              maxLength={16}
              className={phoneError ? 'border-destructive' : ''}
            />
            {phoneError && (
              <p className="text-xs text-destructive">{phoneError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Formato: (DDD) número. Ex: (11) 99999-9999
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="gradient-primary text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {member ? 'Salvar' : 'Adicionar Membro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
