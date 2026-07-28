import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  History,
  Loader2,
  Save,
  Sparkles,
  Target,
  UserRoundCheck,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { tokenStore } from '@/modules/auth/store/token.store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import type { CareerMentorReport, CareerPath, CareerRecommendationHistory } from '../types';
import { roadmapApi } from '../api/roadmap.api';
import { CareerCard } from '../components/CareerCard';
import careerPathsData from '../data/careers.json';

const fallbackCareerPaths = careerPathsData as CareerPath[];
export const RoadmapPage = () => {
  const navigate = useNavigate();
  const isSignedIn = Boolean(tokenStore.get());
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(true);
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [goals, setGoals] = useState('');
  const [workStyle, setWorkStyle] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');
  const [mentorReport, setMentorReport] = useState<CareerMentorReport | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [savedCareerId, setSavedCareerId] = useState<string | null>(null);
  const [recommendationHistory, setRecommendationHistory] = useState<CareerRecommendationHistory[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  useEffect(() => {
    setIsLoadingPaths(true);
    roadmapApi.getPublicRoadmaps()
      .then((response) => setCareerPaths(response.data?.length ? response.data : fallbackCareerPaths))
      .catch(() => setCareerPaths(fallbackCareerPaths))
      .finally(() => setIsLoadingPaths(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(careerPaths.map((career) => career.category ?? 'Other')))];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCareerPaths = careerPaths.filter((career) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query
      || career.careerTitle?.toLowerCase().includes(query)
      || career.description?.toLowerCase().includes(query)
      || (career.skills || []).some((skill) => skill.toLowerCase().includes(query))
      || career.outcome?.toLowerCase().includes(query);
    const matchesCategory = categoryFilter === 'All' || career.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'All' || career.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  useEffect(() => {
    if (!isSignedIn) {
      setRecommendationHistory([]);
      return;
    }

    roadmapApi.getRecommendationHistory()
      .then((response) => setRecommendationHistory(response.data.history))
      .catch(() => setRecommendationHistory([]));
  }, [isSignedIn]);

  const handleSelectCareer = (career: CareerPath) => {
    navigate(`/roadmap/${career.id}`);
  };

  const handleGetRecommendations = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecommendationError('');
    setIsLoadingRecommendations(true);

    try {
      const response = await roadmapApi.getRecommendations({ skills, interests, goals, workStyle, timeCommitment });
      setMentorReport(response.data.mentorReport);
      setActiveHistoryId(response.data.historyId);
      setSavedCareerId(null);
      if (isSignedIn) {
        const historyResponse = await roadmapApi.getRecommendationHistory();
        setRecommendationHistory(historyResponse.data.history);
      }
    } catch (error) {
      const apiMessage = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      const message = apiMessage ?? (error instanceof Error
        ? error.message
        : 'Unable to generate recommendations right now.');
      setRecommendationError(message);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleSaveGoal = async () => {
    if (!mentorReport) return;

    if (!isSignedIn) {
      navigate('/login');
      return;
    }

    if (!activeHistoryId) {
      toast.error('Generate a fresh mentor plan before saving this goal.');
      return;
    }

    try {
      setIsSavingGoal(true);
      await roadmapApi.saveRecommendationAsGoal(activeHistoryId);
      setSavedCareerId(mentorReport.bestMatch.careerId);
      toast.success('Career goal updated from mentor plan.');
      const historyResponse = await roadmapApi.getRecommendationHistory();
      setRecommendationHistory(historyResponse.data.history);
    } catch (error) {
      const apiMessage = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(apiMessage ?? 'Could not save this mentor plan.');
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleViewHistory = (item: CareerRecommendationHistory) => {
    setSkills(item.skills);
    setInterests(item.interests);
    setGoals(item.goals);
    setWorkStyle(item.workStyle ?? '');
    setTimeCommitment(item.timeCommitment ?? '');
    setMentorReport(item.mentorReport ?? buildReportFromLegacyHistory(item));
    setActiveHistoryId(item.id);
    setSavedCareerId(item.savedCareerId ?? null);
  };

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto">
      {!isSignedIn && (
        <div className="border-2 border-primary bg-primary/10 text-primary p-4 rounded-lg text-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="leading-6">
            <span className="font-mono text-xs font-bold uppercase tracking-wider">Guest mentor mode</span>
            <p className="text-primary/90">Generate a plan from your form input. Sign in to let AI include real progress, quiz, CV, and portfolio data.</p>
          </div>
          <button
            onClick={() => {
              window.location.href = '/login';
            }}
            className="px-4 py-2 border-2 border-primary bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all rounded-[2px] cursor-pointer shrink-0"
          >
            SIGN IN FOR DEEP ANALYSIS
          </button>
        </div>
      )}

      <div className="space-y-8 animate-fadeIn">
        <section className="border-2 border-foreground p-6 bg-card text-card-foreground rounded-lg space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            Directory
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight uppercase font-mono">
            Career Roadmaps
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            Select an interactive path below to explore ordered stages, skill requirements, and curated learning resources.
          </p>
        </section>

        <section className="border-2 border-foreground bg-card p-4 rounded-[4px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)]">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by role, skill, or outcome..."
              className="border-2 border-foreground rounded-[2px] font-mono text-xs"
            />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-10 border-2 border-foreground bg-background px-3 font-mono text-xs uppercase rounded-[2px]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              className="h-10 border-2 border-foreground bg-background px-3 font-mono text-xs uppercase rounded-[2px]"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Showing {filteredCareerPaths.length} of {careerPaths.length} career paths
          </p>
        </section>

        <section className="border-2 border-foreground bg-card text-card-foreground p-6 rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
                AI Career Mentor
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight uppercase font-mono">
                Generate a mentor plan
              </h2>
              <p className="text-sm text-muted-foreground font-sans">
                Get a personalized career report that blends your input with profile, roadmap, quiz, CV, and portfolio signals.
              </p>
            </div>
            <div className="hidden sm:flex size-12 items-center justify-center border-2 border-foreground bg-primary text-primary-foreground rounded-[2px]">
              <Sparkles className="size-6" aria-hidden="true" />
            </div>
          </div>

          <form onSubmit={handleGetRecommendations} className="mt-6 grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="skills" className="font-mono text-xs uppercase tracking-wider">
                  Current Skills
                </Label>
                <Input
                  id="skills"
                  value={skills}
                  onChange={(event) => setSkills(event.target.value)}
                  placeholder="React, TypeScript, teamwork..."
                  className="border-2 border-foreground rounded-[2px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interests" className="font-mono text-xs uppercase tracking-wider">
                  Interests
                </Label>
                <Input
                  id="interests"
                  value={interests}
                  onChange={(event) => setInterests(event.target.value)}
                  placeholder="UI design, APIs, data, automation..."
                  className="border-2 border-foreground rounded-[2px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals" className="font-mono text-xs uppercase tracking-wider">
                Career Goals
              </Label>
              <Textarea
                id="goals"
                value={goals}
                onChange={(event) => setGoals(event.target.value)}
                placeholder="Describe the role, work style, or outcome you want."
                className="min-h-28 border-2 border-foreground rounded-[2px]"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workStyle" className="font-mono text-xs uppercase tracking-wider">
                  Preferred Work Style
                </Label>
                <Input
                  id="workStyle"
                  value={workStyle}
                  onChange={(event) => setWorkStyle(event.target.value)}
                  placeholder="Product team, solo builder, client work..."
                  className="border-2 border-foreground rounded-[2px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeCommitment" className="font-mono text-xs uppercase tracking-wider">
                  Time Commitment
                </Label>
                <Input
                  id="timeCommitment"
                  value={timeCommitment}
                  onChange={(event) => setTimeCommitment(event.target.value)}
                  placeholder="5 hours/week, evenings, weekend sprint..."
                  className="border-2 border-foreground rounded-[2px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="submit"
                disabled={isLoadingRecommendations}
                className="border-2 border-foreground rounded-[2px] font-mono text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.2)]"
              >
                {isLoadingRecommendations ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                Generate Mentor Plan
              </Button>
              {recommendationError && (
                <p className="text-sm text-destructive font-mono">
                  {recommendationError}
                </p>
              )}
            </div>
          </form>

          {isLoadingRecommendations && (
            <div className="mt-6 grid gap-3 border-t-2 border-foreground pt-6 md:grid-cols-4">
              {['Reading profile', 'Checking roadmap progress', 'Reviewing quiz signals', 'Building mentor report'].map((item) => (
                <div key={item} className="border border-foreground bg-background p-4 rounded-[2px]">
                  <Loader2 className="mb-3 size-4 animate-spin text-primary" />
                  <p className="font-mono text-[10px] font-bold uppercase">{item}</p>
                </div>
              ))}
            </div>
          )}

          {mentorReport && !isLoadingRecommendations && (
            <MentorReportView
              report={mentorReport}
              isSignedIn={isSignedIn}
              isSaving={isSavingGoal}
              savedCareerId={savedCareerId}
              onSaveGoal={handleSaveGoal}
              onViewRoadmap={(careerId) => navigate(`/roadmap/${careerId}`)}
              onTakeQuiz={(careerId, stepId) => navigate(`/quiz/${stepId}?careerId=${careerId}&stepId=${stepId}`)}
              onUpdatePortfolio={() => navigate('/profile')}
              onLogin={() => navigate('/login')}
              signals={[
                'Form input',
                isSignedIn ? 'Profile' : 'Login required',
                isSignedIn ? 'Roadmap progress' : 'Progress after login',
                isSignedIn ? 'Quiz history' : 'Quiz history after login',
                isSignedIn ? 'CV and portfolio' : 'Portfolio after login'
              ]}
            />
          )}

          {isSignedIn && recommendationHistory.length > 0 && (
            <div className="mt-6 border-t-2 border-foreground pt-6">
              <div className="flex items-center gap-2">
                <History className="size-4 text-primary" aria-hidden="true" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-widest">
                  Recommendation History
                </h3>
              </div>
              <div className="mt-4 grid gap-3">
                {recommendationHistory.map((item) => (
                  <article
                    key={item.id}
                    className="border-2 border-foreground bg-background p-4 rounded-[2px] space-y-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="font-mono text-sm font-bold uppercase tracking-tight">
                          {item.mentorReport?.bestMatch.careerTitle ?? item.recommendations[0]?.careerTitle ?? 'Career Suggestions'}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewHistory(item)}
                        className="self-start border border-foreground bg-muted px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded-[2px] hover:bg-primary hover:text-primary-foreground"
                      >
                        View Again
                      </button>
                    </div>
                    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-[1fr_auto] sm:items-center">
                      <p className="line-clamp-2">Goal: {item.goals}</p>
                      <span className="font-mono text-[10px] uppercase">
                        Match {item.mentorReport?.bestMatch.matchScore ?? item.recommendations[0]?.matchScore ?? '--'}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.savedCareerId && (
                        <span className="text-[10px] font-mono px-2 py-0.5 border border-foreground bg-primary text-primary-foreground rounded-[2px] uppercase font-bold">
                          Saved goal
                        </span>
                      )}
                      {item.recommendations.slice(0, 4).map((recommendation) => (
                        <span
                          key={`${item.id}-${recommendation.careerTitle}`}
                          className="text-[10px] font-mono px-2 py-0.5 border border-foreground bg-muted rounded-[2px] uppercase font-bold"
                        >
                          {recommendation.careerTitle}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        {isLoadingPaths ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-foreground bg-card rounded-[4px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="mt-3 font-mono text-xs uppercase font-bold">Loading career paths...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCareerPaths.map((career) => (
                <CareerCard
                  key={career.id}
                  career={career}
                  onViewRoadmap={handleSelectCareer}
                />
              ))}
            </div>
            {filteredCareerPaths.length === 0 && (
              <div className="border-2 border-dashed border-foreground bg-card p-8 text-center rounded-[4px]">
                <p className="font-mono text-sm font-bold uppercase">No career paths match your filters</p>
                <p className="mt-2 text-sm text-muted-foreground">Try another keyword, category, or difficulty level.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const priorityTone: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-primary text-primary-foreground',
  medium: 'bg-foreground text-background',
  low: 'bg-muted text-foreground'
};

const buildReportFromLegacyHistory = (item: CareerRecommendationHistory): CareerMentorReport => {
  const top = item.recommendations[0];
  const careerId = top?.careerId ?? top?.careerTitle?.toLowerCase().replace(/\s+/g, '-') ?? 'frontend';
  const skills = top?.skillsToLearn?.length ? top.skillsToLearn : ['Roadmap fundamentals', 'Portfolio evidence'];

  return {
    bestMatch: {
      careerId,
      careerTitle: top?.careerTitle ?? 'Career Suggestions',
      matchScore: top?.matchScore ?? 72,
      summary: top?.reason ?? 'This saved recommendation was generated before mentor reports were available.'
    },
    recommendations: item.recommendations.map((recommendation) => ({
      ...recommendation,
      matchScore: recommendation.matchScore ?? 70
    })),
    whyThisPathFits: [
      top?.reason ?? 'This path matched your previous skills, interests, and goals.',
      `Original goal: ${item.goals}`
    ],
    strengths: [
      `Stated skills: ${item.skills}`,
      `Stated interests: ${item.interests}`
    ],
    skillGaps: skills.slice(0, 4).map((skill, index) => ({
      skill,
      priority: index < 2 ? 'high' : 'medium',
      reason: `${skill} was recommended as a next skill in this saved career suggestion.`
    })),
    recommendedNextSkills: skills,
    suggestedQuiz: null,
    portfolioSuggestion: 'Update your profile with one project or certificate that supports this saved recommendation.',
    sevenDayPlan: Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      title: index === 0 ? 'Review saved recommendation' : `Build evidence step ${index}`,
      detail: index === 0
        ? 'Re-read the mentor summary and choose the most important skill gap.'
        : 'Study one focused concept and add notes or evidence to your profile.'
    })),
    source: 'fallback'
  };
};

const MentorReportView = ({
  report,
  isSignedIn,
  isSaving,
  savedCareerId,
  onSaveGoal,
  onViewRoadmap,
  onTakeQuiz,
  onUpdatePortfolio,
  onLogin,
  signals
}: {
  report: CareerMentorReport;
  isSignedIn: boolean;
  isSaving: boolean;
  savedCareerId: string | null;
  onSaveGoal: () => void;
  onViewRoadmap: (careerId: string) => void;
  onTakeQuiz: (careerId: string, stepId: string) => void;
  onUpdatePortfolio: () => void;
  onLogin: () => void;
  signals: string[];
}) => {
  const isSaved = savedCareerId === report.bestMatch.careerId;

  return (
    <div className="mt-6 space-y-5 border-t-2 border-foreground pt-6">
      <div className="grid gap-3 md:grid-cols-5">
        {signals.map((signal, index) => (
          <div key={signal} className="border border-foreground bg-background p-3 rounded-[2px]">
            <div className="flex items-center gap-2">
              {index === 0 || isSignedIn ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <UserRoundCheck className="size-4 text-muted-foreground" />
              )}
              <span className="font-mono text-[10px] font-bold uppercase leading-4">{signal}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border-2 border-foreground bg-background p-5 rounded-[4px]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
            Best career match
          </span>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="grid size-28 shrink-0 place-items-center rounded-full border-2 border-foreground"
              style={{
                background: `conic-gradient(var(--primary) ${report.bestMatch.matchScore * 3.6}deg, var(--muted) 0deg)`
              }}
            >
              <div className="grid size-20 place-items-center rounded-full border-2 border-foreground bg-background">
                <span className="font-mono text-2xl font-extrabold">{report.bestMatch.matchScore}%</span>
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="font-mono text-xl font-extrabold uppercase tracking-tight">
                {report.bestMatch.careerTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.bestMatch.summary}</p>
              <span className="mt-3 inline-flex border border-foreground bg-muted px-2 py-1 font-mono text-[10px] font-bold uppercase">
                {report.source === 'ai' ? 'AI report' : 'Fallback report'}
              </span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onViewRoadmap(report.bestMatch.careerId)}
              className="inline-flex items-center gap-2 border-2 border-foreground bg-background px-3 py-2 font-mono text-xs font-bold uppercase rounded-[2px]"
            >
              <BookOpenCheck className="size-4" />
              View Roadmap
            </button>
            <button
              type="button"
              onClick={onSaveGoal}
              disabled={isSaving || isSaved}
              className="inline-flex items-center gap-2 border-2 border-foreground bg-primary px-3 py-2 font-mono text-xs font-bold uppercase text-primary-foreground rounded-[2px] disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : isSaved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
              {isSaved ? 'Saved Goal' : isSignedIn ? 'Set as Career Goal' : 'Login to Save'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ReportList title="Why this path fits" icon={Target} items={report.whyThisPathFits} />
          <ReportList title="Current strengths" icon={Trophy} items={report.strengths} />
        </div>
      </div>

      {!isSignedIn && (
        <div className="flex flex-col gap-3 border-2 border-primary bg-primary/10 p-4 rounded-[4px] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-primary">
            Sign in to save this mentor plan, connect real progress, and make the dashboard update from your chosen goal.
          </p>
          <button
            type="button"
            onClick={onLogin}
            className="border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground rounded-[2px]"
          >
            Login to save
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <section className="border-2 border-foreground bg-background p-5 rounded-[4px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-mono text-sm font-extrabold uppercase">Skill gap analysis</h3>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              Priority ordered
            </span>
          </div>
          <div className="space-y-3">
            {report.skillGaps.map((gap) => (
              <article key={`${gap.skill}-${gap.priority}`} className="border border-foreground p-4 rounded-[2px]">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`border border-foreground px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${priorityTone[gap.priority]}`}>
                    {gap.priority}
                  </span>
                  <h4 className="font-mono text-sm font-extrabold uppercase">{gap.skill}</h4>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{gap.reason}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {report.recommendedNextSkills.map((skill) => (
              <span key={skill} className="border border-foreground bg-muted px-2.5 py-1 font-mono text-[10px] font-bold uppercase rounded-[2px]">
                {skill}
              </span>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="border-2 border-foreground bg-background p-5 rounded-[4px]">
            <div className="mb-3 flex items-center gap-2">
              <BadgeCheck className="size-4 text-primary" />
              <h3 className="font-mono text-sm font-extrabold uppercase">Suggested quiz</h3>
            </div>
            {report.suggestedQuiz ? (
              <div className="space-y-3">
                <h4 className="font-mono text-base font-extrabold uppercase">{report.suggestedQuiz.title}</h4>
                <p className="text-sm text-muted-foreground">{report.suggestedQuiz.reason}</p>
                <button
                  type="button"
                  onClick={() => onTakeQuiz(report.suggestedQuiz!.careerId, report.suggestedQuiz!.stepId)}
                  className="inline-flex items-center gap-2 border-2 border-foreground bg-primary px-3 py-2 font-mono text-xs font-bold uppercase text-primary-foreground rounded-[2px]"
                >
                  Take Quiz <ArrowRight className="size-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Choose a roadmap first to unlock a targeted quiz.</p>
            )}
          </section>

          <section className="border-2 border-foreground bg-background p-5 rounded-[4px]">
            <div className="mb-3 flex items-center gap-2">
              <BriefcaseBusiness className="size-4 text-primary" />
              <h3 className="font-mono text-sm font-extrabold uppercase">Portfolio suggestion</h3>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{report.portfolioSuggestion}</p>
            <button
              type="button"
              onClick={onUpdatePortfolio}
              className="mt-4 border-2 border-foreground bg-background px-3 py-2 font-mono text-xs font-bold uppercase rounded-[2px]"
            >
              Update Portfolio
            </button>
          </section>
        </div>
      </div>

      <section className="border-2 border-foreground bg-background p-5 rounded-[4px]">
        <div className="mb-4 flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h3 className="font-mono text-sm font-extrabold uppercase">7-day action plan</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {report.sevenDayPlan.map((item) => (
            <article key={`${item.day}-${item.title}`} className="min-h-36 border border-foreground bg-card p-3 rounded-[2px]">
              <span className="font-mono text-[10px] font-bold uppercase text-primary">Day {item.day}</span>
              <h4 className="mt-2 font-mono text-xs font-extrabold uppercase leading-5">{item.title}</h4>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-2 border-foreground bg-background p-5 rounded-[4px]">
        <h3 className="font-mono text-sm font-extrabold uppercase">Other career matches</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {report.recommendations.map((recommendation) => (
            <article key={`${recommendation.careerTitle}-${recommendation.reason}`} className="border border-foreground p-4 rounded-[2px]">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-mono text-sm font-extrabold uppercase">{recommendation.careerTitle}</h4>
                <span className="border border-foreground bg-muted px-2 py-1 font-mono text-[10px] font-bold uppercase">
                  {recommendation.matchScore ?? '--'}%
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{recommendation.reason}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {recommendation.skillsToLearn.map((skill) => (
                  <span key={`${recommendation.careerTitle}-${skill}`} className="border border-foreground bg-muted px-2 py-0.5 font-mono text-[10px] font-bold uppercase rounded-[2px]">
                    {skill}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

const ReportList = ({
  title,
  items,
  icon: Icon
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <section className="border-2 border-foreground bg-background p-5 rounded-[4px]">
    <div className="mb-3 flex items-center gap-2">
      <Icon className="size-4 text-primary" />
      <h3 className="font-mono text-sm font-extrabold uppercase">{title}</h3>
    </div>
    <div className="space-y-2">
      {(items.length > 0 ? items : ['No signal recorded yet. Generate a fresh mentor plan after adding profile or roadmap progress.']).map((item) => (
        <div key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
          <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" />
          <span>{item}</span>
        </div>
      ))}
    </div>
  </section>
);
