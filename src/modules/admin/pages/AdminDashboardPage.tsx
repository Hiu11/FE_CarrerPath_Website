import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminStatsApi } from '../api/admin-stats.api';
import type { AdminStatsResponse } from '../api/admin-stats.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, Users, ArrowLeft, Route, BookOpen, FileText } from 'lucide-react';

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

        <Card className="animate-pulse p-6 border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] h-[350px]">
          <div className="h-6 bg-muted rounded w-1/4 mb-6"></div>
          <div className="h-full bg-muted/50 rounded w-full"></div>
        </Card>
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold uppercase tracking-wider">Dashboard Analytics</h1>
          <p className="text-sm text-muted-foreground font-mono">Overview of system analytics and user distributions.</p>
        </div>
        <Button
          onClick={() => navigate('/dashboard')}
          className="font-mono text-xs uppercase tracking-wider border-2 border-foreground rounded-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(250,250,250,0.15)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all bg-background text-foreground hover:bg-muted"
          size="sm"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Main Site
        </Button>
      </div>

      {/* Widgets/Cards: System Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Users */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Total Users</CardTitle>
            <Users className="size-5 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.totalUsers || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">Registered learner accounts</p>
          </CardContent>
        </Card>

        {/* Card 2: Total Careers */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Total Careers</CardTitle>
            <Route className="size-5 text-blue-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.totalCareers || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">Active career paths</p>
          </CardContent>
        </Card>

        {/* Card 3: Total Skills */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Total Skills</CardTitle>
            <BookOpen className="size-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.totalSkills || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">Skills in the library</p>
          </CardContent>
        </Card>

        {/* Card 4: Total Resources */}
        <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Total Resources</CardTitle>
            <FileText className="size-5 text-rose-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-4xl font-mono font-bold text-foreground">
              {stats?.totalResources || 0}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-1">Learning resources attached</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Card */}
      <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
        <CardHeader className="p-0 pb-4 border-b border-foreground/10 mb-6">
          <CardTitle className="text-lg font-mono font-bold uppercase tracking-wider">User Distribution by Career Path</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {distributionData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-[4px]">
              <p className="text-sm text-muted-foreground font-mono">No active learner data available.</p>
            </div>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#71717a"
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    dy={10}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={11}
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Bar dataKey="value" maxBarSize={60} radius={[4, 4, 0, 0]}>
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
