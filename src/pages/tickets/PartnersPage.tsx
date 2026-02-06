import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, Mail, Phone, MoreHorizontal, UserPlus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Partner } from '@/types/auth';

export default function PartnersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  });
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'cliente',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('name');

      if (error) throw error;
      setPartners((data || []) as unknown as Partner[]);
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreatePartner = async () => {
    if (!formData.name || !formData.contact_email) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e e-mail são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('partners')
        .insert({
          name: formData.name,
          contact_name: formData.contact_name || null,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone || null,
        });

      if (error) throw error;

      toast({
        title: 'Parceiro criado!',
        description: 'O parceiro foi adicionado com sucesso.',
      });

      setShowCreateModal(false);
      setFormData({ name: '', contact_name: '', contact_email: '', contact_phone: '' });
      fetchPartners();
    } catch (error) {
      console.error('Error creating partner:', error);
      toast({
        title: 'Erro ao criar parceiro',
        description: 'Ocorreu um erro ao criar o parceiro.',
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  const handleInviteUser = async () => {
    if (!inviteData.name || !inviteData.email || !selectedPartner) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e e-mail são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          user_type: 'partner',
          email: inviteData.email,
          name: inviteData.name,
          role: inviteData.role,
          partner_id: selectedPartner.id,
          partner_name: selectedPartner.name,
        },
      });

      if (error) throw error;

      if (data.warning) {
        toast({
          title: 'Usuário criado',
          description: `O convite não foi enviado por e-mail. Link: ${data.activation_url}`,
        });
      } else {
        toast({
          title: 'Convite enviado!',
          description: 'O usuário receberá um e-mail para ativar a conta.',
        });
      }

      setShowInviteModal(false);
      setInviteData({ name: '', email: '', role: 'cliente' });
      setSelectedPartner(null);
    } catch (error) {
      console.error('Error inviting user:', error);
      toast({
        title: 'Erro ao enviar convite',
        description: 'Ocorreu um erro ao enviar o convite.',
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.contact_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header title="Parceiros" subtitle="Gerencie as empresas parceiras" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar parceiros..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Parceiro
          </Button>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Carregando parceiros...
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Nenhum parceiro encontrado
            </div>
          ) : (
            filteredPartners.map((partner) => (
              <Card key={partner.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{partner.name}</CardTitle>
                        {partner.contact_name && (
                          <p className="text-sm text-muted-foreground">{partner.contact_name}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedPartner(partner);
                            setShowInviteModal(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Convidar usuário
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{partner.contact_email}</span>
                  </div>
                  {partner.contact_phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{partner.contact_phone}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                      {partner.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Partner Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Parceiro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="partnerName">Nome da empresa *</Label>
              <Input
                id="partnerName"
                placeholder="Nome da empresa"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Nome do contato</Label>
              <Input
                id="contactName"
                placeholder="Nome do contato principal"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">E-mail *</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="email@empresa.com"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefone</Label>
              <Input
                id="contactPhone"
                placeholder="(00) 00000-0000"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePartner} disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Parceiro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Usuário - {selectedPartner?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteName">Nome *</Label>
              <Input
                id="inviteName"
                placeholder="Nome do usuário"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">E-mail *</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="email@exemplo.com"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Papel</Label>
              <select
                id="inviteRole"
                className="w-full h-10 px-3 rounded-md border bg-background"
                value={inviteData.role}
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
              >
                <option value="cliente">Cliente</option>
                <option value="dev">Desenvolvedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteUser} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
