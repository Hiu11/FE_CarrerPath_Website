import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/shared/components/layout/AppLayout';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { RegisterPage } from '@/modules/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/modules/auth/pages/ForgotPasswordPage';
import { LogoutPage } from '@/modules/auth/pages/LogoutPage';
import { HomePage } from '@/modules/home/pages/HomePage';
import { ProfilePage } from '@/modules/profile/pages/ProfilePage';
import { RoadmapDetailPage } from '@/modules/roadmap/pages/RoadmapDetailPage';
import { RoadmapPage } from '@/modules/roadmap/pages/RoadmapPage';
import { FeaturePage } from '@/modules/features/pages/FeaturePage';
import { ContactPage } from '@/modules/contact/pages/ContactPage';
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage';
import { QuizPage } from '@/modules/quiz/pages/QuizPage';
import { AdminRoute } from '@/modules/admin/components/AdminRoute';
import { AdminLayout } from '@/modules/admin/pages/AdminLayout';
import { AdminSkillsPage } from '@/modules/admin/pages/AdminSkillsPage';
import { AdminRoadmapsPage } from '@/modules/admin/pages/AdminRoadmapsPage';
import { AdminUsersPage } from '@/modules/admin/pages/AdminUsersPage';
import { CareerPathBuilderPage } from '@/modules/admin/pages/CareerPathBuilderPage';
import { CareerPathsPage } from '@/modules/admin/pages/CareerPathsPage';
import { AdminResourcesPage } from '@/modules/admin/pages/AdminResourcesPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/roadmap/:careerId" element={<RoadmapDetailPage />} />
        <Route path="/features" element={<FeaturePage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Auth routes under AppLayout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Route>
      <Route path="/quiz/:skillId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="career-paths" element={<CareerPathsPage />} />
        <Route path="career-paths/new" element={<CareerPathBuilderPage />} />
        <Route path="career-paths/:id" element={<CareerPathBuilderPage />} />
        <Route path="skills" element={<AdminSkillsPage />} />
        <Route path="resources" element={<AdminResourcesPage />} />
        <Route path="roadmaps" element={<AdminRoadmapsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route index element={<Navigate to="career-paths" replace />} />
      </Route>

      <Route path="/logout" element={<LogoutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
