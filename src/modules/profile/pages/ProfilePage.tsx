import { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/modules/auth/api/auth.api';
import { tokenStore } from '@/modules/auth/store/token.store';
import { AvatarUpload } from '@/modules/profile/components/AvatarUpload';
import { CvUpload } from '@/modules/profile/components/CvUpload';
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
import { progressApi } from '@/modules/roadmap/api/progress.api';
import { Badge } from '@/shared/components/ui/badge';
import careersData from '@/modules/roadmap/data/careers.json';

type ProfileUser = CurrentUser & {
  displayName?: string;
  bio?: string;
  phone?: string;
  avatarUrl?: string;
  portfolios?: PortfolioItem[];
  enableStudyReminder?: boolean;
};

export const ProfilePage = () => {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [learnedSkills, setLearnedSkills] = useState<string[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
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

  const fetchSkills = async () => {
    setLoadingSkills(true);
    try {
      const res = await progressApi.getDashboard();
      const careerPaths = res.data?.data?.careerPaths ?? [];
      const completedStepIds = new Set<string>();

      careerPaths.forEach((path: any) => {
        if (Array.isArray(path.completedSteps)) {
          path.completedSteps.forEach((stepId: string) => {
            completedStepIds.add(stepId);
          });
        }
      });

      const titles: string[] = [];
      careersData.forEach((career: any) => {
        career.roadmapSteps.forEach((step: any) => {
          if (completedStepIds.has(step.id)) {
            // Remove leading numbers (e.g. "1. Internet & Web Protocols" -> "Internet & Web Protocols")
            const cleanTitle = step.title.replace(/^\d+\.\s*/, '');
            if (!titles.includes(cleanTitle)) {
              titles.push(cleanTitle);
            }
          }
        });
      });

      setLearnedSkills(titles);
    } catch (err) {
      console.error('Failed to fetch user completed skills:', err);
    } finally {
      setLoadingSkills(false);
    }
  };

  useEffect(() => {
    void fetchUser();
    void fetchSkills();
  }, []);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-mono font-bold uppercase tracking-wider">Profile</h1>
        <p className="text-sm text-muted-foreground font-mono">Manage your personal information.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Avatar & Skills Mastered */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="flex flex-col items-center gap-4 p-6 border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
            <AvatarUpload
              currentAvatarUrl={user?.avatarUrl}
              userInitials={initials}
              onUploadSuccess={(newUrl) => setUser((prev) => prev ? { ...prev, avatarUrl: newUrl } : prev)}
            />
            <div className="text-center">
              {user?.displayName && (
                <p className="font-semibold text-lg font-mono">{user.displayName}</p>
              )}
              <p className="text-sm text-muted-foreground font-mono">{user?.email ?? '-'}</p>
            </div>
          </Card>

          <CvUpload
            currentCvUrl={user?.cvUrl}
            currentCvName={user?.cvName}
            onUploadSuccess={(url, name) => setUser((prev) => prev ? { ...prev, cvUrl: url, cvName: name } : prev)}
            onDeleteSuccess={() => setUser((prev) => prev ? { ...prev, cvUrl: undefined, cvName: undefined } : prev)}
          />

          <Card className="p-6 border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
            <CardHeader className="p-0 pb-4 border-b border-foreground/10 mb-4">
              <CardTitle className="text-md font-mono font-bold uppercase tracking-wider">Skills Mastered</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSkills ? (
                <p className="text-sm text-muted-foreground font-mono">Loading skills...</p>
              ) : learnedSkills.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-normal">
                    You haven't completed any roadmap steps yet. Start learning to master skills!
                  </p>
                  <Button
                    onClick={() => navigate('/roadmap')}
                    className="w-full font-mono text-xs uppercase tracking-wider border-2 border-foreground rounded-[2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(250,250,250,0.15)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all bg-background text-foreground hover:bg-muted"
                    size="sm"
                  >
                    Go to Roadmaps
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {learnedSkills.map((skill) => (
                    <Badge
                      key={skill}
                      className="border-2 border-foreground rounded-[2px] text-xs px-2.5 py-1 font-mono uppercase bg-muted text-foreground cursor-default shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(250,250,250,0.15)]"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Profile */}
        <div className="lg:col-span-2">
          <Card className="border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] h-full flex flex-col">
            <CardHeader className="border-b border-foreground/15 pb-4 mb-4">
              <CardTitle className="text-lg font-mono font-bold uppercase tracking-wider">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {user ? (
                <ProfileEditForm
                  defaultValues={{
                    displayName: user.displayName ?? '',
                    bio: user.bio ?? '',
                    phone: user.phone ?? '',
                    enableStudyReminder: user.enableStudyReminder ?? false,
                  }}
                  onSuccess={fetchUser}
                />
              ) : (
                <p className="text-sm text-muted-foreground font-mono">Loading...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Projects & Certificates (Full width below) */}
      <Card className="border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-foreground/15 pb-4 mb-4">
          <CardTitle className="text-lg font-mono font-bold uppercase tracking-wider">Projects & Certificates</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="sm" aria-label="How to use Projects & Certificates" className="border-2 border-foreground rounded-[2px] hover:bg-muted">
                <HelpCircle className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl border-2 border-foreground bg-card text-card-foreground rounded-[4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)]">
              <DialogHeader className="border-b border-foreground/10 pb-2 mb-4">
                <DialogTitle className="font-mono font-bold uppercase tracking-wider">Projects & Certificates Guide</DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  Add project links or certificate files to show proof of your skills in your profile.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm leading-6">
                <section className="space-y-2 border-b border-dashed border-foreground/20 pb-4">
                  <h3 className="font-mono font-bold uppercase text-xs">How to add an item</h3>
                  <ol className="list-decimal space-y-1 pl-5 text-muted-foreground font-mono text-xs">
                    <li>Enter a title, such as React Portfolio or TOEIC Certificate.</li>
                    <li>Add a GitHub/live demo URL, upload a certificate file, or provide both.</li>
                    <li>Click the plus button to save it to your profile.</li>
                  </ol>
                </section>

                <section className="space-y-2 border-b border-dashed border-foreground/20 pb-4">
                  <h3 className="font-mono font-bold uppercase text-xs">After saving</h3>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground font-mono text-xs">
                    <li>Use Project link to open the submitted URL.</li>
                    <li>Click the uploaded file name to view the image or PDF.</li>
                    <li>Use the trash button to remove an item from your profile.</li>
                  </ul>
                </section>

                <section className="space-y-2 pb-2">
                  <h3 className="font-mono font-bold uppercase text-xs">File rules</h3>
                  <ul className="list-disc space-y-1 pl-5 text-muted-foreground font-mono text-xs">
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
            <p className="text-sm text-muted-foreground font-mono">Loading...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
