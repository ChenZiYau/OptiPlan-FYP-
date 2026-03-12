import { motion } from 'framer-motion';
import { Github, Linkedin, Instagram, ArrowUpRight } from 'lucide-react';

const teamMembers = [
  {
    name: 'Chen Zi Yau',
    socials: [
      { icon: Linkedin, href: 'https://www.linkedin.com/in/chen-zi-yau-174889387/', label: 'LinkedIn' },
      { icon: Github, href: 'https://github.com/ChenZiYau', label: 'GitHub' },
      { icon: Instagram, href: 'https://www.instagram.com/yau._.czy/', label: 'Instagram' },
    ],
  },
  {
    name: 'Resshman Naidu A/L Thanaraju',
    socials: [
      { icon: Linkedin, href: 'https://www.linkedin.com/in/resshman-naidu-a-l-thanaraju-3928a2387/', label: 'LinkedIn' },
      { icon: Github, href: 'https://github.com/Resshman06', label: 'GitHub' },
      { icon: Instagram, href: 'https://www.instagram.com/ressh_man/', label: 'Instagram' },
    ],
  },
];

const quickLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Feedback', href: '#feedback' },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 pt-16 pb-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-opti-bg pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">

          {/* Brand Column */}
          <div className="col-span-1 md:col-span-5 flex flex-col gap-5">
            <motion.div
              className="flex items-center gap-2.5"
              whileHover={{ scale: 1.02 }}
            >
              <img src="/logo2.png" alt="OptiPlan" className="h-12 w-auto" />
            </motion.div>

            <p className="text-sm text-opti-text-secondary leading-relaxed max-w-sm">
              AI-powered daily planning built for students. Focus on what
              matters most — we handle the rest.
            </p>

            <p className="text-xs font-mono text-opti-text-secondary/50 mt-1">
              Final Year Project &middot; {new Date().getFullYear()}
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
            <h4 className="text-xs font-mono font-semibold text-opti-text-primary/70 uppercase tracking-widest">
              Navigate
            </h4>
            <ul className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm font-mono text-opti-text-secondary hover:text-opti-accent transition-colors flex items-center gap-2 group w-fit"
                  >
                    <span className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-opti-accent transition-all group-hover:w-4 duration-200" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Team Members */}
          <div className="col-span-1 md:col-span-5 flex flex-col gap-6">
            <h4 className="text-xs font-mono font-semibold text-opti-text-primary/70 uppercase tracking-widest">
              Built By
            </h4>

            <div className="flex flex-col gap-5">
              {teamMembers.map((member) => (
                <div key={member.name} className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-opti-text-primary">
                    {member.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {member.socials.map((social) => (
                      <motion.a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.15, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-opti-text-secondary hover:text-opti-accent hover:border-opti-accent/30 transition-colors"
                        aria-label={`${member.name} — ${social.label}`}
                      >
                        <social.icon className="w-4 h-4" />
                      </motion.a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
          <p className="text-xs text-opti-text-secondary/40 font-mono">
            &copy; {new Date().getFullYear()} OptiPlan &middot; All rights reserved
          </p>

          <div className="flex items-center gap-6">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/5 border border-green-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] uppercase font-medium text-green-500/80 tracking-wider">
                All Systems Normal
              </span>
            </div>

            {/* Back to Top */}
            <motion.button
              onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 text-xs font-mono text-opti-text-secondary/60 hover:text-opti-accent transition-colors"
            >
              Back to top
              <ArrowUpRight className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
