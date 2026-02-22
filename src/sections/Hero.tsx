import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Calendar, Clock, MoveRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { agendaItems } from '@/constants/hero';
import { fadeInUp, heroCardVariants } from '@/animations/variants';

const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1);

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

export function Hero() {
  const { scrollToSection } = useSmoothScroll();
  const navigate = useNavigate();

  // Animated rotating words
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ['productive', 'focused', 'organized', 'balanced', 'effortless'],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-24">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp}>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-opti-accent/10 text-opti-accent border border-opti-accent/20 hover:bg-opti-accent/20 font-mono text-xs uppercase tracking-wider"
              onClick={() => scrollToSection('features')}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Planning
              <MoveRight className="w-3.5 h-3.5" />
            </Button>
          </motion.div>

          {/* Animated Headline */}
          <motion.h1
            variants={fadeInUp}
            className="mt-8 font-display font-bold text-opti-text-primary leading-[0.95] tracking-tight text-5xl md:text-7xl max-w-3xl"
          >
            <span>Make your days</span>
            <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
              &nbsp;
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute font-semibold text-gradient"
                  initial={{ opacity: 0, y: "-100" }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? { y: 0, opacity: 1 }
                      : {
                          y: titleNumber > index ? -150 : 150,
                          opacity: 0,
                        }
                  }
                >
                  {title}
                </motion.span>
              ))}
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeInUp}
            className="mt-6 text-opti-text-secondary text-lg md:text-xl leading-relaxed tracking-tight max-w-2xl"
          >
            AI-powered daily planning that turns your calendar into a clear,
            actionable timeline. Plan less. Do more.
          </motion.p>

          {/* Hero Card */}
          <motion.div
            variants={heroCardVariants}
            className="mt-12 w-full max-w-4xl perspective-1000"
          >
            <div className="glass-card shadow-card overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Calendar Section */}
                <div className="w-full md:w-[38%] p-6 border-b md:border-b-0 md:border-r border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-opti-accent" />
                    <span className="font-display font-semibold text-opti-text-primary">
                      March
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <span
                        key={day}
                        className="text-opti-text-secondary py-1 font-mono"
                      >
                        {day}
                      </span>
                    ))}
                    {calendarDays.map((day) => (
                      <motion.span
                        key={day}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + day * 0.01 }}
                        className={`py-1 rounded-md cursor-pointer transition-colors ${
                          day === 14
                            ? 'bg-opti-accent text-opti-bg font-semibold'
                            : 'text-opti-text-secondary hover:bg-white/5'
                        }`}
                      >
                        {day}
                      </motion.span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-opti-text-secondary">
                    <div className="w-2 h-2 rounded-full bg-opti-accent" />
                    <span>Today</span>
                  </div>
                </div>

                {/* Agenda Section */}
                <div className="w-full md:w-[62%] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display font-semibold text-opti-text-primary">
                      Today
                    </span>
                    <span className="text-xs text-opti-text-secondary font-mono">
                      3 tasks
                    </span>
                  </div>
                  <div className="space-y-3">
                    {agendaItems.map((item, index) => (
                      <motion.div
                        key={item.title}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors cursor-pointer group"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.type === 'focus'
                              ? 'bg-emerald-400'
                              : 'bg-opti-accent'
                          }`}
                        />
                        <div className="flex-1">
                          <span className="text-opti-text-primary text-sm font-medium group-hover:text-opti-accent transition-colors">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-opti-text-secondary text-xs">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono">{item.time}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="mt-10 flex flex-row gap-3"
          >
            <Button
              size="lg"
              variant="outline"
              className="gap-4 border-white/10 bg-white/5 text-opti-text-primary hover:bg-white/10 hover:text-opti-accent"
              onClick={() => scrollToSection('how-it-works')}
            >
              See how it works <MoveRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              className="gap-4 bg-opti-accent text-opti-bg hover:bg-opti-accent/90 font-semibold"
              onClick={() => navigate('/signup')}
            >
              Get OptiPlan <MoveRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.5 }}
        className="mt-auto pt-8 text-opti-text-secondary text-xs font-mono"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2"
        >
          <span>Scroll to explore</span>
          <div className="w-px h-8 bg-gradient-to-b from-opti-accent to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
