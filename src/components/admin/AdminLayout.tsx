import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

const pageTitles: Record<string, string> = {
  '/admin': 'System Overview',
  '/admin/users': 'User Database',
  '/admin/feedback': 'Feedback Management',
  '/admin/content': 'Website Content',
};

function getTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/admin/users/delete/')) return 'Delete User';
  if (pathname.startsWith('/admin/activity/')) return 'Activity Detail';
  return 'Admin';
}

export function AdminLayout() {
  const { user, profile, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0A1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const title = getTitle(location.pathname);

  return (
    <div className="min-h-screen bg-[#0B0A1A]">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-[250px] min-h-screen flex flex-col">
        <AdminHeader title={title} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
