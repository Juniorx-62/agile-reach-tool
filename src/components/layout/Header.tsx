import { Bell, Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { projects, selectedProjectId, setSelectedProjectId, sprints, selectedSprintId, setSelectedSprintId } = useApp();

  const filteredSprints = selectedProjectId 
    ? sprints.filter(s => s.projectId === selectedProjectId)
    : sprints;

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Filters */}
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
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
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
                  <SelectItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar..." 
              className="pl-9 w-[200px] bg-card"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              2
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
