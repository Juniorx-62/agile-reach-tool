import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';
import { 
  Ticket, 
  TicketComment, 
  TicketTimeline, 
  TicketAttachment,
  Partner,
  UserPartner,
} from '@/types/auth';

// Helper to map raw ticket data to Ticket type
function mapTicket(data: Record<string, unknown>): Ticket {
  return {
    id: data.id as string,
    partner_id: data.partner_id as string,
    partner: data.partner as Partner | undefined,
    created_by: data.created_by as string | undefined,
    creator: data.creator as UserPartner | undefined,
    assignee_id: data.assignee_id as string | undefined,
    assignee: data.assignee as UserPartner | undefined,
    title: data.title as string,
    description: data.description as string,
    ticket_type: data.ticket_type as Ticket['ticket_type'],
    priority: data.priority as Ticket['priority'],
    status: data.status as Ticket['status'],
    steps_to_reproduce: data.steps_to_reproduce as string | undefined,
    expected_result: data.expected_result as string | undefined,
    page_url: data.page_url as string | undefined,
    sla_deadline: data.sla_deadline ? new Date(data.sla_deadline as string) : undefined,
    resolved_at: data.resolved_at ? new Date(data.resolved_at as string) : undefined,
    created_at: new Date(data.created_at as string),
    updated_at: new Date(data.updated_at as string),
  };
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          partner:partners(*),
          creator:users_partner!tickets_created_by_fkey(*),
          assignee:users_partner!tickets_assignee_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedTickets = (data || []).map((ticket: unknown) => 
        mapTicket(ticket as Record<string, unknown>)
      );
      
      setTickets(mappedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
    setIsLoading(false);
  }, []);

  const createTicket = async (ticket: Partial<Ticket>) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          partner_id: ticket.partner_id,
          created_by: ticket.created_by,
          title: ticket.title,
          description: ticket.description,
          ticket_type: ticket.ticket_type,
          priority: ticket.priority || 'media',
          steps_to_reproduce: ticket.steps_to_reproduce,
          expected_result: ticket.expected_result,
          page_url: ticket.page_url,
        })
        .select(`
          *,
          partner:partners(*),
          creator:users_partner!tickets_created_by_fkey(*),
          assignee:users_partner!tickets_assignee_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      
      const mappedTicket = mapTicket(data as Record<string, unknown>);
      
      setTickets(prev => [mappedTicket, ...prev]);
      toast({ title: 'Ticket criado com sucesso!' });
      return mappedTicket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({ title: 'Erro ao criar ticket', variant: 'destructive' });
      throw error;
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.assignee_id !== undefined) updateData.assignee_id = updates.assignee_id;
      if (updates.resolved_at !== undefined) updateData.resolved_at = updates.resolved_at;

      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          partner:partners(*),
          creator:users_partner!tickets_created_by_fkey(*),
          assignee:users_partner!tickets_assignee_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      
      const mappedTicket = mapTicket(data as Record<string, unknown>);
      
      setTickets(prev => prev.map(t => t.id === id ? mappedTicket : t));
      return mappedTicket;
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({ title: 'Erro ao atualizar ticket', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, isLoading, fetchTickets, createTicket, updateTicket, setTickets };
}

export function useTicketDetails(ticketId: string | null) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [timeline, setTimeline] = useState<TicketTimeline[]>([]);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { authSession } = useAuth();
  const { toast } = useToast();

  const fetchDetails = useCallback(async () => {
    if (!ticketId) return;
    
    setIsLoading(true);
    try {
      // Fetch ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          partner:partners(*),
          creator:users_partner!tickets_created_by_fkey(*),
          assignee:users_partner!tickets_assignee_id_fkey(*)
        `)
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;
      
      setTicket(mapTicket(ticketData as Record<string, unknown>));

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      
      setComments((commentsData || []).map(c => ({
        ...c,
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at),
        user_type: c.user_type as 'internal' | 'partner',
      })) as TicketComment[]);

      // Fetch timeline
      const { data: timelineData, error: timelineError } = await supabase
        .from('ticket_timeline')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (timelineError) throw timelineError;
      
      setTimeline((timelineData || []).map(t => ({
        ...t,
        created_at: new Date(t.created_at),
      })) as TicketTimeline[]);

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (attachmentsError) throw attachmentsError;
      
      setAttachments((attachmentsData || []).map(a => ({
        ...a,
        created_at: new Date(a.created_at),
      })) as TicketAttachment[]);

    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
    setIsLoading(false);
  }, [ticketId]);

  const addComment = async (content: string, isInternalNote: boolean = false) => {
    if (!ticketId || !authSession.user_id) return;

    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          user_id: authSession.auth_id,
          user_name: authSession.name || 'Usuário',
          user_type: authSession.user_type || 'partner',
          content,
          is_internal_note: isInternalNote,
        })
        .select()
        .single();

      if (error) throw error;
      
      setComments(prev => [...prev, {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        user_type: data.user_type as 'internal' | 'partner',
      } as TicketComment]);
      
      toast({ title: 'Comentário adicionado!' });
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({ title: 'Erro ao adicionar comentário', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { 
    ticket, 
    comments, 
    timeline, 
    attachments, 
    isLoading, 
    fetchDetails, 
    addComment,
    setTicket,
  };
}
