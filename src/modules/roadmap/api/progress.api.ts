import { http } from '../../../shared/api/http';

export interface ToggleProgressPayload {
  careerId: string;
  stepId: string;
}

export const progressApi = {
  toggleStep: (payload: ToggleProgressPayload) => 
    http.post('/progress/toggle', payload),
    
  enroll: (careerId: string, isEnrolled: boolean) =>
    http.post('/progress/enroll', { careerId, isEnrolled }),
    
  getDashboard: () => 
    http.get('/progress/dashboard'),
    
  submitTest: (payload: any) =>
    http.post('/test/submit', payload)
};
