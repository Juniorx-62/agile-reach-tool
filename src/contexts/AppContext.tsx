import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, Sprint, Task, TeamMember } from '@/types';
import { mockProjects, mockSprints, mockTasks, mockTeamMembers } from '@/data/mockData';

interface AppContextType {
  projects: Project[];
  sprints: Sprint[];
  tasks: Task[];
  members: TeamMember[];
  selectedProjectId: string | null;
  selectedSprintId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedSprintId: (id: string | null) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addSprint: (sprint: Omit<Sprint, 'id' | 'createdAt'>) => void;
  updateSprint: (id: string, data: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => void;
  updateMember: (id: string, data: Partial<TeamMember>) => void;
  deleteMember: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [sprints, setSprints] = useState<Sprint[]>(mockSprints);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...project,
      id: `proj-${generateId()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, ...data, updatedAt: new Date() } : p))
    );
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setSprints(prev => prev.filter(s => s.projectId !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  };

  const addSprint = (sprint: Omit<Sprint, 'id' | 'createdAt'>) => {
    const newSprint: Sprint = {
      ...sprint,
      id: `sprint-${generateId()}`,
      createdAt: new Date(),
    };
    setSprints(prev => [...prev, newSprint]);
  };

  const updateSprint = (id: string, data: Partial<Sprint>) => {
    setSprints(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteSprint = (id: string) => {
    setSprints(prev => prev.filter(s => s.id !== id));
    setTasks(prev => prev.filter(t => t.sprintId !== id));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${generateId()}`,
      createdAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addMember = (member: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const newMember: TeamMember = {
      ...member,
      id: `member-${generateId()}`,
      createdAt: new Date(),
    };
    setMembers(prev => [...prev, newMember]);
  };

  const updateMember = (id: string, data: Partial<TeamMember>) => {
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...data } : m)));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        sprints,
        tasks,
        members,
        selectedProjectId,
        selectedSprintId,
        setSelectedProjectId,
        setSelectedSprintId,
        addProject,
        updateProject,
        deleteProject,
        addSprint,
        updateSprint,
        deleteSprint,
        addTask,
        updateTask,
        deleteTask,
        addMember,
        updateMember,
        deleteMember,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
