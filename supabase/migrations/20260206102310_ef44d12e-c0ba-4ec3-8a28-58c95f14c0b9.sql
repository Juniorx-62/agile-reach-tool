-- Fix security warnings

-- 1. Fix search_path for update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Replace overly permissive timeline insert policy with proper check
DROP POLICY IF EXISTS "System can insert timeline" ON public.ticket_timeline;

CREATE POLICY "Timeline can be inserted by authenticated users or triggers"
  ON public.ticket_timeline FOR INSERT
  WITH CHECK (
    -- Allow inserts from authenticated users who have access to the ticket
    auth.uid() IS NOT NULL
    AND (
      public.is_internal_user()
      OR EXISTS (
        SELECT 1 FROM public.tickets t
        WHERE t.id = ticket_id AND t.partner_id = public.get_user_partner_id()
      )
    )
  );

-- Allow triggers to insert (service role bypass)
-- This is necessary because the timeline trigger runs with SECURITY DEFINER