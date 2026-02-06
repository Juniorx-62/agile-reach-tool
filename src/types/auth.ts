// Authentication types for dual-environment system

export type UserType = 'internal' | 'partner';

export type InternalRole = 'admin' | 'dev';
export type PartnerRole = 'admin' | 'dev' | 'cliente';

export type TicketType = 'bug' | 'melhoria' | 'nova_funcionalidade' | 'suporte';
export type TicketPriority = 'critica' | 'alta' | 'media' | 'baixa';
export type TicketStatus = 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'em_revisao' | 'concluido' | 'cancelado';

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  bug: 'Bug',
  melhoria: 'Melhoria',
  nova_funcionalidade: 'Nova Funcionalidade',
  suporte: 'Suporte',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  aberto: 'Aberto',
  em_andamento: 'Em Andamento',
  aguardando_cliente: 'Aguardando Cliente',
  em_revisao: 'Em Revisão',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const TICKET_STATUS_ORDER: TicketStatus[] = [
  'aberto',
  'em_andamento',
  'aguardando_cliente',
  'em_revisao',
  'concluido',
  'cancelado',
];

export interface Partner {
  id: string;
  name: string;
  contact_name?: string;
  contact_email: string;
  contact_phone?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserInternal {
  id: string;
  auth_id?: string;
  name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  role: InternalRole;
  task_visibility: 'all' | 'assigned';
  area_filter: 'all' | 'backend' | 'frontend';
  is_active: boolean;
  invite_token?: string;
  invite_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserPartner {
  id: string;
  auth_id?: string;
  partner_id: string;
  partner?: Partner;
  name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  role: PartnerRole;
  is_active: boolean;
  invite_token?: string;
  invite_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Ticket {
  id: string;
  partner_id: string;
  partner?: Partner;
  created_by?: string;
  creator?: UserPartner;
  assignee_id?: string;
  assignee?: UserPartner;
  title: string;
  description: string;
  ticket_type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  steps_to_reproduce?: string;
  expected_result?: string;
  page_url?: string;
  sla_deadline?: Date;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: Date;
}

export interface TicketTimeline {
  id: string;
  ticket_id: string;
  user_id?: string;
  user_name?: string;
  action_type: string;
  action_description: string;
  old_value?: string;
  new_value?: string;
  created_at: Date;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id?: string;
  user_name: string;
  user_type: UserType;
  content: string;
  is_internal_note: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TicketCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: Date;
}

export interface SLASettings {
  id: string;
  priority: TicketPriority;
  response_hours: number;
  resolution_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuthSession {
  user_type: UserType | null;
  user_id: string | null;
  auth_id: string | null;
  role: InternalRole | PartnerRole | null;
  partner_id?: string | null;
  name: string | null;
  email: string | null;
}
