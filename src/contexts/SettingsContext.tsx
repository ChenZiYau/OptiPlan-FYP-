import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export type ThemeKey = 'purple' | 'blue' | 'green' | 'orange' | 'rose' | 'cyan' | 'highVisibility' | 'warm' | 'monochrome';
export type TextScale = 'sm' | 'md' | 'lg' | 'xl';
export type ColorMode = 'dark' | 'light' | 'grey';

export interface Settings {
  theme: ThemeKey;
  colorMode: ColorMode;
  highContrast: boolean;
  textScale: TextScale;
  reduceMotion: boolean;
  dyslexiaFont: boolean;
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
}

// ── Theme palettes ──────────────────────────────────────────────────────────

export const THEMES: Record<ThemeKey, { label: string; primary: string; accent: string; primaryHSL: string; accentHSL: string }> = {
  purple: { label: 'Deep Purple', primary: '#a855f7', accent: '#ec4899', primaryHSL: '271 91% 65%', accentHSL: '330 81% 60%' },
  blue:   { label: 'Midnight Blue', primary: '#3b82f6', accent: '#06b6d4', primaryHSL: '217 91% 60%', accentHSL: '189 94% 43%' },
  green:  { label: 'Forest Green', primary: '#22c55e', accent: '#14b8a6', primaryHSL: '142 71% 45%', accentHSL: '173 80% 40%' },
  orange: { label: 'Sunset Orange', primary: '#f97316', accent: '#eab308', primaryHSL: '25 95% 53%', accentHSL: '48 96% 47%' },
  rose:   { label: 'Rose', primary: '#f43f5e', accent: '#ec4899', primaryHSL: '350 89% 60%', accentHSL: '330 81% 60%' },
  cyan:   { label: 'Cyan', primary: '#06b6d4', accent: '#8b5cf6', primaryHSL: '189 94% 43%', accentHSL: '258 90% 66%' },
  highVisibility: { label: 'High Visibility', primary: '#FACC15', accent: '#FFFFFF', primaryHSL: '48 97% 53%', accentHSL: '0 0% 100%' },
  warm:   { label: 'Warm Tones', primary: '#F59E0B', accent: '#FB923C', primaryHSL: '38 92% 50%', accentHSL: '25 97% 61%' },
  monochrome: { label: 'Monochrome', primary: '#E5E7EB', accent: '#9CA3AF', primaryHSL: '220 13% 91%', accentHSL: '218 11% 65%' },
};

export const STANDARD_THEME_KEYS: ThemeKey[] = ['purple', 'blue', 'green', 'orange', 'rose', 'cyan'];
export const ACCESSIBILITY_THEME_KEYS: ThemeKey[] = ['highVisibility', 'warm', 'monochrome'];

export const TEXT_SCALE_VALUES: Record<TextScale, number> = {
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

// ── Defaults ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'optiplan-settings';

const DEFAULT_SETTINGS: Settings = {
  theme: 'purple',
  colorMode: 'dark',
  highContrast: false,
  textScale: 'md',
  reduceMotion: false,
  dyslexiaFont: false,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

// ── Context ─────────────────────────────────────────────────────────────────

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

// ── Provider ────────────────────────────────────────────────────────────────

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetSettings = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
  };

  // ── Apply theme CSS vars ──────────────────────────────────────────────
  useEffect(() => {
    const theme = THEMES[settings.theme];
    const root = document.documentElement;

    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-primary-hsl', theme.primaryHSL);
    root.style.setProperty('--color-accent-hsl', theme.accentHSL);

    // Extract H, S, L components to dynamically calculate shades in tailwind config
    const [p_h, p_s, p_l] = theme.primaryHSL.split(' ');
    root.style.setProperty('--color-primary-h', p_h);
    root.style.setProperty('--color-primary-s', p_s);
    root.style.setProperty('--color-primary-l', p_l);

    const [a_h, a_s, a_l] = theme.accentHSL.split(' ');
    root.style.setProperty('--color-accent-h', a_h);
    root.style.setProperty('--color-accent-s', a_s);
    root.style.setProperty('--color-accent-l', a_l);

    // Helper to convert hex to rgb string for rgba() tailwind usage
    const hexToRgbStr = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '167, 139, 250'; // Default purple
    };

    const primaryRgbStr = hexToRgbStr(theme.primary);
    root.style.setProperty('--color-primary-014', `rgba(${primaryRgbStr}, 0.14)`);
    root.style.setProperty('--color-primary-018', `rgba(${primaryRgbStr}, 0.18)`);
    root.style.setProperty('--color-primary-030', `rgba(${primaryRgbStr}, 0.3)`);

  }, [settings.theme]);

  // ── Apply color mode class ──────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('color-mode-light', 'color-mode-grey');
    if (settings.colorMode === 'light') {
      root.classList.add('color-mode-light');
    } else if (settings.colorMode === 'grey') {
      root.classList.add('color-mode-grey');
    }
  }, [settings.colorMode]);

  // ── Apply accessibility classes ───────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;

    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);

    // Reduce motion
    root.classList.toggle('reduce-motion', settings.reduceMotion);

    // Dyslexia font
    root.classList.toggle('dyslexia-font', settings.dyslexiaFont);
  }, [settings.highContrast, settings.reduceMotion, settings.dyslexiaFont]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
