import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { SignUp } from '@/pages/SignUp';
import { Login } from '@/pages/Login';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Overview } from '@/pages/admin/Overview';
import { UserDatabase } from '@/pages/admin/UserDatabase';
import { FeedbackPage } from '@/pages/admin/FeedbackPage';
import { ContentEditor } from '@/pages/admin/ContentEditor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        {/* Admin routes — protected by AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="users" element={<UserDatabase />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="content" element={<ContentEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
