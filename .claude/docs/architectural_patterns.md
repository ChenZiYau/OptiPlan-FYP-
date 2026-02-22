# Architectural Patterns

Recurring patterns observed across multiple files in the OptiPlan codebase.

## 1. Section-Based Page Composition

The app is a single-page landing composed of independent section components stacked vertically in `src/App.tsx:11-44`. Each section:
- Is a standalone file in `src/sections/`
- Owns its own data, layout, state, and animations
- Receives no props (fully self-contained)
- Uses a consistent outer container with full-width padding

## 2. Animation Wrapper Pattern

Rather than applying Framer Motion directly to every element, the codebase provides reusable wrappers in `src/components/AnimatedSection.tsx`:

- **`AnimatedSection`** — Wraps a section with fade + slide-up on scroll via `whileInView`
- **`StaggerContainer`** — Parent that staggers children animations with configurable delay
- **`StaggerItem`** — Child element that animates within a stagger group

These are used in: `Features.tsx`, `HowItWorks.tsx`, `Testimonials.tsx`, `FAQ.tsx`, `FeedbackForm.tsx`.

Sections that need more control (Hero, Navbar) use Framer Motion directly with `useAnimation` controls and custom variants.

### Animation Conventions
- Duration range: 0.3s–0.9s
- Standard easing: `[0.25, 0.1, 0.25, 1]`
- Stagger delay: 0.08s–0.15s
- Viewport trigger margin: `"-100px"` to `"-50px"`

## 3. Data-Driven Content Rendering

Content is defined as typed arrays, then mapped to UI. This pattern appears in:
- `src/sections/Features.tsx:12-55` — features array with icon, title, description
- `src/sections/HowItWorks.tsx` — steps array
- `src/sections/Testimonials.tsx` — testimonials array
- `src/sections/FAQ.tsx` — FAQ items array
- `src/sections/Footer.tsx` — link groups

Benefits: Content updates don't require touching component logic. Adding items is append-only.

## 4. Glass-Morphism Component Pattern

Visual cards use a consistent glass-morphism style:
- `src/components/GlassCard.tsx` — Reusable wrapper with `backdrop-filter: blur(20px)`, semi-transparent background, border, and hover scale animation
- `src/index.css` — `.glass-card` CSS class in `@layer components` for non-React usage
- Applied in: Features cards, HowItWorks steps, Testimonials cards

## 5. Custom Hook Abstractions

Common browser interactions are extracted into hooks in `src/hooks/`:

| Hook | Purpose | Used In |
|------|---------|---------|
| `useSmoothScroll` | Scrolls to element by section ID | Navbar, Hero |
| `useInView` | Intersection Observer for visibility detection | Multiple sections |
| `useScrollProgress` | Tracks page scroll position (0–1) | Navbar background opacity |
| `useIsMobile` | Returns boolean for `<768px` breakpoint | Navbar mobile menu |

All scroll-related hooks use passive event listeners and `requestAnimationFrame` for performance (`useSmoothScroll.ts`, `useScrollProgress.ts`).

## 6. Form Handling Pattern

Both form sections (`CTA.tsx`, `FeedbackForm.tsx`) follow the same pattern:

1. **State shape**: `useState` for each of: form data, field errors object, `isSubmitting`, success boolean
2. **Validation**: Standalone `validate()` function checks fields, populates error state, returns boolean
3. **Error clearing**: `onChange` handlers clear the specific field's error
4. **Submit flow**: `setIsSubmitting(true)` → simulated API call via `setTimeout` → success state or error state → `setIsSubmitting(false)`
5. **UI feedback**: Spinner icon during submit, checkmark on success, inline error messages per field

Note: `react-hook-form` + `zod` are installed but not yet used — current forms use manual validation.

## 7. Responsive Layout Pattern

Consistent responsive grid across sections:
- **Mobile** (default): Single column, stacked layout
- **Tablet** (`md:`): 2-column grid
- **Desktop** (`lg:`): 3-column grid or side-by-side layouts

The `HowItWorks` section uses alternating `lg:flex-row` / `lg:flex-row-reverse` for visual variety.

Navbar switches between desktop links and a mobile hamburger menu using `useIsMobile` hook + `useState` toggle.

## 8. Button Variant Pattern

`src/components/GlowButton.tsx` uses Framer Motion variants for two button styles:
- **primary**: Gradient background with animated glow shadow
- **secondary**: Transparent with border, subtle hover glow

Both include `whileHover` and `whileTap` motion props for micro-interactions.

## 9. Theme System

Colors are defined in two layers:
- **CSS variables** in `src/index.css` using HSL values (shadcn convention) for the `ui/` components
- **`opti-*` palette** in `tailwind.config.js:51-60` for custom section styling

This dual system exists because shadcn components reference CSS variables while custom components use the `opti-*` Tailwind classes directly.
