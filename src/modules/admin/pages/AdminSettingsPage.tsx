import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Save, Shield, Cpu, Mail } from 'lucide-react';

export const AdminSettingsPage = () => {
  const [systemName, setSystemName] = useState('DevPath Learning Portal');
  const [supportEmail, setSupportEmail] = useState('support@devpath.com');
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('••••••••••••••••••••••••••••••••');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('System settings saved successfully');
    }, 800);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 text-foreground">
      <div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-1">
          <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link> &gt; <span className="text-foreground">Settings</span>
        </p>
        <h1 className="text-3xl font-extrabold text-foreground uppercase">System Configurations</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure global portal parameters, security controls, and third-party API integrations.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* General Settings */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
            <Mail className="w-5 h-5" />
            <h2 className="font-bold uppercase tracking-wider text-sm">General Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Portal Name</label>
              <input 
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full bg-background border border-input rounded p-3 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Support Contact Email</label>
              <input 
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-background border border-input rounded p-3 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Security Configurations */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
            <Shield className="w-5 h-5" />
            <h2 className="font-bold uppercase tracking-wider text-sm">Security & Access Control</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Session Timeout (Minutes)</label>
              <input 
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full bg-background border border-input rounded p-3 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-background border border-border rounded">
              <div>
                <p className="text-sm font-bold text-foreground">Two-Factor Authentication (MFA)</p>
                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Enforce MFA verification on admin accounts.</p>
              </div>
              <button
                type="button"
                onClick={() => setMfaEnabled(!mfaEnabled)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                  mfaEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${
                  mfaEnabled ? 'translate-x-6 bg-primary-foreground' : 'translate-x-0 bg-muted-foreground'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Third-party Integrations */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
            <Cpu className="w-5 h-5" />
            <h2 className="font-bold uppercase tracking-wider text-sm">AI Engine Configurations</h2>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Google Gemini API Key</label>
            <input 
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full bg-background border border-input rounded p-3 text-sm text-foreground focus:outline-none focus:border-primary font-mono"
            />
            <p className="text-[10px] text-muted-foreground font-semibold mt-2">
              Used by system analyzers to autogenerate learning roadmaps and quiz questions dynamically.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground hover:opacity-90 transition shadow-md disabled:opacity-55"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Configurations...' : 'Save Configuration'}
          </button>
        </div>

      </form>
    </div>
  );
};
