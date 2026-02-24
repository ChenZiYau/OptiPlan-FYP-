import { AnimatedSection } from '@/components/AnimatedSection';
import { GlassCard } from '@/components/GlassCard';
import { SectionHeader } from '@/components/SectionHeader';
import { User, ArrowRight } from 'lucide-react';

export function FeedbackForm() {
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
          <GlassCard className="p-8 text-center border-opti-accent/10" hover={false} glow>
            <div className="w-16 h-16 rounded-full bg-opti-accent/10 flex items-center justify-center mx-auto mb-5">
              <User className="w-8 h-8 text-opti-accent" />
            </div>

            <h3 className="font-semibold text-xl text-opti-text-primary mb-2">
              Login Required
            </h3>
            <p className="text-opti-text-secondary text-sm leading-relaxed mb-6 max-w-sm mx-auto">
              Sign in to your OptiPlan account to submit feedback. Your input helps us
              prioritize the features that matter most to students.
            </p>

            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm transition-transform hover:scale-105 active:scale-95">
              Sign In to Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </GlassCard>
        </AnimatedSection>
      </div>
    </section>
  );
}
