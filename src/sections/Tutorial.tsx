import { AnimatedSection } from '@/components/AnimatedSection';
import { MacWindow } from '@/components/MacWindow';
import { SectionHeader } from '@/components/SectionHeader';
import { Play } from 'lucide-react';

export function Tutorial() {
  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="How It Works"
          title={
            <>
              See OptiPlan <span className="text-gradient">in action</span>
            </>
          }
          subtitle="A quick walkthrough of how OptiPlan keeps your day on track."
        />

        <AnimatedSection delay={0.3}>
          <MacWindow title="optiplan-demo.mp4">
            <div className="flex items-center justify-center aspect-video bg-white/[0.02]">
              <button
                className="w-20 h-20 rounded-full bg-opti-accent/20 border border-opti-accent/30 flex items-center justify-center transition-transform hover:scale-110"
                aria-label="Play tutorial video"
              >
                <Play className="w-8 h-8 text-opti-accent ml-1" />
              </button>
            </div>
          </MacWindow>
        </AnimatedSection>
      </div>
    </section>
  );
}
