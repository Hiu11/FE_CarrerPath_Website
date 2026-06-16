import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/modules/auth/api/auth.api';
import { tokenStore } from '@/modules/auth/store/token.store';
import { AvatarUpload } from '@/modules/profile/components/AvatarUpload';
import { ProfileEditForm } from '@/modules/profile/components/ProfileEditForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { CurrentUser } from '@/modules/auth/types/auth.types';

type ProfileUser = CurrentUser & {
  displayName?: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
};

export const ProfilePage = () => {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const navigate = useNavigate();

  const fetchUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data as ProfileUser);
    } catch {
      tokenStore.clear();
      navigate('/logout');
    }
  };

  useEffect(() => {
    void fetchUser();
  }, []);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — avatar + email */}
        <Card className="flex flex-col items-center gap-4 p-6 lg:col-span-1">
          <AvatarUpload
            currentAvatarUrl={user?.avatarUrl}
            userInitials={initials}
            onUploadSuccess={(newUrl) => setUser((prev) => prev ? { ...prev, avatarUrl: newUrl } : prev)}
          />
          <div className="text-center">
            {user?.displayName && (
              <p className="font-semibold">{user.displayName}</p>
            )}
            <p className="text-sm text-muted-foreground">{user?.email ?? '—'}</p>
          </div>
        </Card>

        {/* Right column — edit form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Edit Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <ProfileEditForm
                defaultValues={{
                  displayName: user.displayName ?? '',
                  bio: user.bio ?? '',
                  phone: user.phone ?? '',
                }}
                onSuccess={fetchUser}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
