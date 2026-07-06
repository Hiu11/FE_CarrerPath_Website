import { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/modules/auth/api/auth.api';
import { tokenStore } from '@/modules/auth/store/token.store';
import { AvatarUpload } from '@/modules/profile/components/AvatarUpload';
import { PortfolioManager } from '@/modules/profile/components/PortfolioManager';
import { ProfileEditForm } from '@/modules/profile/components/ProfileEditForm';
import type { PortfolioItem } from '@/modules/profile/api/profile.api';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import type { CurrentUser } from '@/modules/auth/types/auth.types';

type ProfileUser = CurrentUser & {
  displayName?: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
  portfolios?: PortfolioItem[];
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
            <p className="text-sm text-muted-foreground">{user?.email ?? '-'}</p>
          </div>
        </Card>

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
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Projects & Certificates</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" aria-label="How to use Projects & Certificates">
                <HelpCircle className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Projects & Certificates</DialogTitle>
                <DialogDescription>
                  Add project links or certificate files to show proof of your skills in your profile.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm leading-6">
                <section className="space-y-2">
                  <h3 className="font-semibold">How to add an item</h3>
                  <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                    <li>Enter a title, such as React Portfolio or TOEIC Certificate.</li>
                    <li>Add a GitHub/live demo URL, upload a certificate file, or provide both.</li>
                    <li>Click the plus button to save it to your profile.</li>
                  </ol>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold">After saving</h3>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>Use Project link to open the submitted URL.</li>
                    <li>Click the uploaded file name to view the image or PDF.</li>
                    <li>Use the trash button to remove an item from your profile.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="font-semibold">File rules</h3>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>Supported files: JPG, PNG, WebP, GIF, PDF.</li>
                    <li>Maximum file size: 10MB.</li>
                    <li>Each item needs a title and at least one URL or uploaded file.</li>
                  </ul>
                </section>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {user ? (
            <PortfolioManager items={user.portfolios ?? []} onChange={fetchUser} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
