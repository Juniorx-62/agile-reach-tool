import React, { useMemo, useState } from 'react';
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
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { 
  TicketStatus, 
  TICKET_STATUS_LABELS, 
  TICKET_STATUS_ORDER,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
  Ticket,
} from '@/types/auth';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Clock, AlertTriangle, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTickets } from '@/hooks/useTickets';
import { TicketDetailModal } from '@/components/tickets/TicketDetailModal';
import { useNavigate } from 'react-router-dom';

// Status colors for column borders and headers
const statusColors: Record<TicketStatus, string> = {
  aberto: 'border-info/50',
  em_andamento: 'border-primary/50',
  aguardando_cliente: 'border-warning/50',
  em_revisao: 'border-accent/50',
  concluido: 'border-success/50',
  cancelado: 'border-muted-foreground/30',
};

const statusHeaderColors: Record<TicketStatus, string> = {
  aberto: 'bg-info/10',
  em_andamento: 'bg-primary/10',
  aguardando_cliente: 'bg-warning/10',
  em_revisao: 'bg-accent/10',
  concluido: 'bg-success/10',
  cancelado: 'bg-muted/50',
};

// Priority colors
const priorityColors: Record<string, string> = {
  critica: 'bg-destructive/15 text-destructive',
  alta: 'bg-warning/15 text-warning',
  media: 'bg-info/15 text-info',
  baixa: 'bg-success/15 text-success',
};

// Type colors
const typeColors: Record<string, string> = {
  bug: 'bg-destructive/15 text-destructive',
  melhoria: 'bg-info/15 text-info',
  nova_funcionalidade: 'bg-success/15 text-success',
  suporte: 'bg-muted text-muted-foreground',
};

interface TicketCardProps {
  ticket: Ticket;
  isDragging?: boolean;
  onClick?: () => void;
  canDrag?: boolean;
}

function TicketCard({ ticket, isDragging, onClick, canDrag = true }: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: ticket.id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
      onClick={(e) => {
        if (!isSortableDragging && onClick) {
          onClick();
        }
      }}
      className={cn(
        'bg-card rounded-lg border border-border p-3 group relative shadow-sm hover:shadow-md transition-all touch-manipulation',
        canDrag && 'cursor-grab active:cursor-grabbing',
        !canDrag && 'cursor-pointer',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg ring-2 ring-primary rotate-2',
        isOverdue && 'border-destructive/50'
      )}
    >
      {/* Badges Row */}
      <div className="flex items-center gap-1 flex-wrap mb-2">
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', priorityColors[ticket.priority])}>
          {TICKET_PRIORITY_LABELS[ticket.priority]}
        </span>
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', typeColors[ticket.ticket_type])}>
          {TICKET_TYPE_LABELS[ticket.ticket_type]}
        </span>
        {isOverdue && (
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
        )}
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
        {ticket.title}
      </h4>

      {/* Description */}
      {ticket.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
          {ticket.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(ticket.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
        {isOverdue && (
          <span className="text-destructive font-medium">Atrasado</span>
        )}
      </div>
    </div>
  );
}

interface TicketColumnProps {
  status: TicketStatus;
  title: string;
  tickets: Ticket[];
  onCreateTicket?: () => void;
  onTicketClick?: (ticket: Ticket) => void;
  canDrag?: boolean;
}

function TicketColumn({ 
  status, 
  title, 
  tickets, 
  onCreateTicket,
  onTicketClick,
  canDrag = true,
}: TicketColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-[300px] min-w-[300px] rounded-lg border-2 bg-card/50 transition-colors h-fit max-h-[calc(100vh-220px)]',
        statusColors[status],
        isOver && 'border-primary ring-2 ring-primary/20'
      )}
    >
      {/* Column Header */}
      <div className={cn('p-3 rounded-t-md flex-shrink-0', statusHeaderColors[status])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-background/80 text-muted-foreground">
              {tickets.length}
            </span>
          </div>
          {status === 'aberto' && onCreateTicket && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onCreateTicket}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="p-2 space-y-2 min-h-[100px]">
            {tickets.map((ticket) => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onClick={() => onTicketClick?.(ticket)}
                canDrag={canDrag}
              />
            ))}
            {tickets.length === 0 && (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                {canDrag ? 'Arraste tickets aqui' : 'Nenhum ticket'}
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function TicketsKanban() {
  const { authSession } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tickets, isLoading, updateTicket } = useTickets();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Disable drag for clients
  const canDrag = authSession.role !== 'cliente';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, Ticket[]> = {
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

    // Sort by priority within each column (critica first)
    const priorityOrder: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };
    Object.keys(grouped).forEach(status => {
      grouped[status as TicketStatus].sort((a, b) => {
        return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
      });
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
        try {
          await updateTicket(ticketId, { 
            status: targetStatus,
            resolved_at: targetStatus === 'concluido' ? new Date() : undefined,
          });

          toast({
            title: 'Status atualizado',
            description: `Ticket movido para "${TICKET_STATUS_LABELS[targetStatus]}"`,
          });
        } catch (error) {
          console.error('Error updating ticket:', error);
        }
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find which column the ticket is being dragged over
    const overColumn = TICKET_STATUS_ORDER.find(status => status === overId);
    if (overColumn) return; // Already handled by handleDragEnd

    // Check if dragging over another ticket
    const overTicket = tickets.find(t => t.id === overId);
    if (overTicket) {
      const draggedTicket = tickets.find(t => t.id === activeId);
      if (draggedTicket && draggedTicket.status !== overTicket.status) {
        updateTicket(activeId as string, {
          status: overTicket.status,
          resolved_at: overTicket.status === 'concluido' ? new Date() : undefined,
        });
      }
    }
  };

  // Drag-to-scroll functionality for Kanban container
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isDraggingScroll, setIsDraggingScroll] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTicket) return;
    const container = containerRef.current;
    if (!container) return;
    
    setIsDraggingScroll(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScroll || activeTicket) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDraggingScroll(false);
  };

  const handleMouseLeave = () => {
    setIsDraggingScroll(false);
  };

  // Filter out cancelled tickets from main view
  const visibleStatuses = TICKET_STATUS_ORDER.filter(s => s !== 'cancelado');

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
            onDragOver={handleDragOver}
          >
            <div 
              ref={containerRef}
              className={cn(
                "w-full overflow-x-auto scrollbar-hidden select-none",
                !activeTicket && "drag-scroll"
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex gap-4 pb-4 min-w-max px-1">
                {visibleStatuses.map(status => (
                  <TicketColumn
                    key={status}
                    status={status}
                    title={TICKET_STATUS_LABELS[status]}
                    tickets={ticketsByStatus[status]}
                    onCreateTicket={status === 'aberto' ? () => navigate('/tickets/novo') : undefined}
                    onTicketClick={(ticket) => setSelectedTicketId(ticket.id)}
                    canDrag={canDrag}
                  />
                ))}
              </div>
            </div>

            <DragOverlay>
              {activeTicket && (
                <div className="w-[300px]">
                  <TicketCard ticket={activeTicket} isDragging canDrag={canDrag} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <TicketDetailModal
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  );
}
