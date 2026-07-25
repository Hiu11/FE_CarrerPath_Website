import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileUp,
  LineChart,
  Loader2,
  Target,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { progressApi } from '@/modules/roadmap/api/progress.api';

interface CareerPathProgress {
  careerId: string;
  careerTitle: string;
  percentage: number;
  completedCount: number;
  totalCount: number;
  isEnrolled: boolean;
}

interface SkillItem {
  id: string;
  title: string;
  careerId: string;
  careerTitle?: string;
  reason?: string;
  progressPercentage?: number;
}

interface DashboardAction {
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  href: string;
  cta: string;
}

interface HistoryPoint {
  date: string;
  completedCount: number;
  roadmapSteps?: number;
  quizAttempts?: number;
  portfolioUploads?: number;
}

interface EvidenceItem {
  title: string;
  type: 'cv' | 'project-file' | 'project-link' | string;
  uploadedAt?: string;
  url?: string;
}

interface CareerGoal {
  careerId: string;
  title: string;
  note?: string;
  progress: number;
  completedCount: number;
  totalCount: number;
  nextMilestone: {
    stepId: string;
    title: string;
    description: string;
  } | null;
}

interface QuizInsight {
  quizTitle: string | null;
  careerTitle: string | null;
  stepId: string | null;
  careerId: string | null;
  score: number | null;
  passed: boolean | null;
  attemptedAt: string | null;
  action: string;
}

interface OnboardingStep {
  title: string;
  completed: boolean;
  href: string;
}

interface DashboardData {
  overallCompletion: number;
  careerPaths: CareerPathProgress[];
  careerGoal: CareerGoal | null;
  skillGap: {
    mastered: SkillItem[];
    inProgress: SkillItem[];
    missing: SkillItem[];
    recommended: SkillItem[];
  };
  stats: {
    activeCareerPaths: number;
    totalCareerPaths: number;
    masteredSkills: number;
    missingSkills: number;
    averageQuizScore: number | null;
    evidenceCount: number;
    lastActive: string | null;
  };
  history: HistoryPoint[];
  hasActivity: boolean;
  nextActions: DashboardAction[];
  evidence: EvidenceItem[];
  latestUpload: EvidenceItem | null;
  quizInsight: QuizInsight;
  onboardingSteps: OnboardingStep[];
}

const cardClass =
  'border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';

