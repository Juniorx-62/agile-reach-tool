import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, Ticket, Users, Building2, 
  AlertTriangle, Clock, CheckCircle2 
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Ticket as TicketType, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/types/auth';

export default function TicketsDashboard() {
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    overdue: 0,
    resolved: 0,
  });

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const ticketsData = (data || []) as unknown as TicketType[];
        setTickets(ticketsData);

        // Calculate stats
        const now = new Date();
        setStats({
          total: ticketsData.length,
          open: ticketsData.filter(t => t.status === 'aberto' || t.status === 'em_andamento').length,
          overdue: ticketsData.filter(t => 
            t.sla_deadline && new Date(t.sla_deadline) < now && t.status !== 'concluido'
          ).length,
          resolved: ticketsData.filter(t => t.status === 'concluido').length,
        });
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
      setIsLoading(false);
    };

    fetchTickets();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'alta': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'media': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'baixa': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-blue-500/10 text-blue-500';
      case 'em_andamento': return 'bg-purple-500/10 text-purple-500';
      case 'aguardando_cliente': return 'bg-yellow-500/10 text-yellow-500';
      case 'em_revisao': return 'bg-orange-500/10 text-orange-500';
      case 'concluido': return 'bg-green-500/10 text-green-500';
      case 'cancelado': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Sistema de Tickets" subtitle="Gerencie os chamados dos parceiros" />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Tickets</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abertos</p>
                  <p className="text-3xl font-bold">{stats.open}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Atraso</p>
                  <p className="text-3xl font-bold text-destructive">{stats.overdue}</p>
                </div>
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolvidos</p>
                  <p className="text-3xl font-bold text-success">{stats.resolved}</p>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar tickets..." className="pl-10" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {(authSession.role === 'admin' || authSession.role === 'dev') && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/tickets/parceiros')}>
                <Building2 className="h-4 w-4 mr-2" />
                Parceiros
              </Button>
              <Button variant="outline" onClick={() => navigate('/tickets/usuarios')}>
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </Button>
              <Button onClick={() => navigate('/tickets/kanban')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ticket
              </Button>
            </div>
          )}
        </div>

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ticket encontrado
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.slice(0, 10).map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {TICKET_PRIORITY_LABELS[ticket.priority]}
                        </Badge>
                        <span className="font-medium truncate">{ticket.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <Badge className={getStatusColor(ticket.status)}>
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
