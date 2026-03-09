import { Linkedin, Github, Instagram, type LucideIcon } from "lucide-react";

interface CreatorProfile {
  name: string;
  socials: Array<{
    icon: LucideIcon;
    href: string;
    label: string;
  }>;
}

interface Footer7Props {
  logo?: {
    url: string;
    title: string;
  };
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  creators?: CreatorProfile[];
  copyright?: string;
}

const defaultCreators: CreatorProfile[] = [
  {
    name: "Chen Zi Yau",
    socials: [
      { icon: Linkedin, href: "https://www.linkedin.com/in/chen-zi-yau-174889387/", label: "LinkedIn" },
      { icon: Github, href: "https://github.com/ChenZiYau", label: "GitHub" },
      { icon: Instagram, href: "https://www.instagram.com/yau._.czy/", label: "Instagram" },
    ],
  },
  {
    name: "Resshman Naidu A/L Thanaraju",
    socials: [
      { icon: Linkedin, href: "https://www.linkedin.com/in/resshman-naidu-a-l-thanaraju-3928a2387/", label: "LinkedIn" },
      { icon: Github, href: "https://github.com/Resshman06", label: "GitHub" },
      { icon: Instagram, href: "https://www.instagram.com/ressh_man/", label: "Instagram" },
    ],
  },
];

const defaultSections = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "#features" },
      { name: "How It Works", href: "#how-it-works" },
      { name: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Feedback", href: "#feedback" },
      { name: "Get Early Access", href: "#cta" },
    ],
  },
];

export const Footer7 = ({
  logo = {
    url: "#",
    title: "OptiPlan",
  },
  sections = defaultSections,
  description = "AI-powered daily planning that helps you focus on what matters most. A final year project built with passion.",
  creators = defaultCreators,
  copyright = `© ${new Date().getFullYear()} OptiPlan. All rights reserved.`,
}: Footer7Props) => {
  return (
    <section className="py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          {/* Brand Column */}
          <div className="flex w-full flex-col justify-between gap-6 lg:max-w-sm lg:items-start">
            <div className="flex items-center gap-2 lg:justify-start">
              <a href={logo.url} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-opti-accent to-[#8B5CF6] flex items-center justify-center">
                  <span className="text-opti-bg font-bold text-sm">O</span>
                </div>
                <h2 className="text-xl font-semibold text-opti-text-primary">{logo.title}</h2>
              </a>
            </div>
            <p className="text-sm leading-relaxed text-opti-text-secondary">
              {description}
            </p>
          </div>

          {/* Link Sections */}
          <div className="grid w-full gap-6 md:grid-cols-2 lg:max-w-md lg:gap-16">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold text-opti-text-primary">{section.title}</h3>
                <ul className="space-y-3 text-sm text-opti-text-secondary">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx} className="hover:text-opti-accent transition-colors">
                      <a href={link.href}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Creators Column */}
          <div className="flex w-full flex-col gap-6 lg:max-w-sm">
            <h3 className="font-bold text-opti-text-primary">Built By</h3>
            <div className="flex flex-col gap-5">
              {creators.map((creator, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                  <span className="text-sm font-medium text-opti-text-primary">
                    {creator.name}
                  </span>
                  <ul className="flex items-center gap-2 shrink-0">
                    {creator.socials.map((social, socialIdx) => (
                      <li key={socialIdx}>
                        <a
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${creator.name} - ${social.label}`}
                          className="flex items-center justify-center w-8 h-8 rounded-md text-opti-text-secondary hover:text-opti-accent hover:bg-white/5 transition-colors"
                        >
                          <social.icon className="w-4 h-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/5 pt-8 text-xs text-opti-text-secondary/60 md:flex-row md:items-center">
          <p>{copyright}</p>
          <p>Final Year Project — Built with React, Tailwind CSS & Framer Motion</p>
        </div>
      </div>
    </section>
  );
};
