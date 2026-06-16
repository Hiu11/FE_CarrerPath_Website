import { http } from '../../../shared/api/http';
import type { AuthPayload } from '../types/auth.types';

export const authApi = {
  register: (payload: AuthPayload) => http.post('/auth/register', payload),
  verifyRegisterOtp: (email: string, otp: string) =>
    http.post('/auth/register/verify-otp', { email, otp }),
  login: (payload: AuthPayload) => http.post('/auth/login', payload),
  verifyLoginOtp: (email: string, otp: string) =>
    http.post('/auth/login/verify-otp', { email, otp }),
  forgotPassword: (email: string) => http.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    http.post('/auth/reset-password', { email, token, newPassword }),
  getMe: () => http.get('/auth/me')
};
