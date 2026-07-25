import { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, PlayCircle, RotateCcw, 
  Copy, Check, BookOpen, AlertCircle, Terminal, Info, Users
} from 'lucide-react';
import { demoStudioApi, type DemoReadinessStatus } from '../api/demo-studio.api';
import { toast } from 'sonner';

export const AdminDemoStudioPage = () => {
  const [status, setStatus] = useState<DemoReadinessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<'admin' | 'learner' | null>(null);

  // Confirm Modals state
  const [confirmModal, setConfirmModal] = useState<'seed' | 'reset' | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await demoStudioApi.getStatus();
      setStatus(res.data);
    } catch (err) {
      toast.error('Failed to load Demo Readiness status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopy = (text: string, type: 'admin' | 'learner') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSeed = async () => {
    setActionLoading(true);
    setConfirmModal(null);
    try {
      await demoStudioApi.seed();
      toast.success('Demo Studio initialized successfully with clean IT datasets!');
      await fetchStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to seed demo data');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    setActionLoading(true);
    setConfirmModal(null);
    try {
      await demoStudioApi.reset();
      toast.success('Demo progress, history, and profile values have been safe reset.');
      await fetchStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset demo data');
    } finally {
      setActionLoading(false);
    }
  };

  const checklistItems = [
    {
      key: 'adminExists',
      label: 'Admin Account Exists',
      desc: 'admin@demo.com with Admin role is registered',
      status: status?.adminExists
    },
    {
      key: 'learnerExists',
      label: 'Learner Account Exists',
      desc: 'learner@demo.com with User role is registered',
      status: status?.learnerExists
    },
    {
      key: 'enrollmentsExist',
      label: 'Learner Enrolled in Roadmaps',
      desc: 'Demo learner has active progress enrollment',
      status: status?.enrollmentsExist
    },
    {
      key: 'progressTargetReached',
      label: 'Progress between 40% - 60%',
      desc: 'At least one roadmap enrollment has 40-60% completion',
      status: status?.progressTargetReached
    },
    {
      key: 'quizHistoryExists',
      label: 'Quiz History contains Pass & Fail',
      desc: 'Learner test history contains both passed (>=80%) and failed tests',
      status: status?.quizHistoryExists
    },
    {
      key: 'cvUploaded',
      label: 'CV Document Uploaded',
      desc: 'Demo learner has a verified CV file link attached',
      status: status?.cvUploaded
    },
    {
      key: 'portfolioProjectExists',
      label: 'Portfolio Project Created',
      desc: 'Learner profile has at least one portfolio showcase project',
      status: status?.portfolioProjectExists
    }
  ];

  const allReady = status && Object.values(status).every(v => v === true);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 text-foreground font-mono">
      {/* Header Banner */}
      <div className="bg-card border-2 border-foreground p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="bg-primary text-primary-foreground px-2 py-0.5 border border-foreground text-[10px] font-bold rounded uppercase tracking-wider">
            Control Room
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight uppercase">Demo Studio</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Verify demo variables, seed clean industry standard dataset, bypass OTP login, and run product simulations.
          </p>
        </div>
        
        {/* Main controls */}
        <div className="flex gap-3 self-start md:self-center shrink-0">
          <button
            onClick={() => setConfirmModal('seed')}
            disabled={actionLoading || loading}
            className="px-4 py-2 border-2 border-foreground bg-amber-500 hover:opacity-90 text-black text-xs font-extrabold uppercase rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" /> Seed Demo
          </button>
          <button
            onClick={() => setConfirmModal('reset')}
            disabled={actionLoading || loading}
            className="px-4 py-2 border-2 border-foreground bg-rose-500 hover:opacity-90 text-white text-xs font-extrabold uppercase rounded shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" /> Safe Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Readiness Checklist */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-card border-2 border-foreground p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" /> Readiness Checklist
              </h2>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                allReady 
                  ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
              }`}>
                {allReady ? 'DEMO READY' : 'DATA RE-SEED SUGGESTED'}
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-xs text-muted-foreground uppercase font-bold">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                Checking readiness...
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {checklistItems.map((item) => (
                  <div key={item.key} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground uppercase">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground font-sans font-medium">{item.desc}</p>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      {item.status ? (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[9px] font-bold uppercase">
                          <ShieldCheck className="w-3.5 h-3.5" /> Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded text-[9px] font-bold uppercase">
                          <AlertTriangle className="w-3.5 h-3.5" /> Not Ready
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Credentials Viewer Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learner Card */}
            <article className="border-2 border-foreground bg-card p-5 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] space-y-3">
              <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Learner Account
              </h3>
              <div className="text-[10px] bg-background border border-border p-3 rounded space-y-1.5">
                <div>
                  <span className="text-muted-foreground block text-[8px]">EMAIL</span>
                  <span className="text-foreground font-bold">learner@demo.com</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[8px]">PASSWORD</span>
                  <span className="text-foreground font-bold">Password123</span>
                </div>
              </div>
              <button
                onClick={() => handleCopy('learner@demo.com Password123', 'learner')}
                className="w-full py-2 border border-foreground bg-background hover:bg-muted text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedText === 'learner' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Credentials
                  </>
                )}
              </button>
            </article>

            {/* Admin Card */}
            <article className="border-2 border-foreground bg-card p-5 rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(250,250,250,0.15)] space-y-3">
              <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> Admin Account
              </h3>
              <div className="text-[10px] bg-background border border-border p-3 rounded space-y-1.5">
                <div>
                  <span className="text-muted-foreground block text-[8px]">EMAIL</span>
                  <span className="text-foreground font-bold">admin@demo.com</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[8px]">PASSWORD</span>
                  <span className="text-foreground font-bold">Password123</span>
                </div>
              </div>
              <button
                onClick={() => handleCopy('admin@demo.com Password123', 'admin')}
                className="w-full py-2 border border-foreground bg-background hover:bg-muted text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedText === 'admin' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Credentials
                  </>
                )}
              </button>
            </article>
          </div>
        </section>

        {/* Right Column: Demo Script */}
        <section className="space-y-6">
          <div className="bg-card border-2 border-foreground p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(250,250,250,0.15)] space-y-4">
            <h2 className="text-base font-extrabold uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
              <BookOpen className="w-4 h-4" /> Demo Script
            </h2>
            
            <div className="space-y-4 text-xs font-sans text-muted-foreground leading-relaxed">
              <div className="space-y-1.5">
                <p className="font-mono font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <span className="bg-primary text-primary-foreground size-5 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0">1</span>
                  Login simulation
                </p>
                <p className="pl-6.5 text-[11px]">
                  Copy the Learner credentials and log in. You will bypass the OTP 2FA verification step directly.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-mono font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <span className="bg-primary text-primary-foreground size-5 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0">2</span>
                  Check Dashboard & progress
                </p>
                <p className="pl-6.5 text-[11px]">
                  View the Learner Dashboard. Observe the Frontend Developer roadmap tracking progress situated at exactly 50%.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-mono font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <span className="bg-primary text-primary-foreground size-5 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0">3</span>
                  Inspect Quiz & Resources
                </p>
                <p className="pl-6.5 text-[11px]">
                  Go to Frontend Developer roadmap journey. Verify quiz history containing both Pass and Fail mock test scores.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-mono font-extrabold text-foreground uppercase text-[10px] flex items-center gap-1">
                  <span className="bg-primary text-primary-foreground size-5 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0">4</span>
                  Admin workflow
                </p>
                <p className="pl-6.5 text-[11px]">
                  Log in as Admin, open the Career Path Builder, and edit a path. Run quality check and see realtime warning outputs before publishing.
                </p>
              </div>

              <div className="p-3 border-2 border-foreground bg-primary/5 text-foreground rounded font-mono text-[10px] uppercase font-bold flex items-start gap-2">
                <Info className="w-4 h-4 text-primary shrink-0 pt-0.5" />
                <span className="leading-tight">
                  Always safe reset values after a demo run to maintain clear statistics for the next presentation.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Confirm Modals */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-background text-foreground border-2 border-foreground max-w-md w-full rounded p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold uppercase text-foreground flex items-center gap-2 font-mono">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Confirm Action
            </h3>
            <p className="text-xs text-muted-foreground font-sans font-medium">
              {confirmModal === 'seed' 
                ? 'Are you sure you want to seed the Demo Dataset? This will reset all demo accounts and overwrite careers metadata catalog. Real users are unaffected.'
                : 'Are you sure you want to safe reset demo progress? This resets progress, uploads, and test histories of learner@demo.com.'}
            </p>
            <div className="flex justify-end gap-3 font-mono text-xs font-bold uppercase">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-1.5 border border-foreground bg-muted rounded hover:bg-accent transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal === 'seed' ? handleSeed : handleReset}
                className="px-4 py-1.5 border border-foreground bg-primary text-primary-foreground rounded hover:opacity-90 transition cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
