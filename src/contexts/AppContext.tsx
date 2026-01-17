import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { Project, Sprint, Task, TeamMember, Notification, NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '@/types';
import { mockProjects, mockSprints, mockTasks, mockTeamMembers } from '@/data/mockData';
import { differenceInDays, differenceInHours, addDays, format } from 'date-fns';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
const NOTIFICATIONS_READ_KEY = 'notifications_read_state';
const NOTIFICATIONS_DISMISSED_KEY = 'notifications_dismissed_at';
const DISMISS_DURATION_HOURS = 24;
const SYSTEM_CLEARED_KEY = 'system_data_cleared';
const DATA_STORAGE_KEY = 'app_data_storage';

interface NotificationReadState {
  [notificationId: string]: {
    isRead: boolean;
    readAt: string;
  };
}

interface StoredData {
  projects: Project[];
  sprints: Sprint[];
  tasks: Task[];
  members: TeamMember[];
}

interface SprintGenerationConfig {
  startDate: Date;
  durationDays: number;
  namePattern: string;
  startNumber: number;
  endCriteria: 'end_of_year' | 'custom_date';
  customEndDate?: Date;
}

interface AppContextType {
  projects: Project[];
  sprints: Sprint[];
  tasks: Task[];
  members: TeamMember[];
  notifications: Notification[];
  notificationSettings: NotificationSettings;
  isAlertsDismissed: boolean;
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
  markNotificationAsRead: (id: string) => void;
  markNotificationAsUnread: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  importTasks: (newTasks: Omit<Task, 'id' | 'createdAt'>[], mode: 'overwrite' | 'append') => void;
  getTaskById: (id: string) => Task | undefined;
  clearDemoData: () => void;
  resetSystem: () => void;
  generateGlobalSprints: (config: SprintGenerationConfig) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Event for notifying components about data changes
export const DATA_CHANGED_EVENT = 'app-data-changed';

// Helper to parse dates from stored data
const parseDates = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(parseDates);
  if (typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (['createdAt', 'updatedAt', 'startDate', 'endDate', 'completedAt', 'readAt'].includes(key) && data[key]) {
        result[key] = new Date(data[key]);
      } else {
        result[key] = parseDates(data[key]);
      }
    }
    return result;
  }
  return data;
};

// Load initial data - check if system was cleared
const loadInitialData = (): StoredData => {
  const isCleared = localStorage.getItem(SYSTEM_CLEARED_KEY);
  
  if (isCleared === 'true') {
    // System was cleared, load from storage or return empty
    const storedData = localStorage.getItem(DATA_STORAGE_KEY);
    if (storedData) {
      return parseDates(JSON.parse(storedData));
    }
    return { projects: [], sprints: [], tasks: [], members: [] };
  }
  
  // First time or not cleared, use mock data
  return {
    projects: mockProjects,
    sprints: mockSprints,
    tasks: mockTasks,
    members: mockTeamMembers,
  };
};

