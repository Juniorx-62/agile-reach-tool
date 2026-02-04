export type ProjectStatus = 'active' | 'paused' | 'finished';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

export type TaskType = 'frontend' | 'backend' | 'fullstack';
export type TaskCategory = 'refinement' | 'feature' | 'bug';
export type TaskPriority = 0 | 1 | 2 | 3 | 4 | 5;
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  in_review: 'Em Revisão',
  done: 'Concluído',
};

export const TASK_STATUS_ORDER: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

export interface Task {
  id: string;
  projectId: string;
  sprintId: string;
  demandId: string;
  priority: TaskPriority;
  title: string;
  description?: string;
  type: TaskType;
  category: TaskCategory;
  status: TaskStatus;
  assignees: string[];
  estimatedHours: number;
  hasIncident: boolean;
  isDelivered: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  nickname?: string;
  photoUrl?: string;
  phone?: string;
  email: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalEstimatedHours: number;
  completedHours: number;
  remainingHours: number;
  sprintProgress: number;
  tasksWithIncidents: number;
}

export interface Alert {
  id: string;
  taskId: string;
  taskTitle: string;
  projectName: string;
  assignees: string[];
  daysOverdue: number;
}

export type NotificationType = 'task_assigned' | 'task_overdue' | 'task_completed' | 'grouped_overdue' | 'grouped_pending';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  taskIds?: string[]; // For grouped notifications
  memberId?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  overdueTasksEnabled: boolean;
  pendingTasksEnabled: boolean;
  assignedTasksEnabled: boolean;
  autoRepeat24h: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  overdueTasksEnabled: true,
  pendingTasksEnabled: true,
  assignedTasksEnabled: true,
  autoRepeat24h: true,
};
