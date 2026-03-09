# OptiPlan SaaS Landing Page

AI-powered daily planning tool landing page. Converts visitors into early-access signups through a section-based funnel: Hero → Features → How It Works → Testimonials → FAQ → CTA.

## Tech Stack

- **Framework**: React 19 + TypeScript 5.9
- **Build**: Vite 7
- **Styling**: Tailwind CSS 3 with custom theme (dark glassmorphism aesthetic)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Animation**: Framer Motion 12
- **Icons**: lucide-react
- **Forms**: react-hook-form + zod (available but sections use manual validation currently)
- **HTTP**: axios (stubbed, not yet wired to real API)
- **Fonts**: Geist Sans (global sans-serif via `@fontsource/geist-sans`), IBM Plex Mono (monospace)

## Project Structure

```
src/
├── main.tsx              # Entry point
├── App.tsx               # Root - composes all sections vertically
├── index.css             # Tailwind directives, CSS variables, custom component classes
├── sections/             # Page sections (Navbar, Hero, Features, HowItWorks,
│                         #   Testimonials, FAQ, FeedbackForm, CTA, Footer)
├── components/           # Reusable components
│   ├── AnimatedSection.tsx  # Scroll-triggered animation wrappers
│   ├── GlassCard.tsx        # Glass-morphism card with hover effects
│   ├── GlowButton.tsx       # Primary/secondary button with glow
│   └── ui/                  # shadcn components (40+, auto-generated)
├── hooks/                # Custom hooks
│   ├── useSmoothScroll.ts   # Smooth scroll-to-section by ID
│   ├── useInView.ts         # Intersection Observer wrapper
│   ├── useScrollProgress.ts # Scroll position tracking
│   └── use-mobile.ts        # Mobile breakpoint detection
└── lib/
    └── utils.ts          # cn() helper (clsx + tailwind-merge)
```

### Key Config Files

- `tailwind.config.js` — Custom `opti` color palette (lines 51-60), font families, animations
- `components.json` — shadcn/ui configuration
- `vite.config.ts` — `@/` path alias to `./src/`
- `tsconfig.json` — Path aliases, strict mode

## Commands

```bash
npm run dev       # Vite dev server with HMR
npm run build     # tsc + vite build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Key Conventions

- **Path alias**: All imports use `@/` → `./src/`
- **Sections are self-contained**: Each section in `src/sections/` owns its own data, layout, and animations
- **Data-driven rendering**: Content arrays (features, testimonials, FAQs) defined inline, mapped to UI
- **Animation wrappers**: Use `AnimatedSection`, `StaggerContainer`, `StaggerItem` from `components/AnimatedSection.tsx` for scroll-triggered animations
- **Custom theme colors**: Use `opti-*` Tailwind classes (e.g., `bg-opti-bg`, `text-opti-accent`)
- **No global state**: Local `useState` only; no Redux/Zustand
- **API calls are stubbed**: CTA and FeedbackForm use `setTimeout` simulations with commented axios calls

## API Endpoints (Stubbed)

- `POST https://api.optiplan.app/waitlist` — Email signup (see `src/sections/CTA.tsx`)
- `POST https://api.optiplan.app/feedback` — Feedback form (see `src/sections/FeedbackForm.tsx`)

## Additional Documentation

When working on specialized topics, check these files:

- [Architectural Patterns](.claude/docs/architectural_patterns.md) — Component composition, animation system, form handling, responsive design patterns used across the codebase
