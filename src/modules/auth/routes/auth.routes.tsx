import { Navigate, Route } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { LoginPage } from '../pages/LoginPage';
import { LogoutPage } from '../pages/LogoutPage';
import { MePage } from '../pages/MePage';
import { RegisterPage } from '../pages/RegisterPage';

export const authRoutes = (
  <Route element={<AuthLayout />}>
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/logout" element={<LogoutPage />} />
    <Route
      path="/me"
      element={
        <ProtectedRoute>
          <MePage />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Route>
);
