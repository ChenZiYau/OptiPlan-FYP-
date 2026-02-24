import { AnimatedSection } from '@/components/AnimatedSection';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  badge: string;
  title: ReactNode;
  subtitle?: string;
  className?: string;
  titleSize?: string;
  badgeColor?: string;
  titleColor?: string;
  subtitleColor?: string;
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  className = 'text-center mb-16',
  titleSize = 'clamp(32px, 4vw, 48px)',
  badgeColor,
  titleColor,
  subtitleColor,
}: SectionHeaderProps) {
  return (
    <div className={className}>
      <AnimatedSection>
        <span
          className="inline-block px-4 py-1.5 rounded-full bg-opti-accent/10 text-opti-accent text-xs font-medium uppercase tracking-wider mb-4"
          style={{ color: badgeColor || undefined }}
        >
          {badge}
        </span>
      </AnimatedSection>
      <AnimatedSection delay={0.1}>
        <h2
          className="font-bold tracking-tight text-opti-text-primary"
          style={{ fontSize: titleSize, color: titleColor || undefined }}
        >
          {title}
        </h2>
      </AnimatedSection>
      {subtitle && (
        <AnimatedSection delay={0.2}>
          <p
            className="mt-4 text-opti-text-secondary text-lg max-w-2xl mx-auto"
            style={{ color: subtitleColor || undefined }}
          >
            {subtitle}
          </p>
        </AnimatedSection>
      )}
    </div>
  );
}
