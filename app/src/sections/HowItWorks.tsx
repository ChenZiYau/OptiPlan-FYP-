import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { GlassCard } from '@/components/GlassCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useSiteContentData } from '@/hooks/useSiteContent';
import { siteDefaults } from '@/constants/siteDefaults';
import { steps as stepConstants } from '@/constants/steps';

interface StepItem {
  number: string;
  title: string;
  description: string;
}

interface StepsContent {
  badge: string;
  title: string;
  subtitle: string;
  items: StepItem[];
}

const defaults = siteDefaults.steps as unknown as StepsContent;

export function HowItWorks() {
  const { getContent } = useSiteContentData();
  const content = getContent<StepsContent>('steps') ?? defaults;
  const items = content.items ?? defaults.items;
  const tc = ((content as any).textColors ?? {}) as Record<string, string>;

  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

      {/* Decorative line */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-[60%] bg-gradient-to-b from-transparent via-opti-accent/30 to-transparent hidden lg:block" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={content.badge}
          title={
            <>
              {content.title.includes('calmer day') ? (
                <>Three steps to a{' '}<span className="text-gradient">calmer day</span></>
              ) : (
                content.title
              )}
            </>
          }
          subtitle={content.subtitle}
          titleColor={tc.title}
          subtitleColor={tc.subtitle}
        />

        {/* Steps */}
        <StaggerContainer className="space-y-8 lg:space-y-12" staggerDelay={0.15}>
          {items.map((step, index) => {
            // Use icon/color from constants (not editable via CMS)
            const constant = stepConstants[index];

            return (
              <StaggerItem key={step.title}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } items-center gap-8 lg:gap-16`}
                >
                  {/* Card */}
                  <GlassCard className="flex-1 p-8 w-full">
                    <div className="flex items-start gap-6">
                      {constant && (
                        <div
                          className={`w-14 h-14 rounded-xl ${constant.bgColor} flex items-center justify-center flex-shrink-0`}
                        >
                          <constant.icon className={`w-7 h-7 ${constant.color}`} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-opti-text-secondary tabular-nums">
                            {step.number}
                          </span>
                          <h3 className="font-semibold text-2xl text-opti-text-primary" style={{ color: tc.itemTitle || undefined }}>
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-opti-text-secondary leading-relaxed" style={{ color: tc.itemDescription || undefined }}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Connector (desktop only) */}
                  <div className="hidden lg:flex w-12 h-12 rounded-full bg-opti-surface border border-white/10 items-center justify-center flex-shrink-0 z-10">
                    <div className="w-3 h-3 rounded-full bg-opti-accent" />
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden lg:block flex-1" />
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
