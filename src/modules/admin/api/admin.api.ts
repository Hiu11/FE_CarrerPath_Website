import { http } from '../../../shared/api/http';

export const adminApi = {
  // Careers
  getCareers: () => http.get('/admin/careers'),
  createCareer: (data: any) => http.post('/admin/careers', data),
  updateCareer: (id: string, data: any) => http.put(`/admin/careers/${id}`, data),
  deleteCareer: (id: string) => http.delete(`/admin/careers/${id}`),

  // Career Paths
  getCareerPaths: () => http.get('/admin/career-paths'),
  getCareerPathById: (id: string) => http.get(`/admin/career-paths/${id}`),
  createCareerPath: (data: any) => http.post('/admin/career-paths', data),
  updateCareerPath: (id: string, data: any) => http.put(`/admin/career-paths/${id}`, data),
  deleteCareerPath: (id: string) => http.delete(`/admin/career-paths/${id}`),


  // Skills
  getSkills: () => http.get('/admin/skills'),
  createSkill: (data: any) => http.post('/admin/skills', data),
  updateSkill: (id: string, data: any) => http.put(`/admin/skills/${id}`, data),
  deleteSkill: (id: string) => http.delete(`/admin/skills/${id}`),

  // Roadmaps
  getRoadmaps: () => http.get('/admin/roadmaps'),
  createRoadmap: (data: any) => http.post('/admin/roadmaps', data),
  updateRoadmap: (id: string, data: any) => http.put(`/admin/roadmaps/${id}`, data),
  deleteRoadmap: (id: string) => http.delete(`/admin/roadmaps/${id}`),

  // Users
  getUsers: () => http.get('/admin/users'),
  updateUser: (id: string, data: any) => http.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => http.delete(`/admin/users/${id}`),

  // Resources
  getResources: (params?: { skillId?: string }) => http.get('/admin/resources', { params }),
  createResource: (data: any) => http.post('/admin/resources', data),
  updateResource: (id: string, data: any) => http.put(`/admin/resources/${id}`, data),
  deleteResource: (id: string) => http.delete(`/admin/resources/${id}`),
};
