import { http } from '../../../shared/api/http';

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  nodeId: string;
}

export interface SubmitQuizPayload {
  careerId: string;
  stepId: string;
  skillId: string;
  answers: Record<string, number>;
}

export const quizApi = {
  getQuizzes: (skillId: string) => http.get<{ success: boolean; data: QuizQuestion[] }>(`/quizzes/${skillId}`),
  submitQuiz: (payload: SubmitQuizPayload) => http.post('/quizzes/submit', payload)
};
