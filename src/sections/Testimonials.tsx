import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { TestimonialCard } from '@/components/TestimonialCard';
import { SectionHeader } from '@/components/SectionHeader';
import { testimonials } from '@/constants/testimonials';

const duplicated = [...testimonials, ...testimonials];

// Pixels per second — lower = slower, more readable
const SPEED = 40;

export function Testimonials() {
  const [paused, setPaused] = useState(false);
  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const halfWidth = useRef(0);

  // Measure half the track (one full set of cards) for the reset point
  useEffect(() => {
    if (trackRef.current) {
      halfWidth.current = trackRef.current.scrollWidth / 2;
    }
  }, []);

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
            badge="Testimonials"
            title={
              <>
                What students <span className="text-gradient">are saying</span>
              </>
            }
            subtitle="Real feedback from students who use OptiPlan every day."
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
              <TestimonialCard key={`${testimonial.name}-${i}`} {...testimonial} />
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
