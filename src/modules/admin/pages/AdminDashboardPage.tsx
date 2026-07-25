import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminStatsApi } from '../api/admin-stats.api';
import type { AdminStatsResponse } from '../api/admin-stats.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  AlertCircle, Users, ArrowLeft, Route, BookOpen, FileText, 
  Sparkles, CheckCircle, Percent, Plus, ShieldCheck, Play
} from 'lucide-react';

const COLORS = ['#eab308', '#3b82f6', '#10b981', '#f43f5e', '#a855f7', '#6366f1'];

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminStatsApi.getStats();
        setStats(response.data);
      } catch (err: any) {
        console.error('Failed to load dashboard stats:', err);
        setError(err?.response?.data?.message || 'Failed to connect to stats API. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-wider">Dashboard Analytics</h1>
          <p className="text-sm text-muted-foreground font-mono">Overview of system analytics and user distributions.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse p-6 border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
              <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-wider">Dashboard Analytics</h1>
          <p className="text-sm text-muted-foreground font-mono">Overview of system analytics and user distributions.</p>
        </div>

        <div className="flex items-center gap-3 p-4 border-2 border-destructive bg-destructive/10 text-destructive rounded-[4px] font-mono text-sm">
          <AlertCircle className="size-5 shrink-0" />
          <div>
            <p className="font-bold">Error Loading Data</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const distributionData = stats?.careerDistribution || [];

  return (
    <div className="p-6 space-y-8 text-foreground">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-mono font-extrabold uppercase tracking-tight">System Control Panel</h1>
          <p className="text-sm text-muted-foreground font-mono">Overview of system statistics, user analytics, and publishing statuses.</p>
        </div>
        <Button
          onClick={() => navigate('/roadmap')}
          className="font-mono text-xs uppercase tracking-wider border-2 border-foreground rounded-[2px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all bg-background text-foreground hover:bg-muted font-bold cursor-pointer"
          size="sm"
        >
          <ArrowLeft className="size-4 mr-2" />
          View Public Roadmaps
        </Button>
      </div>

      {/* Quick Actions Panel */}
      <section className="bg-card border-2 border-foreground p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] space-y-4">
        <h3 className="font-mono text-sm font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
          <Sparkles className="size-4" /> Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/career-paths/new')}
            className="p-4 border-2 border-foreground bg-primary hover:opacity-90 text-primary-foreground text-xs font-mono font-extrabold uppercase rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
          >
            <Plus className="size-5" />
            Create Career Path
          </button>
          <button
            onClick={() => navigate('/admin/skills')}
            className="p-4 border-2 border-foreground bg-background hover:bg-muted text-foreground text-xs font-mono font-extrabold uppercase rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
          >
            <BookOpen className="size-5 text-blue-500" />
            Manage Skills
          </button>
          <button
            onClick={() => navigate('/admin/resources')}
            className="p-4 border-2 border-foreground bg-background hover:bg-muted text-foreground text-xs font-mono font-extrabold uppercase rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
          >
            <FileText className="size-5 text-rose-500" />
            Manage Resources
          </button>
          <button
            onClick={() => navigate('/admin/demo-studio')}
            className="p-4 border-2 border-foreground bg-amber-500 hover:opacity-90 text-black text-xs font-mono font-extrabold uppercase rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
          >
            <Play className="size-5" />
            Open Demo Studio
          </button>
        </div>
      </section>

      {/* Main Metrics Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Users & Active Users */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">User Activity</CardTitle>
            <Users className="size-5 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase font-bold">
              Active (30d): <span className="text-primary">{stats?.activeUsers || 0}</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Users with Goals */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Goal Enrollees</CardTitle>
            <CheckCircle className="size-5 text-blue-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.usersWithGoal || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase font-bold">
              Learners with target goals
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Users with CV/Portfolio */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Uploaded Materials</CardTitle>
            <FileText className="size-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.usersWithCvOrPortfolio || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase font-bold">
              Learners with CV / Portfolios
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Roadmap Completion & Quiz Pass Rate */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Performance rates</CardTitle>
            <Percent className="size-5 text-rose-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-mono font-extrabold text-foreground">
              {stats?.averageRoadmapCompletion || 0}% / {stats?.quizPassRate || 0}%
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase font-bold">
              Avg Completion / Quiz Pass Rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 5: Career Paths (Published / Draft) */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Career Paths</CardTitle>
            <Route className="size-5 text-indigo-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.totalCareerPaths || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase font-bold">
              Published: <span className="text-emerald-500">{stats?.publishedPaths || 0}</span> | Drafts: <span className="text-amber-500">{stats?.draftPaths || 0}</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 6: Total Skills */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Global Skills</CardTitle>
            <BookOpen className="size-5 text-cyan-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.totalSkills || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase font-bold">
              Registered skills in catalog
            </p>
          </CardContent>
        </Card>

        {/* Card 7: Total Resources */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Learning Materials</CardTitle>
            <FileText className="size-5 text-purple-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.totalResources || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase font-bold">
              Global external learning files
            </p>
          </CardContent>
        </Card>

        {/* Card 8: Total Quiz Attempts */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] flex flex-col justify-between">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Quiz Attempts</CardTitle>
            <ShieldCheck className="size-5 text-amber-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.totalQuizAttempts || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-2 uppercase font-bold">
              Total test submissions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution Chart */}
      <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
        <CardHeader className="p-0 pb-4 border-b-2 border-foreground/10 mb-6">
          <CardTitle className="text-lg font-mono font-bold uppercase tracking-wider">User Distribution by Career Path</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {distributionData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center border border-dashed border-foreground/30 rounded-[4px]">
              <p className="text-sm text-muted-foreground font-mono uppercase">No active enrollment data found.</p>
            </div>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="currentColor"
                    fontSize={10}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="currentColor"
                    fontSize={10}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      color: 'var(--card-foreground)',
                      borderColor: 'var(--foreground)',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Bar dataKey="value" maxBarSize={60} radius={[2, 2, 0, 0]}>
                    {distributionData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
