import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, CheckCheck, AlertTriangle, UserPlus, Clock, Filter, Eye, EyeOff, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Notification, Task } from '@/types';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';

export default function Notifications() {
  const { 
    notifications, 
    tasks,
    projects,
    members,
    markNotificationAsRead, 
    markNotificationAsUnread,
    markAllNotificationsAsRead 
  } = useApp();
  
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (typeFilter !== 'all') {
        if (typeFilter === 'overdue' && !n.type.includes('overdue')) return false;
        if (typeFilter === 'assigned' && n.type !== 'task_assigned') return false;
        if (typeFilter === 'pending' && !n.type.includes('pending')) return false;
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'read' && !n.isRead) return false;
        if (statusFilter === 'unread' && n.isRead) return false;
      }
      return true;
    });
  }, [notifications, typeFilter, statusFilter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <UserPlus className="w-5 h-5 text-info" />;
      case 'task_overdue':
      case 'grouped_overdue':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'grouped_pending':
        return <Clock className="w-5 h-5 text-muted-foreground" />;
      case 'task_completed':
        return <CheckCheck className="w-5 h-5 text-success" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return 'Atribuição';
      case 'task_overdue':
      case 'grouped_overdue':
        return 'Atraso';
      case 'grouped_pending':
        return 'Pendente';
      case 'task_completed':
        return 'Concluída';
      default:
        return 'Sistema';
    }
  };

  const toggleGroup = (notifId: string) => {
    setExpandedGroups(prev => 
      prev.includes(notifId) 
        ? prev.filter(id => id !== notifId)
        : [...prev, notifId]
    );
  };

  const getTasksForNotification = (notification: Notification): Task[] => {
    if (notification.taskIds) {
      return notification.taskIds
        .map(id => tasks.find(t => t.id === id))
        .filter(Boolean) as Task[];
    }
    if (notification.taskId) {
      const task = tasks.find(t => t.id === notification.taskId);
      return task ? [task] : [];
    }
    return [];
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <>
      <Header 
        title="Central de Notificações" 
        subtitle="Gerencie todas as suas notificações"
      />
      
      <div className="p-6 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Filters and Actions */}
          <div className="stat-card mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="overdue">Atraso</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="assigned">Atribuição</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="read">Lidas</SelectItem>
                    <SelectItem value="unread">Não lidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="mr-2">
                    {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={markAllNotificationsAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Marcar todas como lidas
                </Button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="stat-card">
            <ScrollArea className="max-h-[600px]">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notification) => {
                    const relatedTasks = getTasksForNotification(notification);
                    const isGrouped = notification.taskIds && notification.taskIds.length > 0;
                    const isExpanded = expandedGroups.includes(notification.id);

                    return (
                      <div key={notification.id}>
                        <div
                          className={cn(
                            'p-4 transition-colors',
                            !notification.isRead && 'bg-primary/5'
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              'p-2 rounded-full',
                              notification.isRead ? 'bg-muted' : 'bg-primary/10'
                            )}>
                              {getIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={cn(
                                  'text-sm',
                                  !notification.isRead && 'font-semibold'
                                )}>
                                  {notification.title}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(notification.type)}
                                </Badge>
                                {notification.isRead && (
                                  <Badge variant="secondary" className="text-xs opacity-60">
                                    Lida
                                  </Badge>
                                )}
                              </div>
                              
                              <p className={cn(
                                'text-sm',
                                notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                              )}>
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(new Date(notification.createdAt), "dd MMM 'às' HH:mm", { locale: ptBR })}
                                {notification.readAt && (
                                  <span className="ml-2">
                                    • Lida em {format(new Date(notification.readAt), "dd MMM 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                )}
                              </div>

                              {/* Expandable tasks list */}
                              {isGrouped && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 h-8 px-2"
                                  onClick={() => toggleGroup(notification.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 mr-1" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 mr-1" />
                                  )}
                                  Ver {relatedTasks.length} tarefa{relatedTasks.length > 1 ? 's' : ''}
                                </Button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {notification.isRead ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => markNotificationAsUnread(notification.id)}
                                  title="Marcar como não lida"
                                >
                                  <EyeOff className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  title="Marcar como lida"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded tasks */}
                        {isExpanded && relatedTasks.length > 0 && (
                          <div className="bg-muted/30 border-l-2 border-primary/20 ml-6">
                            {relatedTasks.map(task => {
                              const project = projects.find(p => p.id === task.projectId);
                              const assigneeNames = task.assignees
                                .map(id => members.find(m => m.id === id)?.name)
                                .filter(Boolean);

                              return (
                                <button
                                  key={task.id}
                                  onClick={() => handleTaskClick(task)}
                                  className="w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm text-foreground hover:text-primary transition-colors">
                                        {task.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {project?.name} • {assigneeNames.join(', ') || 'Sem responsável'}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      P{task.priority}
                                    </Badge>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Nenhuma notificação encontrada</p>
                  <p className="text-sm mt-1">
                    {typeFilter !== 'all' || statusFilter !== 'all' 
                      ? 'Tente ajustar os filtros' 
                      : 'Você está em dia!'}
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
