import { AnimatedSection } from '@/components/AnimatedSection';
import { SectionHeader } from '@/components/SectionHeader';
import { useSiteContentData } from '@/hooks/useSiteContent';
import { siteDefaults } from '@/constants/siteDefaults';

interface AboutCreatorContent {
  badge: string;
  title: string;
  paragraphs: string[];
  signature: string;
}

const defaults = siteDefaults.about_creator as unknown as AboutCreatorContent;

export function AboutCreator() {
  const { getContent } = useSiteContentData();
  const content = getContent<AboutCreatorContent>('about_creator') ?? defaults;
  const tc = ((content as any).textColors ?? {}) as Record<string, string>;

  return (
    <section id="about-creator" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={content.badge}
          title={
            <>
              {content.title.includes('for students') ? (
                <>Built by a student, <span className="text-gradient">for students</span></>
              ) : (
                content.title
              )}
            </>
          }
          titleColor={tc.title}
        />

        <AnimatedSection delay={0.2}>
          <div className="glass-card p-8 text-center space-y-4">
            {(content.paragraphs ?? defaults.paragraphs).map((paragraph, i) => (
              <p key={i} className="text-opti-text-secondary leading-relaxed" style={{ color: tc.paragraphs || undefined }}>
                {paragraph}
              </p>
            ))}
            <p className="text-opti-text-primary font-semibold mt-6" style={{ color: tc.signature || undefined }}>
              {content.signature}
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
