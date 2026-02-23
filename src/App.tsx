import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { LandingPage } from '@/pages/LandingPage';
import { SignUp } from '@/pages/SignUp';
import { Login } from '@/pages/Login';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Overview } from '@/pages/admin/Overview';
import { UserDatabase } from '@/pages/admin/UserDatabase';
import { FeedbackPage } from '@/pages/admin/FeedbackPage';
import { ContentEditor } from '@/pages/admin/ContentEditor';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardOverview } from '@/pages/dashboard/DashboardOverview';
import { FinanceTracker } from '@/pages/dashboard/FinanceTracker';
import { TasksPage } from '@/pages/dashboard/TasksPage';
import { SchedulesPage } from '@/pages/dashboard/SchedulesPage';
import { CollabPage } from '@/pages/dashboard/CollabPage';
import { ChatBotPage } from '@/pages/dashboard/ChatBotPage';
import { StudyHubPage } from '@/pages/dashboard/StudyHubPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
          </Route>

          {/* Admin routes — protected by AdminLayout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Overview />} />
            <Route path="users" element={<UserDatabase />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="content" element={<ContentEditor />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
