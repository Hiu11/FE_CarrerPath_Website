import { http } from '../../../shared/api/http';

export interface DemoReadinessStatus {
  adminExists: boolean;
  learnerExists: boolean;
  enrollmentsExist: boolean;
  progressTargetReached: boolean;
  quizHistoryExists: boolean;
  cvUploaded: boolean;
  portfolioProjectExists: boolean;
}

export const demoStudioApi = {
  getStatus: () => http.get<DemoReadinessStatus>('/admin/demo-studio/status'),
  seed: () => http.post('/admin/demo-studio/seed'),
  reset: () => http.post('/admin/demo-studio/reset')
};
