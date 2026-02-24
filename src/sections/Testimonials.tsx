import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { TestimonialCard } from '@/components/TestimonialCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useSiteContentData } from '@/hooks/useSiteContent';
import { siteDefaults } from '@/constants/siteDefaults';

interface TestimonialItem {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

interface TestimonialsContent {
  badge: string;
  title: string;
  subtitle: string;
  items: TestimonialItem[];
}

const defaults = siteDefaults.testimonials as unknown as TestimonialsContent;

// Pixels per second — lower = slower, more readable
const SPEED = 40;

export function Testimonials() {
  const [paused, setPaused] = useState(false);
  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const halfWidth = useRef(0);
  const { getContent } = useSiteContentData();
  const content = getContent<TestimonialsContent>('testimonials') ?? defaults;
  const items = content.items ?? defaults.items;
  const tc = ((content as any).textColors ?? {}) as Record<string, string>;
  const duplicated = [...items, ...items];

  // Measure half the track (one full set of cards) for the reset point
  useEffect(() => {
    if (trackRef.current) {
      halfWidth.current = trackRef.current.scrollWidth / 2;
    }
  }, [items]);

  // Manual animation frame loop so we can pause instantly on hover
  useAnimationFrame((_, delta) => {
    if (paused || halfWidth.current === 0) return;

    // Move right-to-left by subtracting; items visually flow left → right
    let next = x.get() - (SPEED * delta) / 1000;

    // Once we've scrolled past the first set, seamlessly reset
    if (Math.abs(next) >= halfWidth.current) {
      next += halfWidth.current;
    }

    x.set(next);
  });

  return (
    <section id="testimonials" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge={content.badge}
            title={
              <>
                {content.title.includes('are saying') ? (
                  <>What students <span className="text-gradient">are saying</span></>
                ) : (
                  content.title
                )}
              </>
            }
            subtitle={content.subtitle}
          titleColor={tc.title}
          subtitleColor={tc.subtitle}
          />
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <motion.div
            ref={trackRef}
            className="flex gap-6 w-max cursor-grab active:cursor-grabbing"
            style={{ x }}
          >
            {duplicated.map((testimonial, i) => (
              <TestimonialCard key={`${testimonial.name}-${i}`} {...testimonial} quoteColor={tc.quote} nameColor={tc.name} roleColor={tc.role} />
            ))}
          </motion.div>

          {/* Edge fade masks */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-opti-bg to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-opti-bg to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </section>
  );
}
