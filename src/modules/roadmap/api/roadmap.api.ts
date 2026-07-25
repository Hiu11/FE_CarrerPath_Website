import { http } from '@/shared/api/http';
import type {
  CareerPath,
  CareerRecommendation,
  CareerRecommendationHistory,
  CareerRecommendationInput
} from '../types';

export const roadmapApi = {
  getPublicRoadmaps: () => http.get<CareerPath[]>('/roadmaps'),
  getByCareerId: (careerId: string) => http.get<CareerPath>(`/roadmaps/${careerId}`),
  getRecommendations: (input: CareerRecommendationInput) =>
    http.post<{ recommendations: CareerRecommendation[] }>('/roadmaps/recommendations', input, {
      timeout: 60000
    }),
  getRecommendationHistory: () =>
    http.get<{ history: CareerRecommendationHistory[] }>('/roadmaps/recommendations/history')
};
