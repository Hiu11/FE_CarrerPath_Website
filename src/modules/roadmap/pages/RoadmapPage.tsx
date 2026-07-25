import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { History, Loader2, Sparkles } from 'lucide-react';
import { tokenStore } from '@/modules/auth/store/token.store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import type { CareerPath, CareerRecommendation, CareerRecommendationHistory } from '../types';
import { roadmapApi } from '../api/roadmap.api';
import { CareerCard } from '../components/CareerCard';
export const RoadmapPage = () => {
  const navigate = useNavigate();
  const isSignedIn = Boolean(tokenStore.get());
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState(true);
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [goals, setGoals] = useState('');
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [recommendationHistory, setRecommendationHistory] = useState<CareerRecommendationHistory[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  useEffect(() => {
    setIsLoadingPaths(true);
    roadmapApi.getPublicRoadmaps()
      .then((response) => setCareerPaths(response.data || []))
      .catch(() => setCareerPaths([]))
      .finally(() => setIsLoadingPaths(false));
  }, []);

  const categories = ['All', ...Array.from(new Set(careerPaths.map((career) => career.category ?? 'Other')))];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCareerPaths = careerPaths.filter((career) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query
      || career.careerTitle.toLowerCase().includes(query)
      || career.description.toLowerCase().includes(query)
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
      const response = await roadmapApi.getRecommendations({ skills, interests, goals });
      setRecommendations(response.data.recommendations);
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

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      {!isSignedIn && (
        <div className="border-2 border-primary bg-primary/10 text-primary p-4 rounded-lg font-mono text-xs uppercase tracking-wider flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            [GUEST MODE] YOU ARE VIEWING THIS ROADMAP IN PREVIEW MODE WITH MOCK INFO.
          </div>
          <button
            onClick={() => {
              window.location.href = '/login';
            }}
            className="px-4 py-2 border-2 border-primary bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all rounded-[2px] cursor-pointer shrink-0"
          >
            SIGN IN TO SAVE PROGRESS
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
                Gemini Career Match
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight uppercase font-mono">
                Find a path that fits you
              </h2>
              <p className="text-sm text-muted-foreground font-sans">
                Enter your skills, interests, and goals to receive career path suggestions with practical next skills.
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
                Get Recommendations
              </Button>
              {recommendationError && (
                <p className="text-sm text-destructive font-mono">
                  {recommendationError}
                </p>
              )}
            </div>
          </form>

          {recommendations.length > 0 && (
            <div className="mt-6 border-t-2 border-foreground pt-6">
              <h3 className="font-mono text-sm font-bold uppercase tracking-widest">
                Suggested Career Paths
              </h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {recommendations.map((recommendation) => (
                  <article
                    key={`${recommendation.careerTitle}-${recommendation.reason}`}
                    className="border-2 border-foreground bg-background p-4 rounded-[2px] space-y-3"
                  >
                    <h4 className="font-mono text-lg font-bold uppercase tracking-tight">
                      {recommendation.careerTitle}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {recommendation.reason}
                    </p>
                    <div className="space-y-2">
                      <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Skills to learn next
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {recommendation.skillsToLearn.map((skill) => (
                          <span
                            key={`${recommendation.careerTitle}-${skill}`}
                            className="text-[10px] font-mono px-2 py-0.5 border border-foreground bg-muted rounded-[2px] uppercase font-bold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
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
                          {item.recommendations[0]?.careerTitle ?? 'Career Suggestions'}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSkills(item.skills);
                          setInterests(item.interests);
                          setGoals(item.goals);
                          setRecommendations(item.recommendations);
                        }}
                        className="self-start border border-foreground bg-muted px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded-[2px] hover:bg-primary hover:text-primary-foreground"
                      >
                        View Again
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      Goal: {item.goals}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
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
