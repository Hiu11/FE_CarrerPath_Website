import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { profileApi } from '@/modules/profile/api/profile.api';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

const schema = z.object({
  displayName: z.string().max(60, 'Max 60 characters').optional(),
  bio: z.string().max(200, 'Max 200 characters').optional(),
  phone: z.string().max(20, 'Max 20 characters').optional(),
});

type FormValues = z.infer<typeof schema>;

interface ProfileEditFormProps {
  defaultValues: FormValues;
  onSuccess: () => void;
}

export const ProfileEditForm = ({ defaultValues, onSuccess }: ProfileEditFormProps) => {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const bioValue = watch('bio') ?? '';

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      await profileApi.updateProfile(values);
      toast.success('Profile updated successfully.');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="displayName" className="font-mono text-xs uppercase tracking-wider">Display Name</Label>
        <Input
          id="displayName"
          placeholder="Your name"
          className="border-2 border-foreground bg-background rounded-[2px] font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
          {...register('displayName')}
        />
        {errors.displayName && (
          <p className="text-xs text-destructive font-mono">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bio" className="font-mono text-xs uppercase tracking-wider">Bio</Label>
          <span className="text-xs text-muted-foreground font-mono">{bioValue.length}/200</span>
        </div>
        <textarea
          id="bio"
          rows={3}
          placeholder="Tell us a little about yourself..."
          className="w-full resize-none rounded-[2px] border-2 border-foreground bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-mono focus-visible:border-primary"
          {...register('bio')}
        />
        {errors.bio && (
          <p className="text-xs text-destructive font-mono">{errors.bio.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="font-mono text-xs uppercase tracking-wider">Phone</Label>
        <Input
          id="phone"
          placeholder="+1 555 000 0000"
          className="border-2 border-foreground bg-background rounded-[2px] font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary"
          {...register('phone')}
        />
        {errors.phone && (
          <p className="text-xs text-destructive font-mono">{errors.phone.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full py-3 bg-primary text-primary-foreground font-mono font-bold text-xs uppercase tracking-wider border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(250,250,250,0.15)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0px] active:translate-y-[0px] active:shadow-none transition-all rounded-[2px] cursor-pointer"
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Saving…
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  );
};
