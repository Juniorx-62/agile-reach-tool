import { Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { ThemeToggle } from './ThemeToggle';
import { EnvironmentSwitcher } from './EnvironmentSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onTaskClick?: (taskId: string) => void;
  hideFilters?: boolean;
}

export function Header({ title, subtitle, onTaskClick, hideFilters = false }: HeaderProps) {
  const { projects, selectedProjectId, setSelectedProjectId, sprints, selectedSprintId, setSelectedSprintId } = useApp();
  const { authSession } = useAuth();
  const location = useLocation();

  const filteredSprints = selectedProjectId 
    ? sprints.filter(s => s.projectId === selectedProjectId)
    : sprints;

  // Show environment switcher only for internal users
  const showEnvSwitcher = authSession.user_type === 'internal';
  // Hide project/sprint filters on tickets pages
  const isTicketsPage = location.pathname.startsWith('/tickets');

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          {showEnvSwitcher && <EnvironmentSwitcher />}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!hideFilters && !isTicketsPage && (
            <div className="flex items-center gap-3">
              <Select value={selectedProjectId || 'all'} onValueChange={(v) => {
                setSelectedProjectId(v === 'all' ? null : v);
                setSelectedSprintId(null);
              }}>
                <SelectTrigger className="w-[180px] bg-card">
                  <SelectValue placeholder="Todos os projetos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os projetos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSprintId || 'all'} onValueChange={(v) => setSelectedSprintId(v === 'all' ? null : v)}>
                <SelectTrigger className="w-[160px] bg-card">
                  <SelectValue placeholder="Todas as sprints" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as sprints</SelectItem>
                  {filteredSprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar..." className="pl-9 w-[200px] bg-card" />
          </div>

          <ThemeToggle />
          {!isTicketsPage && <NotificationPanel onTaskClick={onTaskClick} />}
        </div>
      </div>
    </header>
  );
}
