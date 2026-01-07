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

export interface Task {
  id: string;
  projectId: string;
  sprintId: string;
  demandId: string;
  priority: TaskPriority;
  title: string;
  type: TaskType;
  category: TaskCategory;
  assignees: string[]; // Member IDs
  estimatedHours: number;
  hasIncident: boolean;
  isDelivered: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface TeamMember {
  id: string;
  name: string;
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
