import { useState, useEffect } from 'react';
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
  ChevronRight,
  ChevronLeft,
  Bell
} from 'lucide-react';
import logoFull from '@/assets/logo-full.png';
import logoIcon from '@/assets/logo-icon.png';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SIDEBAR_COLLAPSED_KEY = 'sidebar:collapsed';

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

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ onCollapsedChange }: SidebarProps) {
  const location = useLocation();
  const { projects } = useApp();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });
  
  const activeProjects = projects.filter(p => p.status === 'active');

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    onCollapsedChange?.(isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const NavItem = ({ item, isActive }: { item: typeof mainNavItems[0]; isActive: boolean }) => {
    const content = (
      <Link
        to={item.href}
        className={cn(
          'sidebar-item',
          isActive && 'sidebar-item-active',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col shadow-sidebar z-50 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border transition-all duration-300",
          isCollapsed ? "justify-center px-2 py-4" : "gap-3 px-5 py-6"
        )}>
          {isCollapsed ? (
            <img src={logoIcon} alt="4Selet" className="h-8 w-8 object-contain transition-all duration-300" />
          ) : (
            <img src={logoFull} alt="4Selet" className="h-10 w-auto transition-all duration-300" />
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className={cn(
            "absolute -right-3 top-20 z-50 flex h-7 w-7 items-center justify-center rounded-full",
            "bg-card border-2 border-border text-foreground",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all",
            "shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
          aria-label={isCollapsed ? "Expandir menu" : "Minimizar menu"}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-300",
            isCollapsed && "rotate-180"
          )} />
        </button>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
          <div className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = item.href === '/tasks' 
                ? location.pathname === '/tasks'
                : location.pathname === item.href;
              
              return (
                <NavItem key={item.href} item={item} isActive={isActive} />
              );
            })}
          </div>

          {/* Projects Section - Only show when expanded */}
          {!isCollapsed && (
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
          )}

          {/* Utility Navigation */}
          <div className={cn(
            "mt-6 pt-4 border-t border-sidebar-border",
            isCollapsed && "mt-4 pt-4"
          )}>
            {!isCollapsed && (
              <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-sidebar-muted">
                Ferramentas
              </p>
            )}
            <div className="space-y-1 mt-1">
              {utilityNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavItem key={item.href} item={item} isActive={isActive} />
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="px-4 py-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-muted text-center">
              v1.0.0 • 4Selet
            </p>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
