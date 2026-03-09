import { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { FlipCard } from '@/components/FlipCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useSiteContentData } from '@/hooks/useSiteContent';
import { siteDefaults } from '@/constants/siteDefaults';
import { features as featureConstants } from '@/constants/features';
import { Check } from 'lucide-react';

interface FeatureItem {
  title: string;
  description: string;
  checklist: string[];
  backContent: string;
}

interface FeaturesContent {
  badge: string;
  title: string;
  subtitle: string;
  items: FeatureItem[];
}

const defaults = siteDefaults.features as unknown as FeaturesContent;

export function Features() {
  const { getContent } = useSiteContentData();
  const content = getContent<FeaturesContent>('features') ?? defaults;
  const items = content.items ?? defaults.items;
  const tc = ((content as any).textColors ?? {}) as Record<string, string>;

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-50 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge={content.badge}
          title={
            <>
              {content.title.includes('stay productive') ? (
                <>Everything you need to{' '}<span className="text-gradient">stay productive</span></>
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
          staggerDelay={0.1}
        >
          {items.map((feature, index) => {
            const isPopular = index === 1;
            // Use the icon/color from constants (not editable via CMS)
            const constant = featureConstants[index];

            return (
              <StaggerItem key={feature.title}>
                <div className="relative h-[340px]">
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-opti-accent text-white text-xs font-semibold">
                      Most Popular
                    </span>
                  )}

                  <FlipCard
                    className="h-full"
                    glowing={isPopular}
                    front={
                      <div className="flex flex-col h-full">
                        {constant && (
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${constant.color} flex items-center justify-center mb-4`}
                          >
                            <constant.icon className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <h3 className="font-semibold text-xl text-opti-text-primary mb-2" style={{ color: tc.itemTitle || undefined }}>
                          {feature.title}
                        </h3>
                        <p className="text-opti-text-secondary text-sm leading-relaxed mb-4" style={{ color: tc.itemDescription || undefined }}>
                          {feature.description}
                        </p>
                        <ul className="mt-auto space-y-2">
                          {feature.checklist.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                              <span className="text-opti-text-secondary text-xs">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    }
                    back={
                      <div className="flex flex-col h-full justify-center">
                        {constant && <constant.icon className="w-8 h-8 text-opti-accent mb-4" />}
                        <h3 className="font-semibold text-lg text-opti-text-primary mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-opti-text-secondary text-sm leading-relaxed">
                          {feature.backContent}
                        </p>
                        <p className="mt-auto text-xs text-opti-text-secondary/60 italic">
                          Click to flip back
                        </p>
                      </div>
                    }
                  />
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
