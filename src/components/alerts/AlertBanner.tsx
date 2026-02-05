import { AlertTriangle, Clock, X, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface AlertGroup {
  id: string;
  type: 'critical_overdue' | 'overdue' | 'pending';
  count: number;
  taskIds: string[];
  priority: number;
}

interface AlertBannerProps {
  onAlertClick?: (type: string, taskIds: string[]) => void;
}

const ALERT_ROTATION_INTERVAL = 15000; // 15 seconds

export function AlertBanner({ onAlertClick }: AlertBannerProps) {
  const { tasks, notificationSettings, isAlertsDismissed } = useApp();
  const [dismissedTypes, setDismissedTypes] = useState<string[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const alertGroups = useMemo(() => {
    if (!notificationSettings.enabled) {
      return [];
    }

    const now = new Date();
    const groups: AlertGroup[] = [];

    // Critical overdue: tasks > 60 days
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

    // Pending tasks
    if (notificationSettings.pendingTasksEnabled) {
      const pendingTasks = tasks.filter(task => {
        if (task.isDelivered) return false;
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

    return groups.sort((a, b) => a.priority - b.priority);
  }, [tasks, notificationSettings]);

  // Filter out dismissed alerts
  const visibleAlerts = isAlertsDismissed 
    ? [] 
    : alertGroups.filter(alert => !dismissedTypes.includes(alert.id));

  // Auto-rotate alerts
  useEffect(() => {
    if (visibleAlerts.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      
      // Wait for exit animation
      setTimeout(() => {
        setCurrentAlertIndex(prev => (prev + 1) % visibleAlerts.length);
        setIsAnimating(false);
      }, 350);
    }, ALERT_ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [visibleAlerts.length]);

  // Reset index if alerts change
  useEffect(() => {
    if (currentAlertIndex >= visibleAlerts.length) {
      setCurrentAlertIndex(0);
    }
  }, [visibleAlerts.length, currentAlertIndex]);

  if (visibleAlerts.length === 0) return null;

  const currentAlert = visibleAlerts[currentAlertIndex];

  const handleAlertClick = () => {
    if (onAlertClick && currentAlert) {
      onAlertClick(currentAlert.type, currentAlert.taskIds);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentAlert) {
      setDismissedTypes(prev => [...prev, currentAlert.id]);
    }
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

  const config = getAlertConfig(currentAlert.type);
  const Icon = config.icon;

  return (
    <div className="border-b border-border relative overflow-hidden">
      <div 
        key={currentAlert.id}
        className={cn(
          'flex items-center justify-between px-6 py-3 transition-colors',
          config.bgColor,
          config.borderColor,
          isAnimating ? 'alert-exit' : 'alert-enter'
        )}
      >
        <button 
          onClick={handleAlertClick}
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity group"
        >
          <div className={cn('p-1.5 rounded-full', config.iconBg)}>
            <Icon className={cn('w-4 h-4', config.iconColor)} />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-foreground">
              {config.getMessage(currentAlert.count)}
            </span>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-semibold',
              config.badgeClass
            )}>
              {currentAlert.count}
            </span>
            <span className="text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
              Ver detalhes
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </button>
        
        <div className="flex items-center gap-3">
          {/* Alert pagination indicator */}
          {visibleAlerts.length > 1 && (
            <div className="flex items-center gap-1">
              {visibleAlerts.map((_, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    idx === currentAlertIndex 
                      ? 'bg-foreground' 
                      : 'bg-muted-foreground/30'
                  )}
                />
              ))}
            </div>
          )}
          
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded hover:bg-foreground/10 transition-colors"
            title="Dispensar alerta"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
