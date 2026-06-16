import { http } from '@/shared/api/http';

export const profileApi = {
  updateProfile: (data: { displayName?: string; bio?: string; phone?: string }) =>
    http.patch('/profile', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return http.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
