import { AlertTriangle, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { differenceInDays } from 'date-fns';
import { Task } from '@/types';

interface AlertBannerProps {
  onTaskClick?: (task: Task) => void;
}

export function AlertBanner({ onTaskClick }: AlertBannerProps) {
  const { tasks, projects, members } = useApp();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(task => {
      if (task.isDelivered) return false;
      const daysSinceCreation = differenceInDays(now, new Date(task.createdAt));
      return daysSinceCreation > 30;
    }).map(task => {
      const project = projects.find(p => p.id === task.projectId);
      const assigneeNames = task.assignees
        .map(id => members.find(m => m.id === id)?.name)
        .filter(Boolean);
      
      return {
        id: task.id,
        task,
        title: task.title,
        projectName: project?.name || 'Projeto desconhecido',
        assignees: assigneeNames as string[],
        daysOverdue: differenceInDays(new Date(), new Date(task.createdAt)),
      };
    });
  }, [tasks, projects, members]);

  const visibleAlerts = overdueTasks.filter(alert => !dismissed.includes(alert.id));

  if (visibleAlerts.length === 0) return null;

  const handleAlertClick = (alert: typeof visibleAlerts[0]) => {
    if (onTaskClick) {
      onTaskClick(alert.task);
    }
  };

  return (
    <div className="bg-warning/10 border-b border-warning/20">
      {visibleAlerts.map((alert) => (
        <div 
          key={alert.id}
          className="flex items-center justify-between px-6 py-3 animate-fade-in"
        >
          <button 
            onClick={() => handleAlertClick(alert)}
            className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
          >
            <div className="p-1.5 rounded-full bg-warning/20">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                {alert.title}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{alert.projectName}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{alert.assignees.join(', ') || 'Sem responsável'}</span>
              <span className="badge-warning badge-status ml-2">
                {alert.daysOverdue} dias em atraso
              </span>
            </div>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(prev => [...prev, alert.id]);
            }}
            className="p-1 rounded hover:bg-warning/20 transition-colors ml-2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
}
