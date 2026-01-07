import { Project, Sprint, Task, TeamMember } from '@/types';

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Portal do Cliente',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-01'),
  },
  {
    id: 'proj-2',
    name: 'App Mobile Banking',
    status: 'active',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-11-28'),
  },
  {
    id: 'proj-3',
    name: 'Sistema de Relatórios',
    status: 'paused',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-10-15'),
  },
  {
    id: 'proj-4',
    name: 'Integração API Pagamentos',
    status: 'finished',
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date('2024-06-30'),
  },
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: 'member-1',
    name: 'Ana Silva',
    email: 'ana.silva@empresa.com',
    phone: '(11) 99999-1111',
    createdAt: new Date('2023-06-01'),
  },
  {
    id: 'member-2',
    name: 'Bruno Costa',
    email: 'bruno.costa@empresa.com',
    phone: '(11) 99999-2222',
    createdAt: new Date('2023-06-15'),
  },
  {
    id: 'member-3',
    name: 'Carla Mendes',
    email: 'carla.mendes@empresa.com',
    phone: '(11) 99999-3333',
    createdAt: new Date('2023-07-01'),
  },
  {
    id: 'member-4',
    name: 'Daniel Oliveira',
    email: 'daniel.oliveira@empresa.com',
    phone: '(11) 99999-4444',
    createdAt: new Date('2023-08-01'),
  },
  {
    id: 'member-5',
    name: 'Eduarda Santos',
    email: 'eduarda.santos@empresa.com',
    phone: '(11) 99999-5555',
    createdAt: new Date('2024-01-10'),
  },
];

export const mockSprints: Sprint[] = [
  {
    id: 'sprint-1',
    projectId: 'proj-1',
    name: 'Sprint 23',
    startDate: new Date('2024-12-02'),
    endDate: new Date('2024-12-15'),
    createdAt: new Date('2024-12-01'),
  },
  {
    id: 'sprint-2',
    projectId: 'proj-1',
    name: 'Sprint 22',
    startDate: new Date('2024-11-18'),
    endDate: new Date('2024-12-01'),
    createdAt: new Date('2024-11-17'),
  },
  {
    id: 'sprint-3',
    projectId: 'proj-2',
    name: 'Sprint 15',
    startDate: new Date('2024-12-02'),
    endDate: new Date('2024-12-15'),
    createdAt: new Date('2024-12-01'),
  },
  {
    id: 'sprint-4',
    projectId: 'proj-2',
    name: 'Sprint 14',
    startDate: new Date('2024-11-18'),
    endDate: new Date('2024-12-01'),
    createdAt: new Date('2024-11-17'),
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    sprintId: 'sprint-1',
    demandId: 'PORTAL-123',
    priority: 4,
    title: 'Implementar autenticação OAuth',
    type: 'fullstack',
    category: 'feature',
    assignees: ['member-1', 'member-2'],
    estimatedHours: 16,
    hasIncident: false,
    isDelivered: true,
    createdAt: new Date('2024-12-02'),
    completedAt: new Date('2024-12-08'),
  },
  {
    id: 'task-2',
    projectId: 'proj-1',
    sprintId: 'sprint-1',
    demandId: 'PORTAL-124',
    priority: 5,
    title: 'Corrigir bug no formulário de cadastro',
    type: 'frontend',
    category: 'bug',
    assignees: ['member-3'],
    estimatedHours: 4,
    hasIncident: true,
    isDelivered: true,
    createdAt: new Date('2024-12-03'),
    completedAt: new Date('2024-12-05'),
  },
  {
    id: 'task-3',
    projectId: 'proj-1',
    sprintId: 'sprint-1',
    demandId: 'PORTAL-125',
    priority: 3,
    title: 'Refinamento do módulo de relatórios',
    type: 'frontend',
    category: 'refinement',
    assignees: ['member-4'],
    estimatedHours: 8,
    hasIncident: false,
    isDelivered: false,
    createdAt: new Date('2024-12-04'),
  },
  {
    id: 'task-4',
    projectId: 'proj-1',
    sprintId: 'sprint-1',
    demandId: 'PORTAL-126',
    priority: 4,
    title: 'API de integração com sistema legado',
    type: 'backend',
    category: 'feature',
    assignees: ['member-2'],
    estimatedHours: 20,
    hasIncident: false,
    isDelivered: false,
    createdAt: new Date('2024-12-05'),
  },
  {
    id: 'task-5',
    projectId: 'proj-2',
    sprintId: 'sprint-3',
    demandId: 'MOBILE-089',
    priority: 5,
    title: 'Tela de transferência PIX',
    type: 'frontend',
    category: 'feature',
    assignees: ['member-1', 'member-5'],
    estimatedHours: 24,
    hasIncident: false,
    isDelivered: true,
    createdAt: new Date('2024-12-02'),
    completedAt: new Date('2024-12-10'),
  },
  {
    id: 'task-6',
    projectId: 'proj-2',
    sprintId: 'sprint-3',
    demandId: 'MOBILE-090',
    priority: 2,
    title: 'Melhorias de performance na listagem',
    type: 'fullstack',
    category: 'refinement',
    assignees: ['member-4'],
    estimatedHours: 12,
    hasIncident: true,
    isDelivered: false,
    createdAt: new Date('2024-12-03'),
  },
  {
    id: 'task-7',
    projectId: 'proj-1',
    sprintId: 'sprint-2',
    demandId: 'PORTAL-120',
    priority: 3,
    title: 'Dashboard de métricas do usuário',
    type: 'fullstack',
    category: 'feature',
    assignees: ['member-3', 'member-5'],
    estimatedHours: 32,
    hasIncident: false,
    isDelivered: true,
    createdAt: new Date('2024-11-18'),
    completedAt: new Date('2024-11-29'),
  },
  {
    id: 'task-8',
    projectId: 'proj-1',
    sprintId: 'sprint-1',
    demandId: 'PORTAL-100',
    priority: 4,
    title: 'Sistema de notificações push',
    type: 'backend',
    category: 'feature',
    assignees: ['member-2'],
    estimatedHours: 16,
    hasIncident: false,
    isDelivered: false,
    createdAt: new Date('2024-11-01'),
  },
];

export const getProjectById = (id: string) => mockProjects.find(p => p.id === id);
export const getSprintById = (id: string) => mockSprints.find(s => s.id === id);
export const getMemberById = (id: string) => mockTeamMembers.find(m => m.id === id);

export const getTasksByProject = (projectId: string) => 
  mockTasks.filter(t => t.projectId === projectId);

export const getTasksBySprint = (sprintId: string) => 
  mockTasks.filter(t => t.sprintId === sprintId);

export const getSprintsByProject = (projectId: string) => 
  mockSprints.filter(s => s.projectId === projectId);

export const getTasksByMember = (memberId: string) => 
  mockTasks.filter(t => t.assignees.includes(memberId));