const priorityClass: Record<DashboardAction['priority'], string> = {
  high: 'bg-primary text-primary-foreground',
  medium: 'bg-foreground text-background',
  low: 'bg-muted text-foreground'
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const labelForEvidence = (type: string) => {
  if (type === 'cv') return 'CV';
  if (type === 'project-file') return 'Project file';
  return 'Project link';
};

export const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await progressApi.getDashboard();

        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
        toast.error('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const isNewUser = useMemo(() => {
    if (!data) return false;
    return !data.careerGoal && data.stats.activeCareerPaths === 0 && data.stats.masteredSkills === 0;
  }, [data]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[460px] max-w-6xl items-center justify-center px-4">
        <div className={`${cardClass} flex items-center gap-3 p-5 font-mono text-xs font-bold uppercase`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Building your career command center
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className={`${cardClass} space-y-4 p-6 text-center`}>
          <h1 className="font-mono text-xl font-extrabold uppercase">Dashboard unavailable</h1>
          <p className="text-sm text-muted-foreground">
            We could not load your career data right now. Please refresh or sign in again if your session expired.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-[2px] border-2 border-foreground bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground"
          >
            Retry <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const enrolledCareers = data.careerPaths.filter((path) => path.isEnrolled);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 animate-fadeIn">
      <section className={`${cardClass} overflow-hidden`}>
        <div className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.65fr] lg:p-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-[2px] border border-foreground bg-muted px-2.5 py-1 font-mono text-[10px] font-bold uppercase">
                <Target className="h-3.5 w-3.5" />
                Career goal
              </span>
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                Last active {formatDate(data.stats.lastActive)}
              </span>
            </div>

            {data.careerGoal ? (
              <>
                <div className="space-y-2">
                  <h1 className="font-mono text-2xl font-extrabold uppercase tracking-tight sm:text-4xl">
                    {data.careerGoal.title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {data.careerGoal.note || 'Your roadmap is ready. Keep moving through the next milestone to build a stronger career profile.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs font-bold uppercase">
                    <span>{data.careerGoal.completedCount} / {data.careerGoal.totalCount} steps complete</span>
                    <span className="text-primary">{data.careerGoal.progress}%</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-[2px] border-2 border-foreground bg-muted p-[2px]">
                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${data.careerGoal.progress}%` }} />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="rounded-[4px] border border-foreground bg-background p-4">
                    <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Next milestone</p>
                    <p className="mt-1 font-mono text-sm font-extrabold uppercase">
                      {data.careerGoal.nextMilestone?.title || 'Roadmap completed'}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {data.careerGoal.nextMilestone?.description || 'You have completed every step in this roadmap. Add evidence or explore a new career path.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/roadmap/${data.careerGoal?.careerId}`)}
                      className="inline-flex items-center gap-2 rounded-[2px] border-2 border-foreground bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground"
                    >
                      Continue <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => navigate('/roadmap')}
                      className="inline-flex items-center gap-2 rounded-[2px] border-2 border-foreground bg-background px-4 py-2 font-mono text-xs font-bold uppercase"
                    >
                      Change goal
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <h1 className="font-mono text-2xl font-extrabold uppercase tracking-tight sm:text-4xl">
                  Set your career goal
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Pick a target role so the dashboard can recommend roadmap steps, quizzes, and portfolio evidence for your next move.
                </p>
                <button
                  onClick={() => navigate('/roadmap')}
                  className="inline-flex items-center gap-2 rounded-[2px] border-2 border-foreground bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground"
                >
                  Choose career goal <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric icon={LineChart} label="Overall" value={`${data.overallCompletion}%`} />
            <Metric icon={BriefcaseBusiness} label="Paths" value={`${data.stats.activeCareerPaths}/${data.stats.totalCareerPaths}`} />
            <Metric icon={Trophy} label="Mastered" value={data.stats.masteredSkills} />
            <Metric icon={ClipboardCheck} label="Avg quiz" value={data.stats.averageQuizScore === null ? 'New' : `${data.stats.averageQuizScore}%`} />
          </div>
        </div>
      </section>

      {isNewUser && (
        <section className={`${cardClass} p-5`}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-mono text-sm font-extrabold uppercase">Start here</h2>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">New learner onboarding</span>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {data.onboardingSteps.map((step, index) => (
              <button
                key={step.title}
                onClick={() => navigate(step.href)}
                className="min-h-28 rounded-[4px] border border-foreground bg-background p-4 text-left transition hover:bg-muted"
              >
                <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">Step {index + 1}</span>
                <p className="mt-2 font-mono text-xs font-extrabold uppercase">{step.title}</p>
                <span className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-primary">
                  Start <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className={`${cardClass} p-5`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-foreground pb-3">
            <h2 className="font-mono text-sm font-extrabold uppercase">Skill gap analysis</h2>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">
              {data.stats.missingSkills} missing skills
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <SkillColumn title="Mastered skills" items={data.skillGap.mastered} tone="success" empty="No completed skills yet." />
            <SkillColumn title="In progress" items={data.skillGap.inProgress} tone="progress" empty="Enroll in a roadmap to see active skills." />
            <SkillColumn title="Missing skills" items={data.skillGap.missing.slice(0, 8)} tone="missing" empty="No gaps for the selected goal." />
            <SkillColumn title="Recommended next" items={data.skillGap.recommended} tone="recommended" empty="Choose a goal to unlock recommendations." />
          </div>
        </section>

        <section className={`${cardClass} p-5`}>
          <div className="mb-5 border-b border-foreground pb-3">
            <h2 className="font-mono text-sm font-extrabold uppercase">Next best actions</h2>
          </div>
          <div className="space-y-3">
            {data.nextActions.length > 0 ? data.nextActions.map((action) => (
              <article key={`${action.title}-${action.href}`} className="rounded-[4px] border border-foreground bg-background p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-[2px] border border-foreground px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${priorityClass[action.priority]}`}>
                      {action.priority}
                    </span>
                    <h3 className="mt-2 font-mono text-sm font-extrabold uppercase">{action.title}</h3>
                  </div>
                  <button
                    onClick={() => navigate(action.href)}
                    className="shrink-0 rounded-[2px] border-2 border-foreground bg-primary px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-primary-foreground"
                  >
                    {action.cta}
                  </button>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{action.reason}</p>
              </article>
            )) : (
              <EmptyState title="All caught up" body="You have no urgent actions right now. Explore another roadmap or add new evidence to your profile." cta="Explore roadmaps" onClick={() => navigate('/roadmap')} />
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${cardClass} p-5 lg:col-span-2`}>
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-foreground pb-3">
            <h2 className="font-mono text-sm font-extrabold uppercase">Learning activity</h2>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Last 7 days</span>
          </div>
          {data.hasActivity ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.history} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.18} />
                  <XAxis dataKey="date" tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--foreground)' }} />
                  <YAxis allowDecimals={false} tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--foreground)' }} />
                  <Tooltip contentStyle={{ border: '2px solid var(--border)', borderRadius: 4, background: 'var(--card)', color: 'var(--card-foreground)', fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                  <Area type="monotone" dataKey="completedCount" name="Total activity" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.18} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No activity yet" body="Complete a roadmap step, take a quiz, or upload a project to start building your learning history." cta="Open roadmap" onClick={() => navigate('/roadmap')} />
          )}
        </section>

        <section className={`${cardClass} p-5`}>
          <div className="mb-5 border-b border-foreground pb-3">
            <h2 className="font-mono text-sm font-extrabold uppercase">Quiz insight</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-[4px] border border-foreground bg-background p-4">
              <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                {data.quizInsight.careerTitle || 'Suggested quiz'}
              </span>
              <h3 className="mt-2 font-mono text-base font-extrabold uppercase">{data.quizInsight.quizTitle || 'Choose a roadmap first'}</h3>
              {data.quizInsight.score !== null && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-mono text-3xl font-extrabold text-primary">{data.quizInsight.score}%</span>
                  <span className="font-mono text-[10px] font-bold uppercase">
                    {data.quizInsight.passed ? 'Passed' : 'Needs review'}
                  </span>
                </div>
              )}
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{data.quizInsight.action}</p>
            </div>
            {data.quizInsight.stepId && (
              <button
                onClick={() =>
                  navigate(
                    `/quiz/${data.quizInsight.stepId}?careerId=${data.quizInsight.careerId}&stepId=${data.quizInsight.stepId}`
                  )
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-[2px] border-2 border-foreground bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground"
              >
                {data.quizInsight.passed === false ? 'Retake quiz' : 'Open quiz'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className={`${cardClass} p-5`}>
          <div className="mb-5 border-b border-foreground pb-3">
            <h2 className="font-mono text-sm font-extrabold uppercase">Latest evidence</h2>
          </div>
          {data.latestUpload ? (
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-[2px] border border-foreground bg-primary px-2 py-1 font-mono text-[10px] font-bold uppercase text-primary-foreground">
                <FileUp className="h-3 w-3" />
                {labelForEvidence(data.latestUpload.type)}
              </span>
              <h3 className="font-mono text-lg font-extrabold uppercase">{data.latestUpload.title}</h3>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">
                Uploaded {formatDate(data.latestUpload.uploadedAt)}
              </p>
              <div className="flex flex-wrap gap-2">
                {data.latestUpload.url && (
                  <a
                    href={data.latestUpload.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[2px] border-2 border-foreground bg-background px-3 py-2 font-mono text-xs font-bold uppercase"
                  >
                    View evidence
                  </a>
                )}
                <button
                  onClick={() => navigate('/profile')}
                  className="rounded-[2px] border-2 border-foreground bg-primary px-3 py-2 font-mono text-xs font-bold uppercase text-primary-foreground"
                >
                  Update profile
                </button>
              </div>
            </div>
          ) : (
            <EmptyState title="No evidence yet" body="Upload a CV, certificate, or portfolio project so your profile can prove your progress." cta="Upload evidence" onClick={() => navigate('/profile')} />
          )}
        </section>

        <section className={`${cardClass} p-5`}>
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-foreground pb-3">
            <h2 className="font-mono text-sm font-extrabold uppercase">Progress per path</h2>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{enrolledCareers.length} enrolled</span>
          </div>
          {enrolledCareers.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrolledCareers} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.18} />
                  <XAxis dataKey="careerTitle" tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--foreground)' }} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--foreground)' }} />
                  <Tooltip contentStyle={{ border: '2px solid var(--border)', borderRadius: 4, background: 'var(--card)', color: 'var(--card-foreground)', fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                  <Bar dataKey="percentage" name="Completion" fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No enrolled paths" body="Add a roadmap to begin tracking completion and skill gaps." cta="Browse roadmaps" onClick={() => navigate('/roadmap')} />
          )}
        </section>
      </div>
    </div>
  );
};

const Metric = ({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) => (
  <div className="min-h-32 rounded-[4px] border border-foreground bg-background p-4">
    <Icon className="h-5 w-5 text-primary" />
    <p className="mt-4 font-mono text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
    <p className="mt-1 break-words font-mono text-2xl font-extrabold uppercase">{value}</p>
  </div>
);

const SkillColumn = ({
  title,
  items,
  empty,
  tone
}: {
  title: string;
  items: SkillItem[];
  empty: string;
  tone: 'success' | 'progress' | 'missing' | 'recommended';
}) => {
  const Icon = tone === 'success' ? BadgeCheck : tone === 'missing' ? Circle : CheckCircle2;
  const toneClass =
    tone === 'success'
      ? 'bg-primary text-primary-foreground'
      : tone === 'missing'
        ? 'bg-muted text-foreground'
        : 'bg-background text-foreground';

  return (
    <div className="rounded-[4px] border border-foreground bg-background p-4">
      <h3 className="mb-3 font-mono text-xs font-extrabold uppercase">{title}</h3>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${title}-${item.id}`}
              className={`inline-flex max-w-full items-center gap-1.5 rounded-[2px] border border-foreground px-2.5 py-1 font-mono text-[10px] font-bold uppercase leading-4 ${toneClass}`}
              title={item.reason}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="min-w-0 break-words">{item.title}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
};

const EmptyState = ({
  title,
  body,
  cta,
  onClick
}: {
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) => (
  <div className="rounded-[4px] border border-dashed border-foreground bg-muted/40 p-5">
    <p className="font-mono text-sm font-extrabold uppercase">{title}</p>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    <button
      onClick={onClick}
      className="mt-4 inline-flex items-center gap-2 rounded-[2px] border-2 border-foreground bg-primary px-3 py-2 font-mono text-xs font-bold uppercase text-primary-foreground"
    >
      {cta} <ArrowRight className="h-3.5 w-3.5" />
    </button>
  </div>
);

export default DashboardPage;
