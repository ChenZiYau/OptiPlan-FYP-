import { useState, useRef, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/contexts/SettingsContext';
import { THEMES } from '@/contexts/SettingsContext';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { FinanceProvider } from '@/contexts/FinanceContext';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { TaskModal } from './TaskModal';
import { FloatingAIAssistant } from './FloatingAIAssistant';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/finance': 'Finance Tracker',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/schedules': 'Schedules',
  '/dashboard/collab': 'Collaboration',
  '/dashboard/chatbot': 'AI ChatBot',
  '/dashboard/studyhub': 'Study Hub',
  '/dashboard/wellness': 'Wellness & Journal',
  '/dashboard/wrapped': 'Wrapped',
};

function hexToRgbStr(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '168, 85, 247';
}

export function DashboardLayout() {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const shellRef = useRef<HTMLDivElement>(null);

  // ── Apply theme CSS vars scoped to .dashboard-shell ────────────────
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const theme = THEMES[settings.theme];

    el.style.setProperty('--color-primary', theme.primary);
    el.style.setProperty('--color-accent', theme.accent);
    el.style.setProperty('--color-primary-hsl', theme.primaryHSL);
    el.style.setProperty('--color-accent-hsl', theme.accentHSL);

    const [p_h, p_s, p_l] = theme.primaryHSL.split(' ');
    el.style.setProperty('--color-primary-h', p_h);
    el.style.setProperty('--color-primary-s', p_s);
    el.style.setProperty('--color-primary-l', p_l);

    const [a_h, a_s, a_l] = theme.accentHSL.split(' ');
    el.style.setProperty('--color-accent-h', a_h);
    el.style.setProperty('--color-accent-s', a_s);
    el.style.setProperty('--color-accent-l', a_l);

    const primaryRgbStr = hexToRgbStr(theme.primary);
    el.style.setProperty('--color-primary-014', `rgba(${primaryRgbStr}, 0.14)`);
    el.style.setProperty('--color-primary-018', `rgba(${primaryRgbStr}, 0.18)`);
    el.style.setProperty('--color-primary-030', `rgba(${primaryRgbStr}, 0.3)`);
  }, [settings.theme]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0A1A] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg">O</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-purple-300 animate-bounce" />
        </div>
        <p className="text-sm text-gray-500">Loading your dashboard...</p>
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
        <div
          ref={shellRef}
          className={`dashboard-shell dashboard-text-scale-${settings.textScale}${
            settings.colorMode === 'light' ? ' color-mode-light' :
            settings.colorMode === 'grey' ? ' color-mode-grey' : ''
          }`}
        >
          <div className="min-h-screen bg-[#0B0A1A]">
            <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="lg:ml-[250px] min-h-screen flex flex-col">
              <DashboardHeader title={title} onMenuToggle={() => setSidebarOpen(true)} />
              <main className="flex-1 p-4 sm:p-6">
                <Outlet />
              </main>
            </div>

            <TaskModal />
            <FloatingAIAssistant />
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1a1735',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                },
              }}
            />
          </div>
        </div>
      </FinanceProvider>
    </DashboardProvider>
  );
}
