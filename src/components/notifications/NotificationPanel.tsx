import { useState, useEffect, useMemo } from 'react';
import { format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, CheckCheck, AlertTriangle, UserPlus, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const NOTIFICATIONS_DISMISSED_KEY = 'notifications_dismissed_at';
const DISMISS_DURATION_HOURS = 24;

interface NotificationPanelProps {
  onTaskClick?: (taskId: string) => void;
}

export function NotificationPanel({ onTaskClick }: NotificationPanelProps) {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(NOTIFICATIONS_DISMISSED_KEY);
    if (dismissedAt) {
      const hoursSinceDismissal = differenceInHours(new Date(), new Date(dismissedAt));
      if (hoursSinceDismissal < DISMISS_DURATION_HOURS) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(NOTIFICATIONS_DISMISSED_KEY);
      }
    }
  }, []);

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    localStorage.setItem(NOTIFICATIONS_DISMISSED_KEY, new Date().toISOString());
    setIsDismissed(true);
  };

  const visibleNotifications = useMemo(() => {
    if (isDismissed) return [];
    return notifications;
  }, [notifications, isDismissed]);

  const unreadCount = isDismissed ? 0 : notifications.filter(n => !n.isRead).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <UserPlus className="w-4 h-4 text-info" />;
      case 'task_overdue':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'task_completed':
        return <CheckCheck className="w-4 h-4 text-success" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    if (notification.taskId && onTaskClick) {
      onTaskClick(notification.taskId);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {visibleNotifications.length > 0 ? (
            <div className="divide-y divide-border">
              {visibleNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-muted/50 transition-colors',
                    !notification.isRead && 'bg-primary/5'
                  )}
                >
                  <div className="flex gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm',
                        !notification.isRead && 'font-medium'
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(notification.createdAt), "dd MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