export function AppProvider({ children }: { children: ReactNode }) {
  const initialData = loadInitialData();
  
  const [projects, setProjects] = useState<Project[]>(initialData.projects);
  const [sprints, setSprints] = useState<Sprint[]>(initialData.sprints);
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [members, setMembers] = useState<TeamMember[]>(initialData.members);
  const [assignedNotifications, setAssignedNotifications] = useState<Notification[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  
  // Load notification settings from localStorage
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return saved ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) } : DEFAULT_NOTIFICATION_SETTINGS;
  });

  // Load read state from localStorage
  const [readState, setReadState] = useState<NotificationReadState>(() => {
    const saved = localStorage.getItem(NOTIFICATIONS_READ_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  // Check if alerts are dismissed (24h rule)
  const [isAlertsDismissed, setIsAlertsDismissed] = useState(() => {
    const dismissedAt = localStorage.getItem(NOTIFICATIONS_DISMISSED_KEY);
    if (dismissedAt) {
      const hoursSinceDismissal = differenceInHours(new Date(), new Date(dismissedAt));
      if (hoursSinceDismissal < DISMISS_DURATION_HOURS) {
        return true;
      } else {
        const settings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        const parsedSettings = settings ? JSON.parse(settings) : DEFAULT_NOTIFICATION_SETTINGS;
        if (parsedSettings.autoRepeat24h) {
          localStorage.removeItem(NOTIFICATIONS_DISMISSED_KEY);
          const newReadState = { ...readState };
          Object.keys(newReadState).forEach(key => {
            if (key.includes('overdue') || key.includes('pending')) {
              delete newReadState[key];
            }
          });
          localStorage.setItem(NOTIFICATIONS_READ_KEY, JSON.stringify(newReadState));
        }
        return false;
      }
    }
    return false;
  });

  // Persist data to localStorage whenever it changes
  useEffect(() => {
    const isCleared = localStorage.getItem(SYSTEM_CLEARED_KEY);
    if (isCleared === 'true') {
      const dataToStore: StoredData = { projects, sprints, tasks, members };
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(dataToStore));
    }
  }, [projects, sprints, tasks, members]);

  // Persist notification settings
  useEffect(() => {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(notificationSettings));
  }, [notificationSettings]);

  // Persist read state
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_READ_KEY, JSON.stringify(readState));
  }, [readState]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Generate grouped notifications based on tasks
  const generatedNotifications = useMemo(() => {
    if (!notificationSettings.enabled) return [];

    const notifs: Notification[] = [];
    const now = new Date();

    const overdueTasks = tasks.filter(task => {
      if (task.isDelivered) return false;
      const daysSinceCreation = differenceInDays(now, new Date(task.createdAt));
      return daysSinceCreation > 30;
    });

    if (notificationSettings.overdueTasksEnabled && overdueTasks.length > 0) {
      const notifId = 'grouped-overdue';
      notifs.push({
        id: notifId,
        type: 'grouped_overdue',
        title: 'Tarefas em atraso',
        message: `Você possui ${overdueTasks.length} tarefa${overdueTasks.length > 1 ? 's' : ''} em atraso há mais de 30 dias`,
        taskIds: overdueTasks.map(t => t.id),
        isRead: readState[notifId]?.isRead || false,
        createdAt: new Date(),
        readAt: readState[notifId]?.readAt ? new Date(readState[notifId].readAt) : undefined,
      });
    }

    const pendingTasks = tasks.filter(task => {
      if (task.isDelivered) return false;
      const daysSinceCreation = differenceInDays(now, new Date(task.createdAt));
      return daysSinceCreation <= 30 && daysSinceCreation > 7;
    });

    if (notificationSettings.pendingTasksEnabled && pendingTasks.length > 0) {
      const notifId = 'grouped-pending';
      notifs.push({
        id: notifId,
        type: 'grouped_pending',
        title: 'Tarefas pendentes',
        message: `Existem ${pendingTasks.length} tarefa${pendingTasks.length > 1 ? 's' : ''} pendentes há mais de 7 dias`,
        taskIds: pendingTasks.map(t => t.id),
        isRead: readState[notifId]?.isRead || false,
        createdAt: new Date(),
        readAt: readState[notifId]?.readAt ? new Date(readState[notifId].readAt) : undefined,
      });
    }

    if (notificationSettings.assignedTasksEnabled) {
      assignedNotifications.forEach(n => {
        notifs.push({
          ...n,
          isRead: readState[n.id]?.isRead || n.isRead,
          readAt: readState[n.id]?.readAt ? new Date(readState[n.id].readAt) : n.readAt,
        });
      });
    }

    return notifs;
  }, [tasks, assignedNotifications, notificationSettings, readState]);

  const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...project,
      id: `proj-${generateId()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProjects(prev => [...prev, newProject]);
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, ...data, updatedAt: new Date() } : p))
    );
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setSprints(prev => prev.filter(s => s.projectId !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const addSprint = (sprint: Omit<Sprint, 'id' | 'createdAt'>) => {
    const newSprint: Sprint = {
      ...sprint,
      id: `sprint-${generateId()}`,
      createdAt: new Date(),
    };
    setSprints(prev => [...prev, newSprint]);
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const updateSprint = (id: string, data: Partial<Sprint>) => {
    setSprints(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const deleteSprint = (id: string) => {
    setSprints(prev => prev.filter(s => s.id !== id));
    setTasks(prev => prev.filter(t => t.sprintId !== id));
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${generateId()}`,
      createdAt: new Date(),
    };
    setTasks(prev => [...prev, newTask]);

    if (notificationSettings.assignedTasksEnabled) {
      task.assignees.forEach(memberId => {
        const member = members.find(m => m.id === memberId);
        if (member) {
          const notifId = `notif-assigned-${newTask.id}-${memberId}`;
          setAssignedNotifications(prev => [...prev, {
            id: notifId,
            type: 'task_assigned',
            title: 'Nova tarefa atribuída',
            message: `Você foi atribuído à tarefa "${task.title}"`,
            taskId: newTask.id,
            memberId,
            isRead: false,
            createdAt: new Date(),
          }]);
        }
      });
    }
    
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const updateTask = (id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const addMember = (member: Omit<TeamMember, 'id' | 'createdAt'>) => {
    const newMember: TeamMember = {
      ...member,
      id: `member-${generateId()}`,
      createdAt: new Date(),
    };
    setMembers(prev => [...prev, newMember]);
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const updateMember = (id: string, data: Partial<TeamMember>) => {
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, ...data } : m)));
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const markNotificationAsRead = useCallback((id: string) => {
    setReadState(prev => ({
      ...prev,
      [id]: { isRead: true, readAt: new Date().toISOString() }
    }));
  }, []);

  const markNotificationAsUnread = useCallback((id: string) => {
    setReadState(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    const newReadState: NotificationReadState = {};
    generatedNotifications.forEach(n => {
      newReadState[n.id] = { isRead: true, readAt: new Date().toISOString() };
    });
    setReadState(prev => ({ ...prev, ...newReadState }));
    localStorage.setItem(NOTIFICATIONS_DISMISSED_KEY, new Date().toISOString());
    setIsAlertsDismissed(true);
  }, [generatedNotifications]);

  const updateNotificationSettings = useCallback((settings: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...settings }));
  }, []);

  const getTaskById = useCallback((id: string) => {
    return tasks.find(t => t.id === id);
  }, [tasks]);

  const importTasks = (newTasks: Omit<Task, 'id' | 'createdAt'>[], mode: 'overwrite' | 'append') => {
    const tasksWithIds: Task[] = newTasks.map(task => ({
      ...task,
      id: `task-${generateId()}`,
      createdAt: new Date(),
    }));

    if (mode === 'overwrite') {
      setTasks(tasksWithIds);
    } else {
      setTasks(prev => [...prev, ...tasksWithIds]);
    }
    
    // Mark system as having user data
    localStorage.setItem(SYSTEM_CLEARED_KEY, 'true');
    
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  };

  const clearDemoData = useCallback(() => {
    setProjects([]);
    setSprints([]);
    setTasks([]);
    setMembers([]);
    
    // Mark system as cleared to prevent mock data from reappearing
    localStorage.setItem(SYSTEM_CLEARED_KEY, 'true');
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify({ projects: [], sprints: [], tasks: [], members: [] }));
    
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  }, []);

  const resetSystem = useCallback(() => {
    setProjects([]);
    setSprints([]);
    setTasks([]);
    setMembers([]);
    setAssignedNotifications([]);
    setSelectedProjectId(null);
    setSelectedSprintId(null);
    setReadState({});
    
    // Mark system as cleared and remove all stored data
    localStorage.setItem(SYSTEM_CLEARED_KEY, 'true');
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify({ projects: [], sprints: [], tasks: [], members: [] }));
    localStorage.removeItem(NOTIFICATIONS_READ_KEY);
    localStorage.removeItem(NOTIFICATIONS_DISMISSED_KEY);
    setIsAlertsDismissed(false);
    
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  }, []);

  const generateGlobalSprints = useCallback((config: SprintGenerationConfig) => {
    const { startDate, durationDays, namePattern, startNumber, endCriteria, customEndDate } = config;
    
    // Determine end date
    let endDate: Date;
    if (endCriteria === 'end_of_year') {
      endDate = new Date(startDate.getFullYear(), 11, 31); // Dec 31
    } else {
      endDate = customEndDate || new Date(startDate.getFullYear(), 11, 31);
    }
    
    const newSprints: Sprint[] = [];
    let currentStart = new Date(startDate);
    let sprintNumber = startNumber || 1;
    
    while (currentStart < endDate) {
      const currentEnd = addDays(currentStart, durationDays - 1);
      
      // Don't create sprint if it would end after the end date
      if (currentEnd > endDate) break;
      
      // Generate name based on pattern
      const sprintName = namePattern.replace('#', String(sprintNumber).padStart(2, '0'));
      
      // Create sprint for each project
      projects.forEach(project => {
        newSprints.push({
          id: `sprint-${generateId()}`,
          projectId: project.id,
          name: sprintName,
          startDate: new Date(currentStart),
          endDate: new Date(currentEnd),
          createdAt: new Date(),
        });
      });
      
      // Move to next sprint period
      currentStart = addDays(currentEnd, 1);
      sprintNumber++;
    }
    
    // Add all new sprints
    setSprints(prev => [...prev, ...newSprints]);
    
    // Mark as having user data
    localStorage.setItem(SYSTEM_CLEARED_KEY, 'true');
    
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  }, [projects, generateId]);

  return (
    <AppContext.Provider
      value={{
        projects,
        sprints,
        tasks,
        members,
        notifications: generatedNotifications,
        notificationSettings,
        isAlertsDismissed,
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
        markNotificationAsRead,
        markNotificationAsUnread,
        markAllNotificationsAsRead,
        updateNotificationSettings,
        importTasks,
        getTaskById,
        clearDemoData,
        resetSystem,
        generateGlobalSprints,
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