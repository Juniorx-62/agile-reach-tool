import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { Project, Sprint, Task, TeamMember, Notification, NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '@/types';
import { mockProjects, mockSprints, mockTasks, mockTeamMembers } from '@/data/mockData';
import { differenceInDays, differenceInHours } from 'date-fns';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
const NOTIFICATIONS_READ_KEY = 'notifications_read_state';
const NOTIFICATIONS_DISMISSED_KEY = 'notifications_dismissed_at';
const DISMISS_DURATION_HOURS = 24;

interface NotificationReadState {
  [notificationId: string]: {
    isRead: boolean;
    readAt: string;
  };
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [sprints, setSprints] = useState<Sprint[]>(mockSprints);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers);
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
        // 24h passed, check if autoRepeat is enabled
        const settings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        const parsedSettings = settings ? JSON.parse(settings) : DEFAULT_NOTIFICATION_SETTINGS;
        if (parsedSettings.autoRepeat24h) {
          localStorage.removeItem(NOTIFICATIONS_DISMISSED_KEY);
          // Reset read state for overdue notifications
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

    // Collect overdue tasks (>30 days)
    const overdueTasks = tasks.filter(task => {
      if (task.isDelivered) return false;
      const daysSinceCreation = differenceInDays(now, new Date(task.createdAt));
      return daysSinceCreation > 30;
    });

    // Create grouped notification for overdue tasks
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

    // Collect pending tasks (not delivered, not overdue)
    const pendingTasks = tasks.filter(task => {
      if (task.isDelivered) return false;
      const daysSinceCreation = differenceInDays(now, new Date(task.createdAt));
      return daysSinceCreation <= 30 && daysSinceCreation > 7;
    });

    // Create grouped notification for pending tasks
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

    // Add assigned notifications
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

    // Create notification for assigned members
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
  };

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
