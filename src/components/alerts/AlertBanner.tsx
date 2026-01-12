import { AlertTriangle, Clock, X, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface AlertGroup {
  id: string;
  type: 'critical_overdue' | 'overdue' | 'pending';
  count: number;
  taskIds: string[];
  priority: number; // Lower = higher priority
}

interface AlertBannerProps {
  onAlertClick?: (type: string, taskIds: string[]) => void;
}

export function AlertBanner({ onAlertClick }: AlertBannerProps) {
  const { tasks, notificationSettings, isAlertsDismissed } = useApp();
  const [dismissedTypes, setDismissedTypes] = useState<string[]>([]);

  const alertGroups = useMemo(() => {
    // Don't show if notifications are disabled
    if (!notificationSettings.enabled) {
      return [];
    }

    const now = new Date();
    const groups: AlertGroup[] = [];

    // Critical overdue: tasks > 60 days (highest priority)
    if (notificationSettings.overdueTasksEnabled) {
      const criticalOverdue = tasks.filter(task => {
        if (task.isDelivered) return false;
        const daysSinceCreation = differenceInDays(now, new Date(task.createdAt));
        return daysSinceCreation > 60;
      });

      if (criticalOverdue.length > 0) {
        groups.push({
          id: 'critical_overdue',
          type: 'critical_overdue',
          count: criticalOverdue.length,
          taskIds: criticalOverdue.map(t => t.id),
          priority: 1,
        });
      }

      // Regular overdue: tasks > 30 days but <= 60 days
      const regularOverdue = tasks.filter(task => {
        if (task.isDelivered) return false;
        const daysSinceCreation = differenceInDays(now, new Date(task.createdAt));
        return daysSinceCreation > 30 && daysSinceCreation <= 60;
      });

      if (regularOverdue.length > 0) {
        groups.push({
          id: 'overdue',
          type: 'overdue',
          count: regularOverdue.length,
          taskIds: regularOverdue.map(t => t.id),
          priority: 2,
        });
      }
    }

    // Pending tasks: tasks not delivered
    if (notificationSettings.pendingTasksEnabled) {
      const pendingTasks = tasks.filter(task => {
        if (task.isDelivered) return false;
        // Only include tasks that are not overdue (30 days or less)
        const daysSinceCreation = differenceInDays(now, new Date(task.createdAt));
        return daysSinceCreation <= 30;
      });

      if (pendingTasks.length > 0) {
        groups.push({
          id: 'pending',
          type: 'pending',
          count: pendingTasks.length,
          taskIds: pendingTasks.map(t => t.id),
          priority: 3,
        });
      }
    }

    // Sort by priority
    return groups.sort((a, b) => a.priority - b.priority);
  }, [tasks, notificationSettings]);

  // Apply global dismiss and individual type dismiss
  const visibleAlerts = isAlertsDismissed 
    ? [] 
    : alertGroups.filter(alert => !dismissedTypes.includes(alert.id));

  if (visibleAlerts.length === 0) return null;

  const handleAlertClick = (alert: AlertGroup) => {
    if (onAlertClick) {
      onAlertClick(alert.type, alert.taskIds);
    }
  };

  const handleDismiss = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    setDismissedTypes(prev => [...prev, alertId]);
  };

  const getAlertConfig = (type: AlertGroup['type']) => {
    switch (type) {
      case 'critical_overdue':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
          iconBg: 'bg-destructive/20',
          iconColor: 'text-destructive',
          badgeClass: 'bg-destructive text-destructive-foreground',
          getMessage: (count: number) => 
            `Você possui ${count} ${count === 1 ? 'tarefa em atraso crítico' : 'tarefas em atraso crítico'} (+60 dias)`,
        };
      case 'overdue':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          iconBg: 'bg-warning/20',
          iconColor: 'text-warning',
          badgeClass: 'bg-warning text-warning-foreground',
          getMessage: (count: number) => 
            `Você possui ${count} ${count === 1 ? 'tarefa em atraso' : 'tarefas em atraso'} (+30 dias)`,
        };
      case 'pending':
        return {
          icon: Clock,
          bgColor: 'bg-muted/50',
          borderColor: 'border-border',
          iconBg: 'bg-muted',
          iconColor: 'text-muted-foreground',
          badgeClass: 'bg-secondary text-secondary-foreground',
          getMessage: (count: number) => 
            `Existem ${count} ${count === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`,
        };
    }
  };

  return (
    <div className="border-b border-border">
      {visibleAlerts.map((alert) => {
        const config = getAlertConfig(alert.type);
        const Icon = config.icon;
        
        return (
          <div 
            key={alert.id}
            className={cn(
              'flex items-center justify-between px-6 py-3 animate-fade-in transition-colors',
              config.bgColor,
              config.borderColor
            )}
          >
            <button 
              onClick={() => handleAlertClick(alert)}
              className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity group"
            >
              <div className={cn('p-1.5 rounded-full', config.iconBg)}>
                <Icon className={cn('w-4 h-4', config.iconColor)} />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium text-foreground">
                  {config.getMessage(alert.count)}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold',
                  config.badgeClass
                )}>
                  {alert.count}
                </span>
                <span className="text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                  Ver detalhes
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </button>
            <button
              onClick={(e) => handleDismiss(e, alert.id)}
              className="p-1 rounded hover:bg-foreground/10 transition-colors ml-2"
              title="Dispensar alerta"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
