-- =============================================
-- FASE 1: SISTEMA DE ACESSOS E KANBAN DE TICKETS
-- =============================================

-- 1. ENUM TYPES
-- =============================================
CREATE TYPE public.internal_role AS ENUM ('admin', 'dev');
CREATE TYPE public.partner_role AS ENUM ('admin', 'dev', 'cliente');
CREATE TYPE public.ticket_type AS ENUM ('bug', 'melhoria', 'nova_funcionalidade', 'suporte');
CREATE TYPE public.ticket_priority AS ENUM ('critica', 'alta', 'media', 'baixa');
CREATE TYPE public.ticket_status AS ENUM ('aberto', 'em_andamento', 'aguardando_cliente', 'em_revisao', 'concluido', 'cancelado');

-- 2. PARTNERS TABLE (Empresas parceiras)
-- =============================================
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- 3. USERS_INTERNAL TABLE (Equipe 4Selet)
-- =============================================
CREATE TABLE public.users_internal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  photo_url TEXT,
  role public.internal_role NOT NULL DEFAULT 'dev',
  task_visibility TEXT NOT NULL DEFAULT 'all' CHECK (task_visibility IN ('all', 'assigned')),
  area_filter TEXT NOT NULL DEFAULT 'all' CHECK (area_filter IN ('all', 'backend', 'frontend')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  invite_token TEXT,
  invite_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users_internal ENABLE ROW LEVEL SECURITY;

-- 4. USERS_PARTNER TABLE (Usuários dos parceiros)
-- =============================================
CREATE TABLE public.users_partner (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  photo_url TEXT,
  role public.partner_role NOT NULL DEFAULT 'cliente',
  is_active BOOLEAN NOT NULL DEFAULT true,
  invite_token TEXT,
  invite_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users_partner ENABLE ROW LEVEL SECURITY;

-- 5. TICKETS TABLE
-- =============================================
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users_partner(id),
  assignee_id UUID REFERENCES public.users_partner(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ticket_type public.ticket_type NOT NULL,
  priority public.ticket_priority NOT NULL DEFAULT 'media',
  status public.ticket_status NOT NULL DEFAULT 'aberto',
  steps_to_reproduce TEXT,
  expected_result TEXT,
  page_url TEXT,
  sla_deadline TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 6. TICKET_ATTACHMENTS TABLE
-- =============================================
CREATE TABLE public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- 7. TICKET_TIMELINE TABLE (Histórico automático)
-- =============================================
CREATE TABLE public.ticket_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_timeline ENABLE ROW LEVEL SECURITY;

-- 8. TICKET_COMMENTS TABLE
-- =============================================
CREATE TABLE public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('internal', 'partner')),
  content TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- 9. TICKET_CATEGORIES TABLE (Configurável)
-- =============================================
CREATE TABLE public.ticket_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;

-- Insert default categories
INSERT INTO public.ticket_categories (name, description, color) VALUES
  ('Bug', 'Erro ou comportamento inesperado', '#ef4444'),
  ('Melhoria', 'Aprimoramento de funcionalidade existente', '#3b82f6'),
  ('Nova Funcionalidade', 'Solicitação de nova feature', '#22c55e'),
  ('Suporte', 'Dúvidas e suporte técnico', '#f59e0b');

-- 10. SLA_SETTINGS TABLE
-- =============================================
CREATE TABLE public.sla_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  priority public.ticket_priority NOT NULL UNIQUE,
  response_hours INTEGER NOT NULL,
  resolution_hours INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default SLA settings
INSERT INTO public.sla_settings (priority, response_hours, resolution_hours) VALUES
  ('critica', 2, 8),
  ('alta', 4, 24),
  ('media', 8, 48),
  ('baixa', 24, 72);

ALTER TABLE public.sla_settings ENABLE ROW LEVEL SECURITY;

-- 11. HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Check if user is internal
CREATE OR REPLACE FUNCTION public.is_internal_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_internal
    WHERE auth_id = auth.uid() AND is_active = true
  )
$$;

-- Check if user is internal admin
CREATE OR REPLACE FUNCTION public.is_internal_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_internal
    WHERE auth_id = auth.uid() AND role = 'admin' AND is_active = true
  )
$$;

-- Get internal user role
CREATE OR REPLACE FUNCTION public.get_internal_role()
RETURNS public.internal_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users_internal
  WHERE auth_id = auth.uid() AND is_active = true
  LIMIT 1
$$;

-- Check if user is partner user
CREATE OR REPLACE FUNCTION public.is_partner_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_partner
    WHERE auth_id = auth.uid() AND is_active = true
  )
$$;

