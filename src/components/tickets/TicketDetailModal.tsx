import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  AlertTriangle,
  MessageSquare,
  History,
  Paperclip,
  Send,
  Lock,
  User,
  Calendar,
  Tag,
} from 'lucide-react';
import { useTicketDetails } from '@/hooks/useTickets';
import { useAuth } from '@/contexts/AuthContext';
import {
  Ticket,
  TICKET_TYPE_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from '@/types/auth';
import { cn } from '@/lib/utils';

interface TicketDetailModalProps {
  ticketId: string | null;
  open: boolean;
  onClose: () => void;
}

export function TicketDetailModal({ ticketId, open, onClose }: TicketDetailModalProps) {
  const { ticket, comments, timeline, attachments, isLoading, addComment } = useTicketDetails(ticketId);
  const { authSession } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isInternal = authSession.user_type === 'internal';

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSending(true);
    try {
      await addComment(newComment, isInternalNote);
      setNewComment('');
      setIsInternalNote(false);
    } catch (error) {
      console.error('Error sending comment:', error);
    }
    setIsSending(false);
  };

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
      case 'aberto': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'em_andamento': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'aguardando_cliente': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'em_revisao': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'concluido': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelado': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!ticket) return null;

  const isOverdue = ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date();

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl">{ticket.title}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Criado em {format(ticket.created_at, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                {TICKET_PRIORITY_LABELS[ticket.priority]}
              </Badge>
              <Badge variant="outline" className={getStatusColor(ticket.status)}>
                {TICKET_STATUS_LABELS[ticket.status]}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-auto mt-4">
              <div className="grid grid-cols-3 gap-6">
                {/* Main content */}
                <div className="col-span-2 space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Descrição</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {ticket.description}
                    </p>
                  </div>

                  {ticket.steps_to_reproduce && (
                    <div>
                      <h4 className="font-medium mb-2">Passos para Reproduzir</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {ticket.steps_to_reproduce}
                      </p>
                    </div>
                  )}

                  {ticket.expected_result && (
                    <div>
                      <h4 className="font-medium mb-2">Resultado Esperado</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {ticket.expected_result}
                      </p>
                    </div>
                  )}

                  {ticket.page_url && (
                    <div>
                      <h4 className="font-medium mb-2">URL da Página</h4>
                      <a 
                        href={ticket.page_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {ticket.page_url}
                      </a>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Anexos ({attachments.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded border hover:bg-muted"
                          >
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate">{attachment.file_name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Tipo</span>
                      <p className="text-sm font-medium">
                        {TICKET_TYPE_LABELS[ticket.ticket_type]}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground">Parceiro</span>
                      <p className="text-sm font-medium">
                        {ticket.partner?.name || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground">Criado por</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={ticket.creator?.photo_url} />
                          <AvatarFallback>
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{ticket.creator?.name || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground">Responsável</span>
                      <div className="flex items-center gap-2 mt-1">
                        {ticket.assignee ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={ticket.assignee?.photo_url} />
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{ticket.assignee?.name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não atribuído</span>
                        )}
                      </div>
                    </div>

                    {ticket.sla_deadline && (
                      <div>
                        <span className="text-xs text-muted-foreground">Prazo SLA</span>
                        <div className={cn(
                          "flex items-center gap-2 mt-1",
                          isOverdue && "text-destructive"
                        )}>
                          {isOverdue && <AlertTriangle className="h-4 w-4" />}
                          <span className="text-sm">
                            {format(ticket.sla_deadline, "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 flex flex-col overflow-hidden mt-4">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum comentário ainda.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={cn(
                          "p-4 rounded-lg border",
                          comment.is_internal_note && "bg-yellow-500/10 border-yellow-500/20"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{comment.user_name}</span>
                            {comment.is_internal_note && (
                              <Badge variant="outline" className="text-xs bg-yellow-500/10">
                                <Lock className="h-3 w-3 mr-1" />
                                Nota interna
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(comment.created_at, "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              <div className="space-y-3">
                {isInternal && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isInternalNote ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsInternalNote(!isInternalNote)}
                    >
                      <Lock className="h-4 w-4 mr-1" />
                      Nota interna
                    </Button>
                    {isInternalNote && (
                      <span className="text-xs text-muted-foreground">
                        Apenas usuários internos verão esta nota
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendComment}
                    disabled={!newComment.trim() || isSending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="flex-1 overflow-auto mt-4">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {timeline.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma atividade registrada.
                    </p>
                  ) : (
                    timeline.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          {index < timeline.length - 1 && (
                            <div className="w-px flex-1 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm">{item.action_description}</p>
                          {item.old_value && item.new_value && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.old_value} → {item.new_value}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {item.user_name || 'Sistema'}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {format(item.created_at, "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
