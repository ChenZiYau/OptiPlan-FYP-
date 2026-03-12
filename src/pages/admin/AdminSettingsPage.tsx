import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Save, Check, Sun, Moon, Monitor, Type, Loader2,
  FileEdit, ExternalLink, RotateCcw,
} from 'lucide-react';
import {
  THEMES, STANDARD_THEME_KEYS, ACCESSIBILITY_THEME_KEYS,
  type ThemeKey, type ColorMode, type TextScale,
} from '@/contexts/SettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { updateSiteContent } from '@/hooks/useAdminData';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// ── Types ───────────────────────────────────────────────────────────────────

interface SiteSettings {
  defaultTheme: ThemeKey;
  defaultColorMode: ColorMode;
  defaultTextScale: TextScale;
  defaultHighContrast: boolean;
  defaultReduceMotion: boolean;
  defaultDyslexiaFont: boolean;
}

const INITIAL_DEFAULTS: SiteSettings = {
  defaultTheme: 'purple',
  defaultColorMode: 'dark',
  defaultTextScale: 'md',
  defaultHighContrast: false,
  defaultReduceMotion: false,
  defaultDyslexiaFont: false,
};

const COLOR_MODES: { key: ColorMode; label: string; icon: typeof Moon; bg: string; surface: string; text: string; border: string }[] = [
  { key: 'dark', label: 'Dark', icon: Moon, bg: '#0B0A1A', surface: '#18162e', text: '#FFFFFF', border: 'rgba(255,255,255,0.1)' },
  { key: 'light', label: 'Light', icon: Sun, bg: '#F8F9FA', surface: '#FFFFFF', text: '#1A1A2E', border: 'rgba(0,0,0,0.1)' },
  { key: 'grey', label: 'Grey', icon: Monitor, bg: '#2D2D3A', surface: '#3A3A4A', text: '#E5E5E5', border: 'rgba(255,255,255,0.12)' },
];

const TEXT_SCALE_OPTIONS: { key: TextScale; label: string }[] = [
  { key: 'sm', label: 'Small' },
  { key: 'md', label: 'Medium' },
  { key: 'lg', label: 'Large' },
  { key: 'xl', label: 'Extra Large' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#18162e] border border-white/10 p-6 mb-6">
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-5">{description}</p>}
      {!description && <div className="mb-5" />}
      {children}
    </div>
  );
}