-- Get partner ID for current user
CREATE OR REPLACE FUNCTION public.get_user_partner_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT partner_id FROM public.users_partner
  WHERE auth_id = auth.uid() AND is_active = true
  LIMIT 1
$$;

-- Get partner role for current user
CREATE OR REPLACE FUNCTION public.get_partner_role()
RETURNS public.partner_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users_partner
  WHERE auth_id = auth.uid() AND is_active = true
  LIMIT 1
$$;

-- Check if user is partner admin
CREATE OR REPLACE FUNCTION public.is_partner_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_partner
    WHERE auth_id = auth.uid() AND role = 'admin' AND is_active = true
  )
$$;

-- Check if user is partner dev
CREATE OR REPLACE FUNCTION public.is_partner_dev()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_partner
    WHERE auth_id = auth.uid() AND role = 'dev' AND is_active = true
  )
$$;

-- Get user type (internal or partner)
CREATE OR REPLACE FUNCTION public.get_user_type()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.users_internal WHERE auth_id = auth.uid() AND is_active = true) THEN 'internal'
    WHEN EXISTS (SELECT 1 FROM public.users_partner WHERE auth_id = auth.uid() AND is_active = true) THEN 'partner'
    ELSE NULL
  END
$$;

-- 12. TRIGGER FUNCTION FOR TIMELINE
-- =============================================
CREATE OR REPLACE FUNCTION public.record_ticket_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name TEXT;
  v_action TEXT;
BEGIN
  -- Get user name
  SELECT COALESCE(
    (SELECT name FROM public.users_internal WHERE auth_id = auth.uid()),
    (SELECT name FROM public.users_partner WHERE auth_id = auth.uid()),
    'Sistema'
  ) INTO v_user_name;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.ticket_timeline (ticket_id, user_id, user_name, action_type, action_description)
    VALUES (NEW.id, auth.uid(), v_user_name, 'created', 'Ticket criado');
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Status change
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.ticket_timeline (ticket_id, user_id, user_name, action_type, action_description, old_value, new_value)
      VALUES (NEW.id, auth.uid(), v_user_name, 'status_changed', 'Status alterado', OLD.status::TEXT, NEW.status::TEXT);
    END IF;

    -- Assignee change
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
      INSERT INTO public.ticket_timeline (ticket_id, user_id, user_name, action_type, action_description, old_value, new_value)
      VALUES (NEW.id, auth.uid(), v_user_name, 'assignee_changed', 'Responsável alterado', 
        (SELECT name FROM public.users_partner WHERE id = OLD.assignee_id),
        (SELECT name FROM public.users_partner WHERE id = NEW.assignee_id));
    END IF;

    -- Priority change
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO public.ticket_timeline (ticket_id, user_id, user_name, action_type, action_description, old_value, new_value)
      VALUES (NEW.id, auth.uid(), v_user_name, 'priority_changed', 'Prioridade alterada', OLD.priority::TEXT, NEW.priority::TEXT);
    END IF;

    -- Description change
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      INSERT INTO public.ticket_timeline (ticket_id, user_id, user_name, action_type, action_description)
      VALUES (NEW.id, auth.uid(), v_user_name, 'description_edited', 'Descrição editada');
    END IF;

    -- Title change
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      INSERT INTO public.ticket_timeline (ticket_id, user_id, user_name, action_type, action_description, old_value, new_value)
      VALUES (NEW.id, auth.uid(), v_user_name, 'title_changed', 'Título alterado', OLD.title, NEW.title);
    END IF;

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;

-- Create trigger for tickets
CREATE TRIGGER ticket_timeline_trigger
  AFTER INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.record_ticket_change();

-- 13. UPDATE TIMESTAMP TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_users_internal_updated_at
  BEFORE UPDATE ON public.users_internal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_users_partner_updated_at
  BEFORE UPDATE ON public.users_partner
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ticket_comments_updated_at
  BEFORE UPDATE ON public.ticket_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sla_settings_updated_at
  BEFORE UPDATE ON public.sla_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 14. RLS POLICIES
-- =============================================

-- Partners policies
CREATE POLICY "Internal users can view all partners"
  ON public.partners FOR SELECT
  USING (public.is_internal_user());

CREATE POLICY "Partner users can view own company"
  ON public.partners FOR SELECT
  USING (id = public.get_user_partner_id());

CREATE POLICY "Internal admins can manage partners"
  ON public.partners FOR ALL
  USING (public.is_internal_admin());

-- Users Internal policies
CREATE POLICY "Internal users can view team"
  ON public.users_internal FOR SELECT
  USING (public.is_internal_user());

CREATE POLICY "Internal users can update own profile"
  ON public.users_internal FOR UPDATE
  USING (auth_id = auth.uid());

