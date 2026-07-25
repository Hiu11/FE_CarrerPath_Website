import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/auth.api';
import { tokenStore } from '../store/token.store';
import { OtpInput } from '@/shared/components/ui/otp-input';
import { useAuth } from '@/modules/auth/context/AuthContext';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const [step, setStep] = useState<'login' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
  });
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const onLoginSubmit = handleSubmit(async (values) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email: values.email, password: values.password });
      const token = response.data?.token as string | undefined;
      if (token) {
        tokenStore.set(token);
        await refreshUser();
        toast.success('Logged in successfully.');
        navigate('/');
        return;
      }
      setEmail(values.email);
      setStep('verify');
      if (response.data?.otp) {
        setOtp(response.data.otp);
        toast.success(`Dev OTP: ${response.data.otp}`);
      } else {
        toast.success('OTP has been sent to your email.');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; requiresOtp?: boolean; email?: string } } };
      const requiresOtp = Boolean(err?.response?.data?.requiresOtp);
      if (requiresOtp) {
        setEmail(err.response?.data?.email ?? values.email);
        setStep('verify');
        toast.info('OTP required. Check your email.');
      } else {
        toast.error(err?.response?.data?.message ?? 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  });

  const onVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const response = await authApi.verifyLoginOtp(email, otp);
      tokenStore.set(response.data.token);
      await refreshUser();
      toast.success('Logged in successfully.');
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? 'Invalid OTP');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };


  const handleThirdPartySignIn = (provider: string) => {
    toast.info(`Sign in with ${provider} is placeholder. Ready for backend integration.`);
  };

  if (step === 'verify') {
    return (
      <div className="py-10 max-w-md mx-auto">
        <div className="border-2 border-foreground bg-card text-card-foreground p-8 rounded-[4px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(250,250,250,0.15)] space-y-6">
          <div className="space-y-2 border-b-2 border-foreground pb-4 text-center">
            <h1 className="text-2xl font-black uppercase font-mono tracking-tight">Verify OTP</h1>
            <p className="text-xs text-muted-foreground font-sans">
              Enter the 6-digit code sent to <span className="font-semibold text-foreground font-mono">{email}</span>
            </p>
          </div>
          <form className="space-y-5" onSubmit={onVerifySubmit}>
            <div className="flex justify-center py-2">
              <OtpInput value={otp} onChange={setOtp} />
            </div>
            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              className="w-full py-3 border-2 border-foreground bg-primary text-primary-foreground font-mono font-bold text-sm uppercase tracking-widest transition-all duration-150 hover:opacity-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(250,250,250,1)] rounded-[2px] cursor-pointer disabled:opacity-50"
            >
              {loading ? 'VERIFYING...' : 'VERIFY AND LOGIN'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('login'); setOtp(''); }}
              className="block w-full text-center text-xs font-mono font-bold text-muted-foreground hover:text-foreground hover:underline uppercase transition-colors"
            >
              Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 max-w-md mx-auto">
      <div className="border-2 border-foreground bg-card text-card-foreground p-8 rounded-[4px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(250,250,250,0.15)] space-y-6">
        {/* Title */}
        <div className="space-y-2 border-b-2 border-foreground pb-4 text-center">
          <span className="font-mono text-[10px] font-bold bg-primary/10 text-primary border border-foreground px-2 py-0.5 rounded-[2px] uppercase tracking-widest">
            Identity Provider
          </span>
          <h1 className="text-2xl font-black uppercase font-mono tracking-tight mt-2">
            Welcome Back
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            Enter your credentials to authorize session access.
          </p>
        </div>

        {/* Credentials Form */}
        <form className="space-y-4" onSubmit={onLoginSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-mono font-bold uppercase tracking-wider block">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="NAME@EXAMPLE.COM"
              {...register('email')}
              className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm font-mono rounded-[2px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50 uppercase"
            />
            {errors.email && <p className="text-xs font-mono text-destructive uppercase">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-mono font-bold uppercase tracking-wider block">
                Password
              </label>
              <Link to="/forgot-password" className="text-[10px] font-mono text-muted-foreground hover:text-foreground hover:underline uppercase">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              placeholder="ENTER PASSWORD"
              {...register('password')}
              className="w-full border-2 border-foreground bg-background px-3 py-2 text-sm font-mono rounded-[2px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/50"
            />
            {errors.password && <p className="text-xs font-mono text-destructive uppercase">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 border-2 border-foreground bg-primary text-primary-foreground font-mono font-bold text-sm uppercase tracking-widest transition-all duration-150 hover:opacity-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(250,250,250,1)] rounded-[2px] cursor-pointer disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
          </button>
        </form>

        {/* Third Party Login Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-foreground"></div>
          <span className="flex-shrink mx-3 text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground">OR CONNECT WITH</span>
          <div className="flex-grow border-t border-foreground"></div>
        </div>

        {/* Third Party Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleThirdPartySignIn('GitHub')}
            className="py-2 border-2 border-foreground bg-background hover:bg-muted font-mono font-bold text-xs uppercase tracking-wider transition-all rounded-[2px] cursor-pointer"
          >
            GitHub
          </button>
          <button
            type="button"
            onClick={() => handleThirdPartySignIn('Google')}
            className="py-2 border-2 border-foreground bg-background hover:bg-muted font-mono font-bold text-xs uppercase tracking-wider transition-all rounded-[2px] cursor-pointer"
          >
            Google
          </button>
        </div>

        {/* Redirect */}
        <p className="text-center text-xs font-mono text-muted-foreground mt-4 uppercase">
          New developer?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
