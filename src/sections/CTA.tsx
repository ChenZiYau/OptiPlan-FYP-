import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedSection } from '@/components/AnimatedSection';
import { GlowButton } from '@/components/GlowButton';
import { useSiteContentData } from '@/hooks/useSiteContent';
import { siteDefaults } from '@/constants/siteDefaults';
import { ArrowRight } from 'lucide-react';

interface CTAContent {
  headline: string;
  subheadline: string;
  buttonText: string;
  disclaimer: string;
}

const defaults = siteDefaults.cta as unknown as CTAContent;

export function CTA() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { getContent } = useSiteContentData();
  const content = getContent<CTAContent>('cta') ?? defaults;
  const tc = ((content as any).textColors ?? {}) as Record<string, string>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    navigate('/signup?email=' + encodeURIComponent(email));
  };

  return (
    <section
      id="cta"
      className="relative py-32 overflow-hidden"
      style={{ backgroundColor: '#120B1D' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-60 pointer-events-none" />

      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-opti-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-[#8B5CF6]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection>
          <h2
            className="font-bold tracking-tight text-opti-text-primary"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', color: tc.headline || undefined }}
          >
            {content.headline.includes('your way') ? (
              <>Start your day,{' '}<span className="text-gradient">your way.</span></>
            ) : (
              content.headline
            )}
          </h2>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <p className="mt-6 text-opti-text-secondary text-lg max-w-lg mx-auto" style={{ color: tc.subheadline || undefined }}>
            {content.subheadline}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email"
                required
                className={`w-full px-5 py-3 rounded-xl bg-white/5 border ${
                  error ? 'border-red-400' : 'border-white/10'
                } text-opti-text-primary placeholder:text-opti-text-secondary/50 focus:outline-none focus:border-opti-accent transition-colors`}
              />
              {error && (
                <p className="mt-2 text-sm text-red-400 text-left">{error}</p>
              )}
            </div>
            <GlowButton
              type="submit"
              className="flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {content.buttonText}
              <ArrowRight className="w-4 h-4" />
            </GlowButton>
          </form>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <p className="mt-4 text-opti-text-secondary/60 text-sm" style={{ color: tc.disclaimer || undefined }}>
            {content.disclaimer}
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
