import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, HelpCircle, LogOut, LayoutDashboard, Route, ShieldAlert, ArrowLeft, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { tokenStore } from '@/modules/auth/store/token.store';
import { authApi } from '@/modules/auth/api/auth.api';
import { ThemeToggle } from '@/shared/components/ui/theme-toggle';
import { progressApi } from '../api/progress.api';
import { roadmapApi } from '../api/roadmap.api';
import { RoadmapTimeline } from '../components/RoadmapTimeline';
import { ResourceCard } from '../components/ResourceCard';
import type { CareerPath } from '../types';
import type { CurrentUser } from '@/modules/auth/types/auth.types';

const guestPreviewCompletedNodes = [
  'frontend-1-internet-web-protocols',
  'frontend-2-html-css-layout-architecture',
  'backend-1-javascript-runtime-node-js',
  'devops-1-linux-systems-shell-scripting'
];

const getStoredCompletedNodes = (careerId: string, isSignedIn: boolean) => {
  if (!isSignedIn) {
    return guestPreviewCompletedNodes;
  }

  const stored = localStorage.getItem(`roadmap_progress_${careerId}`);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const RoadmapDetailPage = () => {
  const { careerId = '' } = useParams();
  const navigate = useNavigate();
  const [career, setCareer] = useState<CareerPath | null>(null);
  const [completedProgress, setCompletedProgress] = useState<{ careerId: string; nodes: string[] } | null>(null);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [loadedCareerId, setLoadedCareerId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'skills'>('roadmap');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'journey' | 'overview'>('journey');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const isSignedIn = Boolean(tokenStore.get());

  const mockDashboardData = {
    overallCompletion: 45,
    careerPaths: [
      { careerTitle: 'Frontend', percentage: 75, completedCount: 3, totalCount: 4, isEnrolled: true },
      { careerTitle: 'Backend', percentage: 15, completedCount: 1, totalCount: 8, isEnrolled: true },
      { careerTitle: 'DevOps', percentage: 0, completedCount: 0, totalCount: 6, isEnrolled: false }
    ],
    history: [
      { date: 'Mon', completedCount: 1 },
      { date: 'Tue', completedCount: 2 },
      { date: 'Wed', completedCount: 2 },
      { date: 'Thu', completedCount: 3 },
      { date: 'Fri', completedCount: 4 }
    ],
    inProgressItems: [
      { careerId: 'frontend', careerTitle: 'Frontend Developer', stepId: 'fe-html-css', title: 'HTML & CSS Layout Architecture', description: 'Construct pages using semantic tags and style them using modern layout engines like Grid and Flexbox.', progressPercentage: 75 },
    ],
    latestUpload: null
  };

  useEffect(() => {
    if (isSignedIn) {
      setLoadingDashboard(true);
      progressApi.getDashboard()
        .then((res) => {
          if (res.data?.success) {
            setDashboardData(res.data.data);
          }
        })
        .catch(() => {
          // Ignore
        })
        .finally(() => {
          setLoadingDashboard(false);
        });
    }
  }, [isSignedIn]);
  const isLoading = loadedCareerId !== careerId;

  useEffect(() => {
    const token = tokenStore.get();
    if (token) {
      authApi.getMe()
        .then((res) => {
          if (res?.data) {
            setUser(res.data as CurrentUser);
          }
        })
        .catch(() => {
          tokenStore.clear();
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    roadmapApi.getByCareerId(careerId)
      .then((res) => {
        if (ignore) {
          return;
        }

        setCareer(res.data);
        setExpandedNode(res.data.roadmapSteps[0]?.id ?? null);
        setError('');
      })
      .catch((err) => {
        if (ignore) {
          return;
        }

        setCareer(null);
        setError(err?.response?.data?.message ?? 'Unable to load roadmap.');
      })
      .finally(() => {
        if (!ignore) {
          setLoadedCareerId(careerId);
        }
      });

    return () => {
      ignore = true;
    };
  }, [careerId]);

  useEffect(() => {
    if (!career || !isSignedIn) {
      return;
    }

    let ignore = false;

    progressApi.getDashboard()
      .then((res) => {
        if (ignore || !res.data?.success) {
          return;
        }

        const progress = res.data.data.careerPaths.find(
          (item: { careerId: string; completedSteps?: string[] }) => item.careerId === career.id
        );
        const nodes = Array.isArray(progress?.completedSteps) ? progress.completedSteps : [];
        setCompletedProgress({ careerId: career.id, nodes });
        localStorage.setItem(`roadmap_progress_${career.id}`, JSON.stringify(nodes));
      })
      .catch(() => {
        setCompletedProgress({ careerId: career.id, nodes: getStoredCompletedNodes(career.id, isSignedIn) });
      });

    return () => {
      ignore = true;
    };
  }, [career, isSignedIn]);

  const completedNodes = useMemo(() => {
    if (!career) {
      return [];
    }

    if (completedProgress?.careerId === career.id) {
      return completedProgress.nodes;
    }

    return getStoredCompletedNodes(career.id, isSignedIn);
  }, [career, completedProgress, isSignedIn]);

  const progressPercentage = useMemo(() => {
    if (!career || career.roadmapSteps.length === 0) {
      return 0;
    }

    const validNodeIds = new Set(career.roadmapSteps.map((step) => step.id));
    const completedCount = completedNodes.filter((id) => validNodeIds.has(id)).length;
    return Math.round((completedCount / career.roadmapSteps.length) * 100);
  }, [career, completedNodes]);

  const stagesChartData = useMemo(() => {
    if (!career) return [];
    return career.roadmapSteps.map((step) => {
      const isCompleted = completedNodes.includes(step.id);
      return {
        name: step.title.length > 12 ? `${step.title.slice(0, 12)}...` : step.title,
        status: isCompleted ? 100 : 0,
        fullName: step.title
      };
    });
  }, [career, completedNodes]);

  const subjectInProgressItems = useMemo(() => {
    if (!career) return [];
    const rawItems = isSignedIn ? dashboardData?.inProgressItems ?? [] : mockDashboardData.inProgressItems;
    return rawItems.filter((item: any) => 
      item.careerId === career.id || 
      item.careerTitle.toLowerCase().includes(career.careerTitle.split(' ')[0].toLowerCase())
    );
  }, [career, dashboardData, isSignedIn]);

  const toggleNodeCompletion = async (id: string, e: React.MouseEvent) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (!isSignedIn) {
      toast.info('Sign in to track, save, and update your career roadmap progress!');
      return;
    }

    if (!career) {
      return;
    }

    const previousNodes = completedNodes;
    const updated = completedNodes.includes(id)
      ? completedNodes.filter((item) => item !== id)
      : [...completedNodes, id];

    setCompletedProgress({ careerId: career.id, nodes: updated });
    localStorage.setItem(`roadmap_progress_${career.id}`, JSON.stringify(updated));

    try {
      await progressApi.toggleStep({ careerId: career.id, stepId: id });
      toast.success(completedNodes.includes(id) ? 'Skill marked as incomplete.' : 'Skill marked as completed.');
    } catch (err) {
      setCompletedProgress({ careerId: career.id, nodes: previousNodes });
      localStorage.setItem(`roadmap_progress_${career.id}`, JSON.stringify(previousNodes));
      toast.error('Failed to sync progress. Your change has been rolled back.');
    }
  };

  const handleLogout = () => {
    tokenStore.clear();
    setUser(null);
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="flex items-center gap-3 border-2 border-foreground bg-card text-card-foreground px-6 py-4 font-mono text-sm uppercase tracking-wider rounded-[2px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)]">
          <Loader2 className="size-5 animate-spin text-primary" />
          Loading roadmap
        </div>
      </div>
    );
  }

  if (error || !career) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-4">
        <div className="mx-auto max-w-2xl w-full border-2 border-foreground bg-card p-8 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] text-center space-y-6">
          <p className="font-mono text-sm font-bold uppercase text-destructive">{error || 'Roadmap not found.'}</p>
          <button
            onClick={() => navigate('/roadmap')}
            className="border-2 border-foreground bg-primary text-primary-foreground px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Back to Roadmaps
          </button>
        </div>
      </div>
    );
  }

  const userDisplayName = user ? (user.email.split('@')[0]) : 'Alex Rivers';
  const userInitials = userDisplayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans antialiased">
      {/* LEFT SIDEBAR (Desktop) */}
      <aside className="w-64 bg-card border-r-2 border-foreground flex flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen p-6">
        <div className="space-y-8">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 text-sm font-extrabold tracking-wider uppercase hover:opacity-90 transition-opacity">
            <span className="bg-primary text-primary-foreground px-2 py-1 border border-foreground rounded-[2px] font-mono">
              PATH
            </span>
            <span className="font-mono text-foreground">roadmap.dev</span>
          </Link>

          {/* User Profile Info Card */}
          <div className="flex items-center gap-3 p-3 bg-muted border-2 border-foreground rounded-[2px]">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={userDisplayName} className="size-10 rounded-full object-cover border border-foreground" />
            ) : (
              <div className="size-10 rounded-full bg-primary text-primary-foreground font-mono font-bold text-sm flex items-center justify-center border border-foreground">
                {userInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-foreground truncate">{userDisplayName}</h4>
              <p className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-tight mt-0.5 truncate">
                {career.careerTitle.split(' ')[0]} Path • {progressPercentage}%
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveSidebarTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all cursor-pointer rounded-[2px] ${
                activeSidebarTab === 'overview'
                  ? 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(250,250,250,0.15)] font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-muted'
              }`}
            >
              <LayoutDashboard className="size-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveSidebarTab('journey')}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all cursor-pointer rounded-[2px] ${
                activeSidebarTab === 'journey'
                  ? 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(250,250,250,0.15)] font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-muted'
              }`}
            >
              <Route className="size-4" />
              My Journey
            </button>
          </nav>
        </div>

        {/* Bottom Sidebar area */}
        <div className="space-y-4 pt-6 border-t-2 border-dashed border-foreground">
          <div className="space-y-1">
            <Link
              to="/contact"
              className="flex items-center gap-3 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:bg-muted rounded-[2px] text-muted-foreground hover:text-foreground transition-all"
            >
              <HelpCircle className="size-4 text-foreground" />
              Help
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:bg-destructive/10 rounded-[2px] text-muted-foreground hover:text-destructive transition-all text-left"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWERS */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <aside className="w-64 bg-card border-r-2 border-foreground h-full flex flex-col justify-between p-6 animate-slideIn text-foreground">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 text-sm font-extrabold tracking-wider uppercase hover:opacity-90">
                  <span className="bg-primary text-primary-foreground px-2 py-1 border border-foreground rounded-[2px] font-mono">PATH</span>
                  <span className="font-mono text-foreground">roadmap.dev</span>
                </Link>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="text-foreground hover:opacity-80 p-1 border border-foreground rounded-[2px]">
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted border-2 border-foreground rounded-[2px]">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={userDisplayName} className="size-10 rounded-full object-cover border border-foreground" />
                ) : (
                  <div className="size-10 rounded-full bg-primary text-primary-foreground font-mono font-bold text-sm flex items-center justify-center border border-foreground">
                    {userInitials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-foreground truncate">{userDisplayName}</h4>
                  <p className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-tight mt-0.5 truncate">
                    {career.careerTitle.split(' ')[0]} Path • {progressPercentage}%
                  </p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    setActiveSidebarTab('overview');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all cursor-pointer rounded-[2px] text-left ${
                    activeSidebarTab === 'overview'
                      ? 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'border-transparent text-muted-foreground'
                  }`}
                >
                  <LayoutDashboard className="size-4" />
                  Overview
                </button>
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    setActiveSidebarTab('journey');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-2 transition-all cursor-pointer rounded-[2px] text-left ${
                    activeSidebarTab === 'journey'
                      ? 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'border-transparent text-muted-foreground'
                  }`}
                >
                  <Route className="size-4 text-primary-foreground" />
                  My Journey
                </button>
              </nav>
            </div>

            <div className="space-y-4 pt-6 border-t-2 border-dashed border-foreground">
              <div className="space-y-1">
                <Link
                  to="/contact"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:bg-muted rounded-[2px] text-muted-foreground"
                >
                  <HelpCircle className="size-4" />
                  Help
                </Link>
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:bg-destructive/10 rounded-[2px] text-muted-foreground hover:text-destructive text-left"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </div>
            </div>
          </aside>
          <div className="flex-1" onClick={() => setIsMobileSidebarOpen(false)} />
        </div>
      )}

      {/* RIGHT SIDE MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* TOP BAR NAV */}
        <header className="h-16 border-b-2 border-foreground bg-card px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden text-foreground hover:bg-muted p-1 border border-foreground rounded-[2px]">
              <Menu className="size-6" />
            </button>

            {/* Back to Careers Link */}
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to Careers
            </Link>
          </div>

          {/* Central Tab-like links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
            <button
              onClick={() => setActiveSidebarTab('overview')}
              className={`py-5 border-b-2 transition-all cursor-pointer ${
                activeSidebarTab === 'overview'
                  ? 'text-primary font-bold border-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setActiveSidebarTab('journey');
                setActiveTab('roadmap');
              }}
              className={`py-5 border-b-2 transition-all cursor-pointer ${
                activeSidebarTab === 'journey' && activeTab === 'roadmap'
                  ? 'text-primary font-bold border-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              My Roadmaps
            </button>
            <button
              onClick={() => {
                setActiveSidebarTab('journey');
                setActiveTab('skills');
              }}
              className={`py-5 border-b-2 transition-all cursor-pointer ${
                activeSidebarTab === 'journey' && activeTab === 'skills'
                  ? 'text-primary font-bold border-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Skill Library
            </button>
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/profile" className="focus:outline-none rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={userDisplayName} className="size-8 rounded-full object-cover border border-foreground" />
              ) : (
                <div className="size-8 rounded-full bg-muted border border-foreground text-foreground font-mono font-bold text-xs flex items-center justify-center">
                  {userInitials}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* MAIN BODY SCROLL AREA */}
        <main className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-8 pb-20">
          {activeSidebarTab === 'overview' ? (
            <div className="space-y-10 animate-fadeIn text-foreground">
              {/* Header Banner */}
              <section className="border-2 border-foreground p-6 bg-card text-card-foreground rounded-lg space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)]">
                <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
                  Subject Analytics
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight uppercase font-mono text-foreground">
                  {career.careerTitle} Dashboard
                </h1>
                <p className="text-sm text-muted-foreground font-sans">
                  Overview of your specific progress milestones, completed concepts, and practice timeline logs for this subject.
                </p>
              </section>

              {!isSignedIn && (
                <div className="border-2 border-primary bg-primary/10 text-primary p-4 rounded-lg font-mono text-xs uppercase tracking-wider flex flex-col sm:flex-row justify-between items-center gap-4">
                  <span>[GUEST PREVIEW] SIGN IN TO SAVE AND TRACK YOUR ANALYTICS HISTORY.</span>
                  <Link
                    to="/login"
                    className="px-4 py-2 border-2 border-primary bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity rounded-[2px] shrink-0 text-center"
                  >
                    Sign in
                  </Link>
                </div>
              )}

              {loadingDashboard ? (
                <div className="flex items-center gap-3 border-2 border-foreground bg-card text-card-foreground px-6 py-4 font-mono text-sm uppercase tracking-wider rounded-[2px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)]">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  Loading analytics dataset...
                </div>
              ) : (
                <>
                  {/* Stats Cards Grid */}
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Card 1: Subject completion progress */}
                    <div className="border-2 border-foreground bg-card p-6 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Subject Progress</span>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold font-mono text-primary">{progressPercentage}%</span>
                      </div>
                      <div className="w-full mt-4 border-2 border-foreground bg-muted h-5 rounded-[2px] overflow-hidden p-0.5">
                        <div 
                          className="bg-primary h-full transition-all duration-500 rounded-[1px]" 
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Card 2: Subject completed stages / total stages */}
                    <div className="border-2 border-foreground bg-card p-6 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Skills Mastered</span>
                      <div className="mt-4">
                        <span className="text-4xl font-extrabold font-mono text-foreground">
                          {completedNodes.length} / {career.roadmapSteps.length}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono mt-4 uppercase">Stages completed in this path</span>
                    </div>

                    {/* Card 3: Incomplete stages remaining */}
                    <div className="border-2 border-foreground bg-card p-6 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Pending Milestones</span>
                      <div className="mt-4">
                        <span className="text-4xl font-extrabold font-mono text-foreground">
                          {career.roadmapSteps.length - completedNodes.length}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono mt-4 uppercase">Incomplete stages remaining</span>
                    </div>
                  </div>

                  {/* Charts section */}
                  <div className="grid gap-8 md:grid-cols-2">
                    {/* Chart 1: BarChart for Subject stage status */}
                    <div className="border-2 border-foreground bg-card p-5 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] space-y-4">
                      <h3 className="font-mono text-sm font-bold uppercase tracking-wider border-b border-foreground/30 pb-2 text-foreground">
                        Stage Mastery Status
                      </h3>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={stagesChartData} 
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--foreground)" opacity={0.1} />
                            <XAxis dataKey="name" tick={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--foreground)' }} />
                            <YAxis unit="%" tick={{ fontFamily: 'var(--font-mono)', fontSize: 8, fill: 'var(--foreground)' }} domain={[0, 100]} />
                            <Tooltip 
                              formatter={(value: any, _name: any, props: any) => [
                                value === 100 ? 'Completed' : 'Incomplete', 
                                props.payload.fullName
                              ]}
                              contentStyle={{ 
                                fontFamily: 'var(--font-mono)', 
                                fontSize: '10px', 
                                backgroundColor: 'var(--card)',
                                color: 'var(--card-foreground)',
                                border: '2px solid var(--foreground)', 
                                borderRadius: '4px' 
                              }}
                            />
                            <Bar dataKey="status" name="Completion" fill="var(--primary)" stroke="var(--foreground)" strokeWidth={1}>
                              {stagesChartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.status === 100 ? 'var(--primary)' : 'var(--muted)'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: AreaChart for Subject trend */}
                    <div className="border-2 border-foreground bg-card p-5 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] space-y-4">
                      <h3 className="font-mono text-sm font-bold uppercase tracking-wider border-b border-foreground/30 pb-2 text-foreground">
                        {career.careerTitle} Trend
                      </h3>
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={isSignedIn 
                              ? (dashboardData?.history ?? []) 
                              : mockDashboardData.history} 
                            margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--foreground)" opacity={0.1} />
                            <XAxis dataKey="date" tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--foreground)' }} />
                            <YAxis tick={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--foreground)' }} allowDecimals={false} />
                            <Tooltip 
                              contentStyle={{ 
                                fontFamily: 'var(--font-mono)', 
                                fontSize: '11px', 
                                backgroundColor: 'var(--card)',
                                color: 'var(--card-foreground)',
                                border: '2px solid var(--foreground)', 
                                borderRadius: '4px' 
                              }} 
                              itemStyle={{ color: 'var(--card-foreground)' }}
                              labelStyle={{ color: 'var(--muted-foreground)', fontWeight: 'bold' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="completedCount" 
                              name="Completed Nodes" 
                              stroke="var(--primary)" 
                              fill="var(--primary)" 
                              fillOpacity={0.15} 
                              strokeWidth={2} 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Learning / Upload details section */}
                  <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
                    {/* Currently Learning list */}
                    <section className="border-2 border-foreground bg-card p-5 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] space-y-4">
                      <div className="flex items-center justify-between border-b border-foreground/30 pb-3">
                        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
                          Currently Learning
                        </h3>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {subjectInProgressItems.length} open lessons
                        </span>
                      </div>

                      {subjectInProgressItems.length === 0 ? (
                        <div className="border border-dashed border-foreground bg-muted p-5 text-sm text-muted-foreground rounded-lg">
                          All enrolled roadmap lessons are completed. Add another roadmap to keep learning.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {subjectInProgressItems.map((item: any) => (
                            <article
                              key={`${item.careerId}-${item.stepId}`}
                              className="border-2 border-foreground bg-background p-4 rounded-lg space-y-3"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold">
                                    {item.careerTitle}
                                  </span>
                                  <h4 className="font-mono text-sm font-extrabold uppercase tracking-tight text-foreground">
                                    {item.title}
                                  </h4>
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveSidebarTab('journey');
                                    navigate(`/roadmap/${item.careerId}`);
                                  }}
                                  className="w-fit border-2 border-foreground bg-primary px-3 py-1.5 font-mono text-[10px] font-bold uppercase text-primary-foreground rounded-[2px] cursor-pointer hover:opacity-90 transition-opacity"
                                >
                                  Continue
                                </button>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {item.description}
                              </p>
                              <div className="space-y-1">
                                <div className="flex justify-between font-mono text-[10px] font-bold uppercase text-foreground">
                                  <span>Roadmap progress</span>
                                  <span className="text-primary">{item.progressPercentage}%</span>
                                </div>
                                <div className="h-4 border-2 border-foreground bg-muted rounded-[2px] overflow-hidden p-0.5">
                                  <div
                                    className="h-full bg-primary rounded-[1px]"
                                    style={{ width: `${item.progressPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Latest Upload section */}
                    <section className="border-2 border-foreground bg-card p-5 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] space-y-4">
                      <h3 className="font-mono text-sm font-bold uppercase tracking-wider border-b border-foreground/30 pb-3 text-foreground">
                        Latest Upload
                      </h3>

                      {(isSignedIn && dashboardData?.latestUpload) ? (
                        <div className="space-y-3">
                          <span className="inline-flex w-fit border-2 border-foreground bg-primary px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-primary-foreground rounded-[2px]">
                            {dashboardData.latestUpload.type}
                          </span>
                          <h4 className="font-mono text-lg font-extrabold uppercase tracking-tight text-foreground">
                            {dashboardData.latestUpload.title}
                          </h4>
                          <p className="text-xs text-muted-foreground font-mono uppercase">
                            Uploaded {new Date(dashboardData.latestUpload.uploadedAt).toLocaleDateString()}
                          </p>
                          {dashboardData.latestUpload.url && (
                            <a
                              href={dashboardData.latestUpload.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex border-2 border-foreground bg-background px-3 py-2 font-mono text-xs font-bold uppercase rounded-[2px] hover:bg-muted text-foreground transition-colors"
                            >
                              View Upload
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="border border-dashed border-foreground/50 bg-muted/40 p-5 rounded-lg space-y-2">
                          <p className="font-mono text-xs sm:text-sm font-bold uppercase text-foreground">No uploads yet</p>
                          <p className="text-xs text-muted-foreground">
                            Certificates and project submissions will appear here after the first upload feature is connected.
                          </p>
                        </div>
                      )}
                    </section>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Tab Switcher */}
              <div className="flex lg:hidden border-2 border-foreground bg-card rounded-lg p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(250,250,250,0.15)] animate-fadeIn mb-6">
                <button
                  onClick={() => setActiveTab('roadmap')}
                  className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                    activeTab === 'roadmap'
                      ? 'bg-primary text-primary-foreground border border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      : 'text-muted-foreground'
                  }`}
                >
                  Roadmaps
                </button>
                <button
                  onClick={() => setActiveTab('skills')}
                  className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                    activeTab === 'skills'
                      ? 'bg-primary text-primary-foreground border border-foreground shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      : 'text-muted-foreground'
                  }`}
                >
                  Skill Library
                </button>
              </div>

              {/* Active Roadmap Banner Header Card */}
              <section className="border-2 border-foreground p-6 sm:p-8 bg-card text-card-foreground rounded-lg space-y-6 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] animate-fadeIn">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start relative z-10">
                  <div className="space-y-2">
                    <span className="px-3 py-1 text-[9px] font-mono font-bold tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-[2px] uppercase">
                      Active Roadmap
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono uppercase mt-2">
                      {career.careerTitle}
                    </h1>
                  </div>
                  <span className="px-3 py-1 text-[10px] font-mono font-bold text-primary-foreground bg-primary border-2 border-foreground rounded-[2px] uppercase tracking-wider shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(250,250,250,0.15)]">
                    {career.roadmapSteps.length} stages
                  </span>
                </div>

                <p className="text-sm sm:text-base text-muted-foreground font-sans max-w-3xl leading-relaxed relative z-10">
                  {career.description}
                </p>

                <div className="flex flex-wrap gap-2 relative z-10">
                  {career.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] font-mono px-3 py-1 border border-foreground bg-muted rounded-[2px] uppercase text-foreground font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="space-y-2.5 pt-4 border-t-2 border-dashed border-foreground/30 relative z-10">
                  <div className="flex justify-between items-center text-xs font-mono font-bold text-muted-foreground">
                    <span>PATH PROGRESS</span>
                    <span className="text-primary font-bold">{progressPercentage}%</span>
                  </div>
                  <div className="w-full border-2 border-foreground bg-muted h-6 flex items-center p-0.5 rounded-[2px] overflow-hidden">
                    <div
                      className="bg-primary h-full border-r-2 border-foreground transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </section>

              {/* Guest alert if not logged in */}
              {!isSignedIn && (
                <div className="border-2 border-primary bg-primary/10 text-primary p-4 rounded-lg font-mono text-xs uppercase tracking-wider flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-4 shrink-0" />
                    <span>[GUEST MODE] SIGN IN TO SAVE YOUR ROADMAP PROGRESS.</span>
                  </div>
                  <Link
                    to="/login"
                    className="px-4 py-2 border-2 border-primary bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity rounded-[2px] shrink-0 text-center"
                  >
                    Sign in
                  </Link>
                </div>
              )}

              {/* Conditional rendering based on active tab */}
              {activeTab === 'roadmap' ? (
                <RoadmapTimeline
                  career={career}
                  completedNodes={completedNodes}
                  expandedNode={expandedNode}
                  onToggleNodeCompletion={toggleNodeCompletion}
                  onToggleNodeExpand={setExpandedNode}
                />
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold font-mono tracking-wide uppercase text-foreground">
                      Skill Library
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Explore the core skills and learning documentation resources associated with this path.
                    </p>
                  </div>

                  <div className="grid gap-6">
                    {career.roadmapSteps.map((step) => (
                      <div
                        key={step.id}
                        className="border-2 border-foreground bg-card text-card-foreground p-6 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] space-y-4"
                      >
                        <div className="space-y-1">
                          <h3 className="text-base sm:text-lg font-bold font-mono tracking-wide uppercase text-primary">
                            {step.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed">
                            {step.description}
                          </p>
                        </div>

                        {step.subtopics && step.subtopics.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-muted-foreground block uppercase">
                              Topics Checklist
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {step.subtopics.map((topic) => (
                                <span
                                  key={topic}
                                  className="text-[10px] font-mono px-2.5 py-1 border-2 border-foreground bg-muted text-foreground rounded-[2px] font-semibold"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {step.externalResources && step.externalResources.length > 0 ? (
                          <div className="space-y-2 pt-3 border-t border-dashed border-foreground/30">
                            <span className="text-[9px] font-mono font-bold tracking-widest text-muted-foreground block uppercase">
                              Linked Learning Resources
                            </span>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {step.externalResources.map((res) => (
                                <ResourceCard key={res.title} resource={res} />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-dashed border-foreground/30 text-xs font-mono text-muted-foreground">
                            No resources linked for this skill.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
