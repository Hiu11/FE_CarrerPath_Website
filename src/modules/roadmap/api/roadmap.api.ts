import { http } from '@/shared/api/http';
import type {
  CareerPath,
  CareerMentorReport,
  CareerRecommendation,
  CareerRecommendationHistory,
  CareerRecommendationInput
} from '../types';

export const roadmapApi = {
  getPublicRoadmaps: () => http.get<CareerPath[]>('/roadmaps'),
  getByCareerId: (careerId: string) => http.get<CareerPath>(`/roadmaps/${careerId}`),
  getRecommendations: (input: CareerRecommendationInput) =>
    http.post<{
      recommendations: CareerRecommendation[];
      mentorReport: CareerMentorReport;
      historyId: string | null;
    }>('/roadmaps/recommendations', input, {
      timeout: 60000
    }),
  getRecommendationHistory: () =>
    http.get<{ history: CareerRecommendationHistory[] }>('/roadmaps/recommendations/history'),
  saveRecommendationAsGoal: (historyId: string) =>
    http.post('/roadmaps/recommendations/history/' + historyId + '/save-goal')
};
