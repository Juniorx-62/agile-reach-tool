import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AlertBanner } from '@/components/alerts/AlertBanner';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { Task } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const SIDEBAR_COLLAPSED_KEY = 'sidebar:collapsed';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const { tasks } = useApp();
  const [alertTask, setAlertTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    }
    return false;
  });

  const handleAlertClick = (type: string, taskIds: string[]) => {
    // If only one task, open it directly
    if (taskIds.length === 1) {
      const task = tasks.find(t => t.id === taskIds[0]);
      if (task) {
        setAlertTask(task);
        return;
      }
    }
    
    // For multiple tasks, navigate to notifications page with filter
    const filterParam = type === 'critical_overdue' || type === 'overdue' 
      ? 'overdue' 
      : 'pending';
    navigate(`/notifications?filter=${filterParam}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar onCollapsedChange={setSidebarCollapsed} />
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "pl-16" : "pl-64"
      )}>
        <AlertBanner onAlertClick={handleAlertClick} />
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Task Detail Modal from Alert */}
      <TaskDetailModal
        task={alertTask}
        open={!!alertTask}
        onClose={() => setAlertTask(null)}
        onEdit={() => {
          if (alertTask) {
            setEditingTask(alertTask);
            setAlertTask(null);
          }
        }}
      />

      {/* Task Edit Modal */}
      <TaskFormModal
        task={editingTask}
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
      />
    </div>
  );
}
