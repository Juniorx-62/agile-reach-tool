import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { AlertBanner } from '@/components/alerts/AlertBanner';
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal';
import { TaskFormModal } from '@/components/modals/TaskFormModal';
import { Task } from '@/types';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [alertTask, setAlertTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <AlertBanner onTaskClick={(task) => setAlertTask(task)} />
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
