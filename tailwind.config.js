/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        purple: {
          50: 'hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) + 40%))',
          100: 'hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) + 30%))',
          200: 'hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) + 20%))',
          300: 'hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) + 10%))',
          400: 'hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) + 5%))',
          500: 'hsl(var(--color-primary-h) var(--color-primary-s) var(--color-primary-l))',
          600: 'hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) - 5%))',
          700: 'hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) - 15%))',
          800: 'hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) - 25%))',
          900: 'hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) - 35%))',
          950: 'hsl(var(--color-primary-h) var(--color-primary-s) calc(var(--color-primary-l) - 45%))',
        },
        pink: {
          50: 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 40%))',
          100: 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 30%))',
          200: 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 20%))',
          300: 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 10%))',
          400: 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 5%))',
          500: 'hsl(var(--color-accent-h) var(--color-accent-s) var(--color-accent-l))',
          600: 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 5%))',
          700: 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 15%))',
          800: 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 25%))',
          900: 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 35%))',
          950: 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) - 45%))',
        },
        // Custom OptiPlan colors
        opti: {
          bg: '#07040A',
          'bg-secondary': '#120B1D',
          surface: '#1a1625',
          accent: 'var(--color-accent)', // Replaced hardcoded purple with css variable
          'accent-light': 'hsl(var(--color-accent-h) var(--color-accent-s) calc(var(--color-accent-l) + 15%))',
          'text-primary': '#F6F3FB',
          'text-secondary': '#B8B0C8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '28px',
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'card': '0 24px 80px rgba(0, 0, 0, 0.55)',
        'glow': '0 0 60px var(--color-primary-018)', // Swapped static purple with var
        'glow-strong': '0 0 80px var(--color-primary-030)', // Swapped static purple with var
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.03)", opacity: "1" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "blink": "blink 1.6s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at 50% 0%, var(--color-primary-014), rgba(0, 0, 0, 0) 60%)',
        'gradient-accent': 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
