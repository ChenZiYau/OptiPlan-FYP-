import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedSection } from '@/components/AnimatedSection';
import { GlassCard } from '@/components/GlassCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  User,
  ArrowRight,
  Send,
  CheckCircle2,
  Bug,
  Lightbulb,
  MessageSquare,
  HelpCircle,
  Loader2,
} from 'lucide-react';

const categories = [
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb },
  { value: 'general', label: 'General Feedback', icon: MessageSquare },
  { value: 'other', label: 'Other', icon: HelpCircle },
] as const;

export function FeedbackForm() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !message.trim()) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('feedback').insert({
      user_id: user.id,
      user_email: user.email ?? '',
      user_name: profile?.display_name ?? user.email?.split('@')[0] ?? '',
      category,
      message: message.trim(),
      status: 'new',
    });

    setSubmitting(false);

    if (insertError) {
      setError('Something went wrong. Please try again.');
      return;
    }

    setSubmitted(true);
    setMessage('');
    setCategory('general');
  }

  function resetForm() {
    setSubmitted(false);
    setError(null);
  }

  return (
    <section id="feedback" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Feedback"
          title="We'd love to hear from you"
          subtitle="Share your thoughts to help us make OptiPlan even better."
          className="text-center mb-10"
          titleSize="clamp(28px, 3vw, 40px)"
        />

        <AnimatedSection delay={0.3}>
          {/* ── Unauthenticated: Login Required card ── */}
          {!user ? (
            <GlassCard className="p-8 text-center border-opti-accent/10" hover={false} glow>
              <div className="w-16 h-16 rounded-full bg-opti-accent/10 flex items-center justify-center mx-auto mb-5">
                <User className="w-8 h-8 text-opti-accent" />
              </div>

              <h3 className="font-semibold text-xl text-opti-text-primary mb-2">
                Login Required
              </h3>
              <p className="text-opti-text-secondary text-sm leading-relaxed mb-6 max-w-sm mx-auto">
                Sign in to your account to submit feedback. Your input helps us
                prioritize the features that matter most to students.
              </p>

              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm transition-transform hover:scale-105 active:scale-95"
              >
                Sign In to Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </GlassCard>
          ) : submitted ? (
            /* ── Success confirmation ── */
            <GlassCard className="p-8 text-center border-green-500/20" hover={false} glow>
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>

              <h3 className="font-semibold text-xl text-opti-text-primary mb-2">
                Thank You!
              </h3>
              <p className="text-opti-text-secondary text-sm leading-relaxed mb-6 max-w-sm mx-auto">
                Your feedback has been submitted successfully. We appreciate you helping us improve OptiPlan.
              </p>

              <button
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm transition-transform hover:scale-105 active:scale-95"
              >
                Submit More Feedback
                <ArrowRight className="w-4 h-4" />
              </button>
            </GlassCard>
          ) : (
            /* ── Authenticated: Feedback form ── */
            <GlassCard className="p-8 border-opti-accent/10" hover={false} glow>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category selector */}
                <div>
                  <label className="block text-sm font-medium text-opti-text-primary mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isActive = category === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                            isActive
                              ? 'bg-opti-accent/15 border-opti-accent/40 text-opti-accent'
                              : 'bg-white/5 border-white/10 text-opti-text-secondary hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-opti-text-primary mb-2">
                    Your Feedback
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind…"
                    rows={5}
                    required
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-opti-text-primary placeholder:text-opti-text-secondary/50 outline-none focus:border-opti-accent/50 focus:ring-1 focus:ring-opti-accent/30 resize-none transition-all"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-sm text-red-400 text-center">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </GlassCard>
          )}
        </AnimatedSection>
      </div>
    </section>
  );
}
