import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
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
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          placeholder="Your name"
          {...register('displayName')}
        />
        {errors.displayName && (
          <p className="text-xs text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bio">Bio</Label>
          <span className="text-xs text-muted-foreground">{bioValue.length}/200</span>
        </div>
        <textarea
          id="bio"
          rows={3}
          placeholder="Tell us a little about yourself..."
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('bio')}
        />
        {errors.bio && (
          <p className="text-xs text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          placeholder="+1 555 000 0000"
          {...register('phone')}
        />
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  );
};
