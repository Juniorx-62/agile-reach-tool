import React, { useMemo, useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { 
  Ticket as TicketType, 
  TicketStatus, 
  TICKET_STATUS_LABELS, 
  TICKET_STATUS_ORDER,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
} from '@/types/auth';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

function TicketCard({ ticket, isDragging }: { ticket: TicketType; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ticket.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'alta': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'media': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'baixa': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isOverdue = ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg",
        isOverdue && "border-destructive/50"
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
            {TICKET_PRIORITY_LABELS[ticket.priority]}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {TICKET_TYPE_LABELS[ticket.ticket_type]}
          </Badge>
        </div>

        <h4 className="font-medium text-sm line-clamp-2">{ticket.title}</h4>

        {ticket.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {ticket.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
          {isOverdue && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              <span>Atrasado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketColumn({ 
  status, 
  title, 
  tickets, 
  onCreateTicket 
}: { 
  status: TicketStatus;
  title: string;
  tickets: TicketType[];
  onCreateTicket?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const getColumnColor = () => {
    switch (status) {
      case 'aberto': return 'border-t-blue-500';
      case 'em_andamento': return 'border-t-purple-500';
      case 'aguardando_cliente': return 'border-t-yellow-500';
      case 'em_revisao': return 'border-t-orange-500';
      case 'concluido': return 'border-t-green-500';
      case 'cancelado': return 'border-t-muted-foreground';
      default: return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 min-w-72 rounded-lg border border-t-4 bg-muted/30",
        getColumnColor(),
        isOver && "bg-muted/50"
      )}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tickets.length}
          </Badge>
        </div>
        {status === 'aberto' && onCreateTicket && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateTicket}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
        {tickets.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhum ticket
          </p>
        )}
      </div>
    </div>
  );
}

export default function TicketsKanban() {
  const { authSession } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [activeTicket, setActiveTicket] = useState<TicketType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .order('priority')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets((data || []) as unknown as TicketType[]);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
      setIsLoading(false);
    };

    fetchTickets();
  }, []);

  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, TicketType[]> = {
      aberto: [],
      em_andamento: [],
      aguardando_cliente: [],
      em_revisao: [],
      concluido: [],
      cancelado: [],
    };

    tickets.forEach(ticket => {
      grouped[ticket.status].push(ticket);
    });

    return grouped;
  }, [tickets]);

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find(t => t.id === event.active.id);
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const ticketId = active.id as string;
    const targetStatus = over.id as TicketStatus;

    if (TICKET_STATUS_ORDER.includes(targetStatus)) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket && ticket.status !== targetStatus) {
        // Optimistic update
        setTickets(prev => prev.map(t => 
          t.id === ticketId 
            ? { ...t, status: targetStatus, resolved_at: targetStatus === 'concluido' ? new Date() : undefined }
            : t
        ));

        try {
          const { error } = await supabase
            .from('tickets')
            .update({ 
              status: targetStatus,
              resolved_at: targetStatus === 'concluido' ? new Date().toISOString() : null,
            })
            .eq('id', ticketId);

          if (error) throw error;

          toast({
            title: 'Status atualizado',
            description: `Ticket movido para "${TICKET_STATUS_LABELS[targetStatus]}"`,
          });
        } catch (error) {
          console.error('Error updating ticket:', error);
          // Revert on error
          setTickets(prev => prev.map(t => 
            t.id === ticketId ? ticket : t
          ));
          toast({
            title: 'Erro ao atualizar',
            description: 'Não foi possível mover o ticket.',
            variant: 'destructive',
          });
        }
      }
    }
  };

  // Disable drag for clients
  const canDrag = authSession.role !== 'cliente';

  return (
    <div className="min-h-screen bg-background">
      <Header title="Kanban de Tickets" subtitle="Visualize e gerencie os tickets" />

      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando tickets...
          </div>
        ) : (
          <DndContext
            sensors={canDrag ? sensors : []}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {TICKET_STATUS_ORDER.filter(s => s !== 'cancelado').map(status => (
                <TicketColumn
                  key={status}
                  status={status}
                  title={TICKET_STATUS_LABELS[status]}
                  tickets={ticketsByStatus[status]}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTicket && (
                <div className="w-72">
                  <TicketCard ticket={activeTicket} isDragging />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  );
}
