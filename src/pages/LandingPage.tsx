import { Navbar } from '@/sections/Navbar';
import { Hero } from '@/sections/Hero';
import { Problem } from '@/sections/Problem';
import { Features } from '@/sections/Features';
import { Tutorial } from '@/sections/Tutorial';
import { Testimonials } from '@/sections/Testimonials';
import { AboutCreator } from '@/sections/AboutCreator';
import { AboutOptiPlan } from '@/sections/AboutOptiPlan';
import { FAQ } from '@/sections/FAQ';
import { FeedbackForm } from '@/sections/FeedbackForm';
import { CTA } from '@/sections/CTA';
import { Footer } from '@/sections/Footer';
import { useSiteContentData } from '@/hooks/useSiteContent';

export function LandingPage() {
  const { isVisible } = useSiteContentData();

  return (
    <div className="relative min-h-screen bg-opti-bg text-opti-text-primary overflow-x-hidden">
      {/* Global background glow */}
      <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />

      {/* Grain overlay for texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10">
        {isVisible('hero') && <Hero />}
        {isVisible('problems') && <Problem />}
        {isVisible('features') && <Features />}
        {isVisible('steps') && <Tutorial />}
        {isVisible('about_creator') && <AboutCreator />}
        {isVisible('about_optiplan') && <AboutOptiPlan />}
        {isVisible('faqs') && <FAQ />}
        <FeedbackForm />
        {isVisible('testimonials') && <Testimonials />}
        {isVisible('cta') && <CTA />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
