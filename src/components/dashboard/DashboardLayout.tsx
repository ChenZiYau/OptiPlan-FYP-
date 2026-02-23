import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { TaskModal } from './TaskModal';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/finance': 'Finance Tracker',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/schedules': 'Schedules',
  '/dashboard/collab': 'Collaboration',
  '/dashboard/chatbot': 'AI ChatBot',
};

export function DashboardLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0A1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const title = pageTitles[location.pathname] ?? 'Dashboard';

  return (
    <DashboardProvider>
      <FinanceProvider>
        <div className="min-h-screen bg-[#0B0A1A]">
          <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="lg:ml-[250px] min-h-screen flex flex-col">
            <DashboardHeader title={title} onMenuToggle={() => setSidebarOpen(true)} />
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>

          <TaskModal />
        </div>
      </FinanceProvider>
    </DashboardProvider>
  );
}
