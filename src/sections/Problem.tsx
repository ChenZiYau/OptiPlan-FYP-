import { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { GlassCard } from '@/components/GlassCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useSiteContentData } from '@/hooks/useSiteContent';
import { siteDefaults } from '@/constants/siteDefaults';

interface ProblemItem {
  number: string;
  title: string;
  description: string;
}

interface ProblemsContent {
  badge: string;
  title: string;
  subtitle: string;
  items: ProblemItem[];
}

const defaults = siteDefaults.problems as unknown as ProblemsContent;

export function Problem() {
  const { getContent } = useSiteContentData();
  const content = getContent<ProblemsContent>('problems') ?? defaults;
  const tc = ((content as any).textColors ?? {}) as Record<string, string>;

  return (
    <section id="problem" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={content.badge}
          title={
            <>
              {content.title.includes('struggle daily') ? (
                <>Why students <span className="text-gradient">struggle daily</span></>
              ) : (
                content.title
              )}
            </>
          }
          subtitle={content.subtitle}
          titleColor={tc.title}
          subtitleColor={tc.subtitle}
        />

        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          staggerDelay={0.12}
        >
          {(content.items ?? defaults.items).map((problem) => (
            <StaggerItem key={problem.number}>
              <GlassCard className="h-full p-6">
                <span className="inline-block text-4xl font-bold text-opti-accent/30 mb-3 tracking-tight">
                  {problem.number}
                </span>
                <h3 className="font-semibold text-xl text-opti-text-primary mb-2" style={{ color: tc.itemTitle || undefined }}>
                  {problem.title}
                </h3>
                <p className="text-opti-text-secondary text-sm leading-relaxed" style={{ color: tc.itemDescription || undefined }}>
                  {problem.description}
                </p>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
