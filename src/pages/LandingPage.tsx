import { useRef, useEffect } from 'react';
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
import { AnimatedShaderBackground } from '@/components/ui/animated-shader-background';
import { MeshGradientBackground } from '@/components/ui/mesh-gradient-background';
import { useSettings, THEMES } from '@/contexts/SettingsContext';

function hexToRgbStr(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '168, 85, 247';
}

export function LandingPage() {
  const { isVisible } = useSiteContentData();
  const { settings } = useSettings();
  const shellRef = useRef<HTMLDivElement>(null);

  // Apply theme CSS vars to landing page shell
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const theme = THEMES[settings.theme];

    el.style.setProperty('--color-primary', theme.primary);
    el.style.setProperty('--color-accent', theme.accent);
    el.style.setProperty('--color-primary-hsl', theme.primaryHSL);
    el.style.setProperty('--color-accent-hsl', theme.accentHSL);

    const [p_h, p_s, p_l] = theme.primaryHSL.split(' ');
    el.style.setProperty('--color-primary-h', p_h);
    el.style.setProperty('--color-primary-s', p_s);
    el.style.setProperty('--color-primary-l', p_l);

    const [a_h, a_s, a_l] = theme.accentHSL.split(' ');
    el.style.setProperty('--color-accent-h', a_h);
    el.style.setProperty('--color-accent-s', a_s);
    el.style.setProperty('--color-accent-l', a_l);

    const primaryRgbStr = hexToRgbStr(theme.primary);
    el.style.setProperty('--color-primary-014', `rgba(${primaryRgbStr}, 0.14)`);
    el.style.setProperty('--color-primary-018', `rgba(${primaryRgbStr}, 0.18)`);
    el.style.setProperty('--color-primary-030', `rgba(${primaryRgbStr}, 0.3)`);
  }, [settings.theme]);

  return (
    <div
      ref={shellRef}
      className={`landing-shell relative min-h-screen bg-opti-bg text-opti-text-primary overflow-x-hidden${
        settings.colorMode === 'light' ? ' color-mode-light' :
        settings.colorMode === 'grey' ? ' color-mode-grey' : ''
      }`}
    >
      {/* Animated shader background — hidden in light/grey mode */}
      {settings.colorMode === 'dark' && <AnimatedShaderBackground />}

      {/* Grain overlay for texture — hidden in light mode */}
      {settings.colorMode !== 'light' && (
        <div
          className="fixed inset-0 opacity-[0.03] pointer-events-none z-[1]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />
      )}

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10">
        {isVisible('hero') && <Hero />}
        {isVisible('steps') && <Tutorial />}
      </main>

      {/* Sections from Problem onwards with MeshGradient background */}
      <div className="relative">
        {settings.colorMode === 'dark' && <MeshGradientBackground />}
        <div className="relative z-10">
          {isVisible('problems') && <Problem />}
          {isVisible('features') && <Features />}
          {isVisible('about_creator') && <AboutCreator />}
          {isVisible('about_optiplan') && <AboutOptiPlan />}
          {isVisible('faqs') && <FAQ />}
          {isVisible('feedback') && <FeedbackForm />}
          {isVisible('testimonials') && <Testimonials />}
          {isVisible('cta') && <CTA />}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
