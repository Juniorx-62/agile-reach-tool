import { useNavigate, useLocation } from 'react-router-dom';
import { Kanban, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function EnvironmentSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authSession } = useAuth();

  // Only show for internal users
  if (authSession.user_type !== 'internal') {
    return null;
  }

  const isTicketsEnv = location.pathname.startsWith('/tickets');
  const isInternalEnv = !isTicketsEnv;

  const handleSwitch = (env: 'internal' | 'tickets') => {
    if (env === 'tickets') {
      navigate('/tickets');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
      <button
        onClick={() => handleSwitch('internal')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
          isInternalEnv
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Kanban className="h-4 w-4" />
        <span className="hidden sm:inline">Kanban</span>
      </button>
      <button
        onClick={() => handleSwitch('tickets')}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
          isTicketsEnv
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Ticket className="h-4 w-4" />
        <span className="hidden sm:inline">Tickets</span>
      </button>
    </div>
  );
}