CREATE POLICY "Internal admins can manage users"
  ON public.users_internal FOR ALL
  USING (public.is_internal_admin());

-- Allow token validation for activation (no auth required)
CREATE POLICY "Anyone can check invite token"
  ON public.users_internal FOR SELECT
  USING (invite_token IS NOT NULL AND invite_expires_at > now());

-- Users Partner policies
CREATE POLICY "Internal users can view partner users"
  ON public.users_partner FOR SELECT
  USING (public.is_internal_user());

CREATE POLICY "Partner users can view own company users"
  ON public.users_partner FOR SELECT
  USING (partner_id = public.get_user_partner_id());

CREATE POLICY "Partner users can update own profile"
  ON public.users_partner FOR UPDATE
  USING (auth_id = auth.uid());

CREATE POLICY "Partner admins can manage company users"
  ON public.users_partner FOR ALL
  USING (public.is_partner_admin() AND partner_id = public.get_user_partner_id());

CREATE POLICY "Internal admins can manage all partner users"
  ON public.users_partner FOR ALL
  USING (public.is_internal_admin());

-- Allow token validation for activation (no auth required)
CREATE POLICY "Anyone can check partner invite token"
  ON public.users_partner FOR SELECT
  USING (invite_token IS NOT NULL AND invite_expires_at > now());

-- Tickets policies
CREATE POLICY "Internal users can view all tickets"
  ON public.tickets FOR SELECT
  USING (public.is_internal_user());

CREATE POLICY "Partner users can view own company tickets"
  ON public.tickets FOR SELECT
  USING (partner_id = public.get_user_partner_id());

CREATE POLICY "Partner clients can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (partner_id = public.get_user_partner_id());

CREATE POLICY "Partner devs and admins can update tickets"
  ON public.tickets FOR UPDATE
  USING (
    (public.is_partner_dev() OR public.is_partner_admin())
    AND partner_id = public.get_user_partner_id()
  );

CREATE POLICY "Internal users can manage all tickets"
  ON public.tickets FOR ALL
  USING (public.is_internal_user());

-- Ticket Timeline policies
CREATE POLICY "Users can view ticket timeline"
  ON public.ticket_timeline FOR SELECT
  USING (
    public.is_internal_user()
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.partner_id = public.get_user_partner_id()
    )
  );

CREATE POLICY "System can insert timeline"
  ON public.ticket_timeline FOR INSERT
  WITH CHECK (true);

-- Ticket Comments policies
CREATE POLICY "Internal users can view all comments"
  ON public.ticket_comments FOR SELECT
  USING (public.is_internal_user());

CREATE POLICY "Partner users can view non-internal comments"
  ON public.ticket_comments FOR SELECT
  USING (
    is_internal_note = false
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.partner_id = public.get_user_partner_id()
    )
  );

CREATE POLICY "Users can add comments to accessible tickets"
  ON public.ticket_comments FOR INSERT
  WITH CHECK (
    public.is_internal_user()
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.partner_id = public.get_user_partner_id()
    )
  );

-- Ticket Attachments policies
CREATE POLICY "Users can view attachments of accessible tickets"
  ON public.ticket_attachments FOR SELECT
  USING (
    public.is_internal_user()
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.partner_id = public.get_user_partner_id()
    )
  );

CREATE POLICY "Users can upload attachments"
  ON public.ticket_attachments FOR INSERT
  WITH CHECK (
    public.is_internal_user()
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND t.partner_id = public.get_user_partner_id()
    )
  );

-- Ticket Categories policies
CREATE POLICY "Anyone authenticated can view categories"
  ON public.ticket_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Internal admins can manage categories"
  ON public.ticket_categories FOR ALL
  USING (public.is_internal_admin());

-- SLA Settings policies
CREATE POLICY "Authenticated users can view SLA"
  ON public.sla_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Internal admins can manage SLA"
  ON public.sla_settings FOR ALL
  USING (public.is_internal_admin());

-- 15. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_users_internal_auth_id ON public.users_internal(auth_id);
CREATE INDEX idx_users_internal_email ON public.users_internal(email);
CREATE INDEX idx_users_partner_auth_id ON public.users_partner(auth_id);
CREATE INDEX idx_users_partner_email ON public.users_partner(email);
CREATE INDEX idx_users_partner_partner_id ON public.users_partner(partner_id);
CREATE INDEX idx_tickets_partner_id ON public.tickets(partner_id);
CREATE INDEX idx_tickets_assignee_id ON public.tickets(assignee_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX idx_ticket_timeline_ticket_id ON public.ticket_timeline(ticket_id);
CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);