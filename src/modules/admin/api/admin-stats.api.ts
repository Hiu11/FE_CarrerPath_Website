import { http } from '../../../shared/api/http';

export interface CareerStat {
  name: string;
  value: number;
}

export interface AdminStatsResponse {
  totalUsers: number;
  totalCareers: number;
  totalSkills: number;
  totalResources: number;
  careerDistribution: CareerStat[];
}

export const adminStatsApi = {
  getStats: () => http.get<AdminStatsResponse>('/admin/stats'),
};
