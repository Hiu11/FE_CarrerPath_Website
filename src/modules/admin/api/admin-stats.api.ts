import { http } from '../../../shared/api/http';

export interface CareerStat {
  name: string;
  value: number;
}

export interface AdminStatsResponse {
  totalUsers: number;
  activeUsers: number;
  usersWithGoal: number;
  usersWithCvOrPortfolio: number;
  totalCareerPaths: number;
  publishedPaths: number;
  draftPaths: number;
  totalSkills: number;
  totalResources: number;
  totalQuizAttempts: number;
  quizPassRate: number;
  averageRoadmapCompletion: number;
  careerDistribution: CareerStat[];
}

export const adminStatsApi = {
  getStats: () => http.get<AdminStatsResponse>('/admin/stats'),
};
