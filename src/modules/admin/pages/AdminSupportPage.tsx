import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { HelpCircle, Send, MessageSquare } from 'lucide-react';

export const AdminSupportPage = () => {
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and Message are required');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubject('');
      setMessage('');
      toast.success('Support ticket submitted successfully! Our developers will contact you.');
    }, 800);
  };

  const faqs = [
    {
      q: 'How do I edit standard user learning paths?',
      a: 'Navigate to "Users Management", click the Edit icon next to a student, and adjust their mapped active roadmap inside their configuration sub-panel.'
    },
    {
      q: 'Can I add multiple learning resources to the same skill?',
      a: 'Yes! Go to "Skill Library", choose a skill, click Edit, and use the "Linked Learning Resources" tool to attach multiple documentation courses or tutorials directly.'
    },
    {
      q: 'Why are my changes to MongoDB not showing up instantly?',
      a: 'Mongoose schemas enforce strict typings. If you write fields outside the new Career Path format (like legacy title fields), make sure strict validation is disabled in the model schema options.'
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 text-foreground">
      <div>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-1">
          <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link> &gt; <span className="text-foreground">Support</span>
        </p>
        <h1 className="text-3xl font-extrabold text-foreground uppercase">Support & Developers Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">Get developer assistance, file tickets for system bugs, or search portal management FAQs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* FAQs Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
            <HelpCircle className="w-5 h-5" />
            <h2 className="font-bold uppercase tracking-wider text-sm">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-5 space-y-2 shadow-md">
                <p className="text-sm font-bold text-foreground">{faq.q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Ticket Form */}
        <div className="bg-card rounded-xl border border-border p-6 h-fit space-y-5 shadow-lg">
          <div className="flex items-center gap-2 text-primary border-b border-border pb-3">
            <MessageSquare className="w-5 h-5" />
            <h2 className="font-bold uppercase tracking-wider text-sm">Submit Ticket</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Subject</label>
              <input 
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-background border border-input rounded p-2.5 text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                placeholder="Issue title..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-background border border-input rounded p-2.5 text-xs text-foreground focus:outline-none focus:border-primary appearance-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Message</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-background border border-input rounded p-2.5 text-xs text-foreground focus:outline-none focus:border-primary min-h-[100px] placeholder:text-muted-foreground"
                placeholder="Explain the issue details..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded bg-primary py-2.5 font-bold text-primary-foreground text-xs hover:opacity-90 transition shadow-md disabled:opacity-55"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Submitting...' : 'Send Message'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
