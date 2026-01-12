import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  ListTodo, 
  Users, 
  Calendar, 
  Upload, 
  Download, 
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

import { Bell } from 'lucide-react';

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FolderKanban, label: 'Projetos', href: '/projects' },
  { icon: ListTodo, label: 'Tarefas', href: '/tasks' },
  { icon: Users, label: 'Equipe', href: '/team' },
  { icon: Calendar, label: 'Linha do Tempo', href: '/timeline' },
  { icon: Bell, label: 'Notificações', href: '/notifications' },
];

const utilityNavItems = [
  { icon: Upload, label: 'Importar', href: '/import' },
  { icon: Download, label: 'Exportar', href: '/export' },
  { icon: Settings, label: 'Configurações', href: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { projects } = useApp();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  
  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col shadow-sidebar z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <img src={logo} alt="Logo" className="h-10 w-auto" />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'sidebar-item',
                  isActive && 'sidebar-item-active'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Projects Section */}
        <div className="mt-6">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          >
            <span>Projetos Ativos</span>
            {projectsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {projectsExpanded && (
            <div className="mt-1 space-y-1 animate-fade-in">
              {activeProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="sidebar-item pl-5"
                >
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="truncate text-sm">{project.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Utility Navigation */}
        <div className="mt-6 pt-4 border-t border-sidebar-border">
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-sidebar-muted">
            Ferramentas
          </p>
          <div className="space-y-1 mt-1">
            {utilityNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'sidebar-item',
                    isActive && 'sidebar-item-active'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-muted text-center">
          v1.0.0 • SprintFlow
        </p>
      </div>
    </aside>
  );
}
