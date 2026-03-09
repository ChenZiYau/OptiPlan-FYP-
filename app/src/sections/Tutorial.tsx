import { AnimatedSection } from '@/components/AnimatedSection';
import { MacWindow } from '@/components/MacWindow';
import { Play } from 'lucide-react';

export function Tutorial() {
  return (
    <section id="how-it-works" className="relative py-16 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection delay={0.3}>
          <MacWindow title="">
            <div className="flex flex-col items-center justify-center aspect-video bg-white/[0.02] gap-4">
              <div className="w-20 h-20 rounded-full bg-opti-accent/10 border border-opti-accent/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-opti-accent/40 ml-1" />
              </div>
              <span className="text-sm text-opti-text-secondary/60 font-medium">
                Tutorial video coming soon
              </span>
            </div>
          </MacWindow>
        </AnimatedSection>
      </div>
    </section>
  );
}
