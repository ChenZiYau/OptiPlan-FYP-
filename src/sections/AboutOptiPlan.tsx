import { AnimatedSection } from '@/components/AnimatedSection';
import { SectionHeader } from '@/components/SectionHeader';
import { GlassCard } from '@/components/GlassCard';
import { Calendar, BookOpen, Wallet, Check } from 'lucide-react';
import { useSiteContentData } from '@/hooks/useSiteContent';
import { siteDefaults } from '@/constants/siteDefaults';

interface AboutOptiPlanContent {
  badge: string;
  title: string;
  subtitle: string;
  heading: string;
  description: string;
  checklist: string[];
}

const defaults = siteDefaults.about_optiplan as unknown as AboutOptiPlanContent;

export function AboutOptiPlan() {
  const { getContent } = useSiteContentData();
  const content = getContent<AboutOptiPlanContent>('about_optiplan') ?? defaults;
  const tc = ((content as any).textColors ?? {}) as Record<string, string>;

  return (
    <section id="about-optiplan" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={content.badge}
          title={
            <>
              {content.title.includes('replace them all') ? (
                <>One app to <span className="text-gradient">replace them all</span></>
              ) : (
                content.title
              )}
            </>
          }
          subtitle={content.subtitle}
          titleColor={tc.title}
          subtitleColor={tc.subtitle}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* 3-in-1 visual card */}
          <AnimatedSection direction="left">
            <GlassCard className="p-8" hover={false}>
              <p className="text-xs font-medium uppercase tracking-wider text-opti-accent mb-6">
                3-in-1 Platform
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Calendar, label: 'Schedule' },
                  { icon: BookOpen, label: 'Notes' },
                  { icon: Wallet, label: 'Budget' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-opti-accent/10 flex items-center justify-center mx-auto">
                      <Icon className="w-7 h-7 text-opti-accent" />
                    </div>
                    <p className="text-sm text-opti-text-secondary">{label}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </AnimatedSection>

          {/* Text + checklist */}
          <AnimatedSection direction="right" delay={0.15}>
            <div className="space-y-4">
              <h3 className="font-semibold text-2xl text-opti-text-primary" style={{ color: tc.heading || undefined }}>
                {content.heading}
              </h3>
              <p className="text-opti-text-secondary leading-relaxed" style={{ color: tc.description || undefined }}>
                {content.description}
              </p>
              <ul className="space-y-3 pt-2">
                {(content.checklist ?? defaults.checklist).map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-opti-text-secondary text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
