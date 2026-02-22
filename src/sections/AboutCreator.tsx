import { AnimatedSection } from '@/components/AnimatedSection';
import { SectionHeader } from '@/components/SectionHeader';

export function AboutCreator() {
  return (
    <section id="about-creator" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Meet the Creator"
          title={
            <>
              Built by a student, <span className="text-gradient">for students</span>
            </>
          }
        />

        <AnimatedSection delay={0.2}>
          <div className="glass-card p-8 text-center space-y-4">
            <p className="text-opti-text-secondary leading-relaxed">
              OptiPlan started as a side project during finals week. I was drowning in
              scattered schedules, lost notes, and mystery bank charges — and I knew other
              students felt the same way.
            </p>
            <p className="text-opti-text-secondary leading-relaxed">
              So I built the tool I wish I'd had freshman year: one place to plan your day,
              organize your notes, and actually see where your money goes. No bloat, no
              learning curve — just the essentials done right.
            </p>
            <p className="text-opti-text-primary font-display font-semibold mt-6">
              — The OptiPlan Team
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
