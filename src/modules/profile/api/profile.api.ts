import { http } from '@/shared/api/http';

export interface PortfolioItem {
  _id: string;
  title: string;
  url?: string;
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  createdAt?: string;
}

export const profileApi = {
  updateProfile: (data: { displayName?: string; bio?: string; phone?: string; enableStudyReminder?: boolean }) =>
    http.patch('/profile', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return http.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  createPortfolio: (data: { title: string; url?: string; file?: File }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.url) formData.append('url', data.url);
    if (data.file) formData.append('file', data.file);

    return http.post('/profile/portfolios', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updatePortfolio: (portfolioId: string, data: { title: string; url?: string; file?: File }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('url', data.url ?? '');
    if (data.file) formData.append('file', data.file);

    return http.patch(`/profile/portfolios/${portfolioId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletePortfolio: (portfolioId: string) => http.delete(`/profile/portfolios/${portfolioId}`),
  uploadCv: (file: File) => {
    const formData = new FormData();
    formData.append('cv', file);
    return http.post('/profile/cv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteCv: () => http.delete('/profile/cv'),
};
