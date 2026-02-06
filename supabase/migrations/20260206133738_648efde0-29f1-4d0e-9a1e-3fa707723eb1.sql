-- Create enum for task priority
CREATE TYPE public.task_priority AS ENUM ('P0', 'P1', 'P2', 'P3');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('backlog', 'todo', 'in_progress', 'in_review', 'done');

-- Create enum for task area
CREATE TYPE public.task_area AS ENUM ('frontend', 'backend', 'fullstack', 'design', 'devops', 'qa');

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sprints table
CREATE TABLE public.sprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES public.users_internal(id) ON DELETE SET NULL,
  status public.task_status NOT NULL DEFAULT 'backlog',
  priority public.task_priority NOT NULL DEFAULT 'P2',
  area public.task_area,
  estimated_hours NUMERIC(5,2),
  actual_hours NUMERIC(5,2),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_delivered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Internal users can view projects"
  ON public.projects FOR SELECT
  USING (is_internal_user());

CREATE POLICY "Internal admins can manage projects"
  ON public.projects FOR ALL
  USING (is_internal_admin());

-- Sprints policies
CREATE POLICY "Internal users can view sprints"
  ON public.sprints FOR SELECT
  USING (is_internal_user());

CREATE POLICY "Internal admins can manage sprints"
  ON public.sprints FOR ALL
  USING (is_internal_admin());

-- Tasks policies
CREATE POLICY "Internal users can view tasks based on visibility"
  ON public.tasks FOR SELECT
  USING (
    is_internal_user() AND (
      -- Admin or user with 'all' visibility can see all tasks
      is_internal_admin() OR
      EXISTS (
        SELECT 1 FROM public.users_internal
        WHERE auth_id = auth.uid() 
        AND is_active = true
        AND task_visibility = 'all'
      ) OR
      -- Users with 'assigned' visibility can only see their tasks
      (
        EXISTS (
          SELECT 1 FROM public.users_internal
          WHERE auth_id = auth.uid() 
          AND is_active = true
          AND task_visibility = 'assigned'
        ) AND assignee_id = (
          SELECT id FROM public.users_internal WHERE auth_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Internal users can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (is_internal_user());

CREATE POLICY "Internal users can update tasks"
  ON public.tasks FOR UPDATE
  USING (is_internal_user());

CREATE POLICY "Internal admins can delete tasks"
  ON public.tasks FOR DELETE
  USING (is_internal_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();