function ToggleSwitch({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
          enabled ? 'bg-purple-500' : 'bg-white/10'
        }`}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function AdminSettingsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_DEFAULTS);
  const [original, setOriginal] = useState<SiteSettings>(INITIAL_DEFAULTS);

  // Fetch current settings from Supabase
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('site_content')
          .select('content')
          .eq('section_key', 'site_settings')
          .single();
        if (!cancelled && data?.content) {
          const loaded = { ...INITIAL_DEFAULTS, ...data.content } as SiteSettings;
          setSettings(loaded);
          setOriginal(loaded);
        }
      } catch { /* use defaults */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteContent(
        'site_settings',
        { content: settings as unknown as Record<string, unknown> },
        profile?.id ?? '',
        profile?.display_name ?? 'Admin',
        original as unknown as Record<string, unknown>,
      );
      setOriginal({ ...settings });
      toast.success('Site defaults saved!', { description: 'New visitors will see these settings.' });
    } catch (err: unknown) {
      toast.error('Failed to save', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(INITIAL_DEFAULTS);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      {/* Info banner */}
      <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 mb-6 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-purple-300 text-sm">💡</span>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Default Site Settings</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Configure the default appearance for new visitors who haven't customized their preferences.
            Users can override these from the Settings page.
          </p>
        </div>
      </div>

      {/* Default Theme */}
      <SectionCard title="Default Color Theme" description="The theme new visitors will see when they first visit the site">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Standard Themes</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {STANDARD_THEME_KEYS.map(key => {
            const theme = THEMES[key];
            const isActive = settings.defaultTheme === key;
            return (
              <button
                key={key}
                onClick={() => setSettings(s => ({ ...s, defaultTheme: key }))}
                className={`relative group rounded-xl p-3 border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-white/40 bg-white/5'
                    : 'border-white/5 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-[#0B0A1A]" />
                  </div>
                )}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.accent }} />
                </div>
                <p className="text-[10px] font-bold text-white text-left truncate">{theme.label}</p>
              </button>
            );
          })}
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Accessibility Themes</p>
        <div className="grid grid-cols-3 gap-3">
          {ACCESSIBILITY_THEME_KEYS.map(key => {
            const theme = THEMES[key];
            const isActive = settings.defaultTheme === key;
            return (
              <button
                key={key}
                onClick={() => setSettings(s => ({ ...s, defaultTheme: key }))}
                className={`relative group rounded-xl p-3 border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-white/40 bg-white/5'
                    : 'border-white/5 hover:border-white/20 bg-white/[0.02]'
                }`}
              >
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-[#0B0A1A]" />
                  </div>
                )}
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.accent }} />
                </div>
                <p className="text-[10px] font-bold text-white text-left">{theme.label}</p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Default Color Mode */}
      <SectionCard title="Default Color Mode" description="Background appearance for new visitors">
        <div className="grid grid-cols-3 gap-3">
          {COLOR_MODES.map(mode => {
            const isActive = settings.defaultColorMode === mode.key;
            const Icon = mode.icon;
            return (
              <button
                key={mode.key}
                onClick={() => setSettings(s => ({ ...s, defaultColorMode: mode.key }))}
                className={`relative group rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                  isActive ? 'border-white/40' : 'border-white/5 hover:border-white/20'
                }`}
              >
                <div className="p-3 pb-2" style={{ backgroundColor: mode.bg }}>
                  <div className="flex gap-1.5 mb-2">
                    <div className="w-6 h-full rounded" style={{ backgroundColor: mode.surface, border: `1px solid ${mode.border}`, minHeight: 28 }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: `${mode.text}22` }} />
                      <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: `${mode.text}15` }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 py-2.5 bg-white/[0.03]">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-bold text-white">{mode.label}</span>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#0B0A1A]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Default Text Scale */}
      <SectionCard title="Default Text Size" description="Base font size for new visitors">
        <div className="flex bg-white/[0.03] rounded-xl p-1 gap-1">
          {TEXT_SCALE_OPTIONS.map(opt => {
            const active = settings.defaultTextScale === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSettings(s => ({ ...s, defaultTextScale: opt.key }))}
                className={`flex-1 relative px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active ? 'text-white bg-purple-500/20 border border-purple-500/30' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Default Accessibility */}
      <SectionCard title="Default Accessibility" description="Accessibility defaults for new visitors">
        <ToggleSwitch
          enabled={settings.defaultHighContrast}
          onChange={v => setSettings(s => ({ ...s, defaultHighContrast: v }))}
          label="High Contrast Mode"
          description="Increase border and text contrast for better visibility"
        />
        <div className="border-t border-white/5" />
        <ToggleSwitch
          enabled={settings.defaultReduceMotion}
          onChange={v => setSettings(s => ({ ...s, defaultReduceMotion: v }))}
          label="Reduce Motion"
          description="Disable animations and page transitions"
        />
        <div className="border-t border-white/5" />
        <ToggleSwitch
          enabled={settings.defaultDyslexiaFont}
          onChange={v => setSettings(s => ({ ...s, defaultDyslexiaFont: v }))}
          label="Dyslexia-Friendly Font"
          description="Switch to a more readable font with increased letter spacing"
        />
      </SectionCard>

      {/* Quick links */}
      <SectionCard title="Quick Links">
        <Link
          to="/admin/content"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <FileEdit className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Website Content</p>
            <p className="text-xs text-gray-500">Edit landing page sections, text, and visibility</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        </Link>
      </SectionCard>

      {/* Action buttons */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Reset to Defaults
        </button>

        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Defaults
        </button>
      </div>
    </motion.div>
  );
}
