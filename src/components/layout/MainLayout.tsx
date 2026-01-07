import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { AlertBanner } from '@/components/alerts/AlertBanner';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <AlertBanner />
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
