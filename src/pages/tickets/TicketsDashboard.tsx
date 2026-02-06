import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket as TicketIcon, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Users,
  LayoutGrid,
  Building2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/hooks/useTickets';
import { 
  TICKET_STATUS_LABELS, 
  TICKET_PRIORITY_LABELS,
  Ticket,
} from '@/types/auth';
import { cn } from '@/lib/utils';

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  variant,
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  trend?: string;
  variant?: 'default' | 'destructive' | 'success';
}) {
  const getBgColor = () => {
    switch (variant) {
      case 'destructive': return 'bg-destructive/10';
      case 'success': return 'bg-green-500/10';
      default: return 'bg-primary/10';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'destructive': return 'text-destructive';
      case 'success': return 'text-green-500';
      default: return 'text-primary';
    }
  };

  return (
    <Card className={cn(variant === 'destructive' && value > 0 && 'border-destructive/50')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn(
              "text-3xl font-bold mt-1",
              variant === 'destructive' && value > 0 && 'text-destructive'
            )}>
              {value}
            </p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", getBgColor())}>
            <Icon className={cn("h-6 w-6", getIconColor())} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentTicketCard({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'bg-red-500/10 text-red-500';
      case 'alta': return 'bg-orange-500/10 text-orange-500';
      case 'media': return 'bg-yellow-500/10 text-yellow-500';
      case 'baixa': return 'bg-green-500/10 text-green-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'text-blue-500';
      case 'em_andamento': return 'text-purple-500';
      case 'aguardando_cliente': return 'text-yellow-500';
      case 'em_revisao': return 'text-orange-500';
      case 'concluido': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const isOverdue = ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date();

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className={getPriorityColor(ticket.priority)}>
            {TICKET_PRIORITY_LABELS[ticket.priority]}
          </Badge>
          {isOverdue && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Atrasado</span>
            </div>
          )}
        </div>
        <h4 className="font-medium text-sm line-clamp-2 mb-2">{ticket.title}</h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className={getStatusColor(ticket.status)}>
            {TICKET_STATUS_LABELS[ticket.status]}
          </span>
          <span>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TicketsDashboard() {
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const { tickets, isLoading } = useTickets();

  const stats = useMemo(() => {
    const now = new Date();
    const openTickets = tickets.filter(t => t.status === 'aberto');
    const inProgressTickets = tickets.filter(t => t.status === 'em_andamento' || t.status === 'em_revisao');
    const resolvedThisMonth = tickets.filter(t => {
      if (!t.resolved_at) return false;
      const resolvedDate = new Date(t.resolved_at);
      return resolvedDate.getMonth() === now.getMonth() && resolvedDate.getFullYear() === now.getFullYear();
    });
    const overdueTickets = tickets.filter(t => {
      if (t.status === 'concluido' || t.status === 'cancelado') return false;
      if (!t.sla_deadline) return false;
      return new Date(t.sla_deadline) < now;
    });

    return {
      total: tickets.length,
      open: openTickets.length,
      inProgress: inProgressTickets.length,
      resolvedThisMonth: resolvedThisMonth.length,
      overdue: overdueTickets.length,
    };
  }, [tickets]);

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [tickets]);

  const isInternal = authSession.user_type === 'internal';

  return (
    <div className="min-h-screen bg-background">
      <Header title="Central de Tickets" subtitle="Gerencie todos os chamados de suporte" />

      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/tickets/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ticket
            </Button>
            <Button variant="outline" onClick={() => navigate('/tickets/kanban')}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Ver Kanban
            </Button>
          </div>

          {isInternal && (
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/tickets/parceiros')}>
                <Building2 className="h-4 w-4 mr-2" />
                Parceiros
              </Button>
              <Button variant="outline" onClick={() => navigate('/tickets/usuarios')}>
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </Button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Tickets"
            value={stats.total}
            icon={TicketIcon}
          />
          <StatCard
            title="Em Aberto"
            value={stats.open}
            icon={Clock}
            trend={`${stats.inProgress} em andamento`}
          />
          <StatCard
            title="Resolvidos (mês)"
            value={stats.resolvedThisMonth}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Atrasados"
            value={stats.overdue}
            icon={AlertTriangle}
            variant="destructive"
          />
        </div>

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tickets Recentes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/tickets/kanban')}>
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando tickets...
              </div>
            ) : recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <TicketIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum ticket ainda.</p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/tickets/novo')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Ticket
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentTickets.map((ticket) => (
                  <RecentTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => navigate('/tickets/kanban')}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
