import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { LandingPage } from '@/pages/LandingPage';
import { SignUp } from '@/pages/SignUp';
import { Login } from '@/pages/Login';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Overview } from '@/pages/admin/Overview';
import { UserDatabase } from '@/pages/admin/UserDatabase';
import { FeedbackPage } from '@/pages/admin/FeedbackPage';
import { ContentEditor } from '@/pages/admin/ContentEditor';
import { UserDeleteConfirm } from '@/pages/admin/UserDeleteConfirm';
import { ActivityDetail } from '@/pages/admin/ActivityDetail';
import { SiteContentProvider } from '@/hooks/useSiteContent';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardOverview } from '@/pages/dashboard/DashboardOverview';
import { FinanceTracker } from '@/pages/dashboard/FinanceTracker';
import { TasksPage } from '@/pages/dashboard/TasksPage';
import { SchedulesPage } from '@/pages/dashboard/SchedulesPage';
import { CollabPage } from '@/pages/dashboard/CollabPage';
import { ChatBotPage } from '@/pages/dashboard/ChatBotPage';
import { StudyHubPage } from '@/pages/dashboard/StudyHubPage';
import { WrappedPage } from '@/pages/dashboard/WrappedPage';
import { WellnessPage } from '@/pages/dashboard/WellnessPage';
import { AchievementsPage } from '@/pages/dashboard/AchievementsPage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<SiteContentProvider><LandingPage /></SiteContentProvider>} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />

          {/* User dashboard — protected by DashboardLayout (any authenticated user) */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="finance" element={<FinanceTracker />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="collab" element={<CollabPage />} />
            <Route path="chatbot" element={<ChatBotPage />} />
            <Route path="studyhub" element={<StudyHubPage />} />
            <Route path="wrapped" element={<WrappedPage />} />
            <Route path="wellness" element={<WellnessPage />} />
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Admin routes — protected by AdminLayout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="users" element={<UserDatabase />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="content" element={<ContentEditor />} />
            <Route path="users/delete/:userId" element={<UserDeleteConfirm />} />
            <Route path="activity/:activityId" element={<ActivityDetail />} />
          </Route>
        </Routes>
      </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App;
