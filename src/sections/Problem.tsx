import { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { GlassCard } from '@/components/GlassCard';
import { SectionHeader } from '@/components/SectionHeader';
import { problems } from '@/constants/problems';

export function Problem() {
  return (
    <section id="problem" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="The Problem"
          title={
            <>
              Why students <span className="text-gradient">struggle daily</span>
            </>
          }
          subtitle="Most students face the same three challenges — and no single app solves them all."
        />

        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          staggerDelay={0.12}
        >
          {problems.map((problem) => (
            <StaggerItem key={problem.number}>
              <GlassCard className="h-full p-6">
                <span className="inline-block text-4xl font-display font-bold text-opti-accent/30 mb-3">
                  {problem.number}
                </span>
                <h3 className="font-display font-semibold text-xl text-opti-text-primary mb-2">
                  {problem.title}
                </h3>
                <p className="text-opti-text-secondary text-sm leading-relaxed">
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
