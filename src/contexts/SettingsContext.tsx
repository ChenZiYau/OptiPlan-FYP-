import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export type ThemeKey = 'purple' | 'blue' | 'green' | 'orange' | 'rose' | 'cyan';
export type TextScale = 'sm' | 'md' | 'lg' | 'xl';

export interface Settings {
  theme: ThemeKey;
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
};

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
  }, [settings.theme]);

  // ── Apply accessibility classes ───────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;

    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);

    // Text scale
    root.style.fontSize = `${TEXT_SCALE_VALUES[settings.textScale]}px`;

    // Reduce motion
    root.classList.toggle('reduce-motion', settings.reduceMotion);

    // Dyslexia font
    root.classList.toggle('dyslexia-font', settings.dyslexiaFont);
  }, [settings.highContrast, settings.textScale, settings.reduceMotion, settings.dyslexiaFont]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
