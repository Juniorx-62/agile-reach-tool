import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, User, Mail, Phone, MoreHorizontal, Shield, Code } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { UserInternal } from '@/types/auth';

export default function InternalUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserInternal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Form states
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'dev',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users_internal')
        .select('*')
        .order('name');

      if (error) throw error;
      setUsers((data || []) as unknown as UserInternal[]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInviteUser = async () => {
    if (!inviteData.name || !inviteData.email) {
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
          user_type: 'internal',
          email: inviteData.email,
          name: inviteData.name,
          role: inviteData.role,
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
      setInviteData({ name: '', email: '', role: 'dev' });
      fetchUsers();
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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Equipe Interna" subtitle="Gerencie os membros da equipe 4Selet" />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar membros..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button onClick={() => setShowInviteModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Convidar Membro
          </Button>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Carregando membros...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Nenhum membro encontrado
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.photo_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">{user.name}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Desativar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{user.email}</span>
                      </div>

                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3" />
                          <span>{user.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'secondary'}
                          className="flex items-center gap-1"
                        >
                          {user.role === 'admin' ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <Code className="h-3 w-3" />
                          )}
                          {user.role === 'admin' ? 'Admin' : 'Dev'}
                        </Badge>
                        
                        {!user.auth_id && (
                          <Badge variant="outline" className="text-warning border-warning">
                            Pendente
                          </Badge>
                        )}

                        {!user.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Invite User Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Novo Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteName">Nome *</Label>
              <Input
                id="inviteName"
                placeholder="Nome completo"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">E-mail *</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="email@4selet.com"
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
