import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

// Types for internal kanban system
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskArea = 'frontend' | 'backend' | 'fullstack' | 'design' | 'devops' | 'qa';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  in_review: 'Em Revisão',
  done: 'Concluído',
};

export const TASK_STATUS_ORDER: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  P0: 'P0 - Crítica',
  P1: 'P1 - Alta',
  P2: 'P2 - Média',
  P3: 'P3 - Baixa',
};

export const TASK_AREA_LABELS: Record<TaskArea, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Fullstack',
  design: 'Design',
  devops: 'DevOps',
  qa: 'QA',
};

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InternalMember {
  id: string;
  auth_id?: string;
  name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  role: 'admin' | 'dev';
  task_visibility: 'all' | 'assigned';
  area_filter: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  project?: Project;
  sprint_id?: string;
  sprint?: Sprint;
  assignee_id?: string;
  assignee?: InternalMember;
  status: TaskStatus;
  priority: TaskPriority;
  area?: TaskArea;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  completed_at?: string;
  is_delivered: boolean;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
    setIsLoading(false);
  }, []);

  const createProject = async (project: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();

      if (error) throw error;
      setProjects(prev => [...prev, data]);
      toast({ title: 'Projeto criado com sucesso!' });
      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({ title: 'Erro ao criar projeto', variant: 'destructive' });
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setProjects(prev => prev.map(p => p.id === id ? data : p));
      toast({ title: 'Projeto atualizado!' });
      return data;
    } catch (error) {
      console.error('Error updating project:', error);
      toast({ title: 'Erro ao atualizar projeto', variant: 'destructive' });
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Projeto removido!' });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({ title: 'Erro ao remover projeto', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, isLoading, fetchProjects, createProject, updateProject, deleteProject };
}

export function useSprints() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSprints = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setSprints(data || []);
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
    setIsLoading(false);
  }, []);

  const createSprint = async (sprint: Partial<Sprint>) => {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .insert(sprint)
        .select()
        .single();

      if (error) throw error;
      setSprints(prev => [...prev, data]);
      toast({ title: 'Sprint criada com sucesso!' });
      return data;
    } catch (error) {
      console.error('Error creating sprint:', error);
      toast({ title: 'Erro ao criar sprint', variant: 'destructive' });
      throw error;
    }
  };

  const updateSprint = async (id: string, updates: Partial<Sprint>) => {
    try {
      const { data, error } = await supabase
        .from('sprints')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setSprints(prev => prev.map(s => s.id === id ? data : s));
      toast({ title: 'Sprint atualizada!' });
      return data;
    } catch (error) {
      console.error('Error updating sprint:', error);
      toast({ title: 'Erro ao atualizar sprint', variant: 'destructive' });
      throw error;
    }
  };

  const deleteSprint = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sprints')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setSprints(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Sprint removida!' });
    } catch (error) {
      console.error('Error deleting sprint:', error);
      toast({ title: 'Erro ao remover sprint', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  return { sprints, isLoading, fetchSprints, createSprint, updateSprint, deleteSprint };
}

export function useInternalMembers() {
  const [members, setMembers] = useState<InternalMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users_internal')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return { members, isLoading, fetchMembers };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(*),
          sprint:sprints(*),
          assignee:users_internal(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match our types
      const mappedTasks = (data || []).map(task => ({
        ...task,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        area: task.area as TaskArea | undefined,
      }));
      
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    setIsLoading(false);
  }, []);

  const createTask = async (task: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          description: task.description,
          project_id: task.project_id,
          sprint_id: task.sprint_id,
          assignee_id: task.assignee_id,
          status: task.status || 'backlog',
          priority: task.priority || 'P2',
          area: task.area,
          estimated_hours: task.estimated_hours,
          due_date: task.due_date,
        })
        .select(`
          *,
          project:projects(*),
          sprint:sprints(*),
          assignee:users_internal(*)
        `)
        .single();

      if (error) throw error;
      
      const mappedTask = {
        ...data,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority,
        area: data.area as TaskArea | undefined,
      };
      
      setTasks(prev => [mappedTask, ...prev]);
      toast({ title: 'Tarefa criada com sucesso!' });
      return mappedTask;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({ title: 'Erro ao criar tarefa', variant: 'destructive' });
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.project_id !== undefined) updateData.project_id = updates.project_id;
      if (updates.sprint_id !== undefined) updateData.sprint_id = updates.sprint_id;
      if (updates.assignee_id !== undefined) updateData.assignee_id = updates.assignee_id;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.area !== undefined) updateData.area = updates.area;
      if (updates.estimated_hours !== undefined) updateData.estimated_hours = updates.estimated_hours;
      if (updates.actual_hours !== undefined) updateData.actual_hours = updates.actual_hours;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
      if (updates.is_delivered !== undefined) updateData.is_delivered = updates.is_delivered;
      if (updates.completed_at !== undefined) updateData.completed_at = updates.completed_at;

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          project:projects(*),
          sprint:sprints(*),
          assignee:users_internal(*)
        `)
        .single();

      if (error) throw error;
      
      const mappedTask = {
        ...data,
        status: data.status as TaskStatus,
        priority: data.priority as TaskPriority,
        area: data.area as TaskArea | undefined,
      };
      
      setTasks(prev => prev.map(t => t.id === id ? mappedTask : t));
      return mappedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({ title: 'Erro ao atualizar tarefa', variant: 'destructive' });
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Tarefa removida!' });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: 'Erro ao remover tarefa', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return { tasks, isLoading, fetchTasks, createTask, updateTask, deleteTask, setTasks };
}
