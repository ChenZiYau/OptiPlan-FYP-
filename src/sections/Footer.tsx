import { motion } from 'framer-motion';
import { footerLinks, socialLinks } from '@/constants/navigation';

export function Footer() {
  return (
    <footer className="relative py-16 border-t border-white/5">
      {/* Background */}
      <div className="absolute inset-0 bg-opti-bg pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <motion.a
              href="#"
              className="flex items-center gap-2 mb-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-opti-accent to-[#8B5CF6] flex items-center justify-center">
                <span className="text-opti-bg font-bold text-sm">O</span>
              </div>
              <span className="font-display font-semibold text-xl text-opti-text-primary">
                OptiPlan
              </span>
            </motion.a>
            <p className="text-opti-text-secondary text-sm leading-relaxed mb-6 max-w-xs">
              AI-powered daily planning that helps you focus on what matters
              most.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-opti-text-secondary hover:text-opti-accent hover:border-opti-accent/30 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display font-semibold text-opti-text-primary mb-4 capitalize">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-opti-text-secondary hover:text-opti-accent transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-opti-text-secondary/60">
            © {new Date().getFullYear()} OptiPlan. All rights reserved.
          </p>
          <p className="text-sm text-opti-text-secondary/60">
            Made with care for productive people everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
