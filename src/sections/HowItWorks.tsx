import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/AnimatedSection';
import { GlassCard } from '@/components/GlassCard';
import { SectionHeader } from '@/components/SectionHeader';
import { steps } from '@/constants/steps';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

      {/* Decorative line */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-[60%] bg-gradient-to-b from-transparent via-opti-accent/30 to-transparent hidden lg:block" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="How it works"
          title={
            <>
              Three steps to a{' '}
              <span className="text-gradient">calmer day</span>
            </>
          }
          subtitle="Getting started is simple. Connect your tools, start focusing, and end each day with clarity."
        />

        {/* Steps */}
        <StaggerContainer className="space-y-8 lg:space-y-12" staggerDelay={0.15}>
          {steps.map((step, index) => (
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
                    <div
                      className={`w-14 h-14 rounded-xl ${step.bgColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <step.icon className={`w-7 h-7 ${step.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-opti-text-secondary tabular-nums">
                          {step.number}
                        </span>
                        <h3 className="font-semibold text-2xl text-opti-text-primary">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-opti-text-secondary leading-relaxed">
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
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
