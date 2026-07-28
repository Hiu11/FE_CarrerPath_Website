export interface ExternalResource {
  title: string;
  sourceName: string;
  url: string;
}

export interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  subtopics: string[];
  externalResources: ExternalResource[];
}

export interface CareerPath {
  id: string;
  careerTitle: string;
  description: string;
  category?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  outcome?: string;
  portfolioOutcome?: string;
  skills: string[];
  roadmapSteps: RoadmapStep[];
}

export interface CareerRecommendationInput {
  skills: string;
  interests: string;
  goals: string;
  workStyle?: string;
  timeCommitment?: string;
}

export interface CareerRecommendation {
  careerId?: string;
  careerTitle: string;
  reason: string;
  matchScore?: number;
  skillsToLearn: string[];
}

export interface MentorSkillGap {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface MentorActionDay {
  day: number;
  title: string;
  detail: string;
}

export interface MentorSuggestedQuiz {
  title: string;
  careerId: string;
  stepId: string;
  relatedSkill: string;
  reason: string;
}

export interface CareerMentorReport {
  bestMatch: {
    careerId: string;
    careerTitle: string;
    matchScore: number;
    summary: string;
  };
  recommendations: CareerRecommendation[];
  whyThisPathFits: string[];
  strengths: string[];
  skillGaps: MentorSkillGap[];
  recommendedNextSkills: string[];
  suggestedQuiz: MentorSuggestedQuiz | null;
  portfolioSuggestion: string;
  sevenDayPlan: MentorActionDay[];
  source: 'ai' | 'fallback';
}

export interface CareerRecommendationHistory {
  id: string;
  skills: string;
  interests: string;
  goals: string;
  workStyle?: string;
  timeCommitment?: string;
  recommendations: CareerRecommendation[];
  mentorReport?: CareerMentorReport;
  savedCareerId?: string;
  savedAt?: string;
  createdAt: string;
}
