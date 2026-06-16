import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Upload, Settings } from 'lucide-react';
import { authApi } from '@/modules/auth/api/auth.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { CurrentUser } from '@/modules/auth/types/auth.types';

const quickActions = [
  {
    title: 'Edit Profile',
    description: 'Update your display name, bio, and phone number.',
    icon: User,
    to: '/profile',
  },
  {
    title: 'Upload Avatar',
    description: 'Set a profile picture to personalize your account.',
    icon: Upload,
    to: '/profile',
  },
  {
    title: 'Account Settings',
    description: 'Manage your account preferences and security.',
    icon: Settings,
    to: '/profile',
  },
];

export const HomePage = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    authApi.getMe()
      .then((res) => setUser(res.data as CurrentUser))
      .catch(() => {});
  }, []);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <section className="rounded-2xl border bg-card p-8">
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h1 className="mt-1 text-3xl font-bold">
          Welcome back, <span className="text-primary">{displayName}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile and account settings from here.
        </p>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.to} className="group block">
              <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-card/80">
                <CardHeader className="pb-3">
                  <div className="mb-2 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <action.icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{action.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
