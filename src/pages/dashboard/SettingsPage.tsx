import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Palette, Accessibility, Type,
  Shield, Phone, Lock, Mail, Save, RotateCcw, Check, Sun, Moon, Monitor,
  Camera, Loader2,
} from 'lucide-react';
import { useSettings, THEMES, STANDARD_THEME_KEYS, ACCESSIBILITY_THEME_KEYS, type TextScale, type ColorMode } from '@/contexts/SettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ── Types ───────────────────────────────────────────────────────────────────

type SettingsTab = 'account' | 'appearance' | 'accessibility';

const TABS: { key: SettingsTab; label: string; icon: typeof User }[] = [
  { key: 'account', label: 'My Account', icon: User },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility },
];

const TEXT_SCALE_OPTIONS: { key: TextScale; label: string }[] = [
  { key: 'sm', label: 'Small' },
  { key: 'md', label: 'Medium' },
  { key: 'lg', label: 'Large' },
  { key: 'xl', label: 'Extra Large' },
];

// ── Component ───────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, appearance, and accessibility preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Left nav */}
        <div className="w-[200px] shrink-0">
          <nav className="space-y-1 sticky top-6">
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-purple-500/15 text-white border border-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${active ? 'text-purple-400' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'account' && <AccountTab key="account" />}
            {activeTab === 'appearance' && <AppearanceTab key="appearance" />}
            {activeTab === 'accessibility' && <AccessibilityTab key="accessibility" />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── Shared UI helpers ───────────────────────────────────────────────────────

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

function UnsavedChangesBar({ hasChanges, onSave, onDiscard }: { hasChanges: boolean; onSave: () => void; onDiscard: () => void }) {
  return (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="sticky bottom-4 mt-6 flex items-center justify-between rounded-xl bg-[#1a1735] border border-purple-500/30 p-4 shadow-lg shadow-purple-500/10"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <p className="text-sm font-bold text-white">You have unsaved changes</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onDiscard}
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              Discard
            </button>
            <button
              onClick={onSave}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InputField({ label, icon: Icon, type = 'text', placeholder, value, onChange, disabled }: {
  label: string; icon: typeof Mail; type?: string; placeholder: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-11 pr-4 py-2.5 text-sm bg-[#0B0A1A] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

// ── Tab: My Account ─────────────────────────────────────────────────────────

function AccountTab() {
  const { profile, updateProfile, updatePassword, uploadAvatar } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [username, setUsername] = useState(profile?.display_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [twoFA, setTwoFA] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (() => {
    const name = profile?.display_name;
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    return 'U';
  })();

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast.success('Avatar updated!');
    } catch (err: any) {
      toast.error('Failed to upload avatar', { description: err.message });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ display_name: username });
      toast.success('Profile saved!', { description: 'Your changes have been applied.' });
    } catch (err: any) {
      toast.error('Failed to save profile', { description: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    setChangingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success('Password updated!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error('Failed to change password', { description: err.message });
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar Section */}
      <SectionCard title="Avatar" description="Upload a profile picture">
        <div className="flex items-center gap-5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative w-20 h-20 rounded-full overflow-hidden group shrink-0"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
          </button>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {uploadingAvatar ? 'Uploading...' : 'Upload New'}
            </button>
            <p className="text-xs text-gray-500 mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </SectionCard>

      <SectionCard title="Profile" description="Update your personal information">
        {isAdmin && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">Admin credentials are locked and cannot be modified.</p>
          </div>
        )}
        <InputField label="Username" icon={User} placeholder="Your display name" value={username} onChange={setUsername} disabled={isAdmin} />
        <InputField label="Email" icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={setEmail} disabled />
        <button
          onClick={handleSave}
          disabled={saving || isAdmin}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
        </button>
      </SectionCard>

      <SectionCard title="Security" description="Manage your password and login methods">
        {isAdmin && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300">Admin credentials are locked and cannot be modified.</p>
          </div>
        )}
        <InputField label="Current Password" icon={Lock} type="password" placeholder="••••••••" value={currentPassword} onChange={setCurrentPassword} disabled={isAdmin} />
        <InputField label="New Password" icon={Shield} type="password" placeholder="Enter new password" value={newPassword} onChange={setNewPassword} disabled={isAdmin} />
        <button
          onClick={handleChangePassword}
          disabled={changingPassword || isAdmin}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Change Password
        </button>

        <div className="pt-4 border-t border-white/10 space-y-1">
          <InputField label="Phone Number" icon={Phone} type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={setPhone} />
          <ToggleSwitch
            enabled={twoFA}
            onChange={v => { setTwoFA(v); toast.success(v ? '2FA enabled' : '2FA disabled'); }}
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
          />
        </div>
      </SectionCard>
    </motion.div>
  );
}

// ── Color mode mockup data ───────────────────────────────────────────────────

const COLOR_MODES: { key: ColorMode; label: string; icon: typeof Moon; bg: string; surface: string; text: string; border: string }[] = [
  { key: 'dark', label: 'Dark', icon: Moon, bg: '#0B0A1A', surface: '#18162e', text: '#FFFFFF', border: 'rgba(255,255,255,0.1)' },
  { key: 'light', label: 'Light', icon: Sun, bg: '#F8F9FA', surface: '#FFFFFF', text: '#1A1A2E', border: 'rgba(0,0,0,0.1)' },
  { key: 'grey', label: 'Grey', icon: Monitor, bg: '#2D2D3A', surface: '#3A3A4A', text: '#E5E5E5', border: 'rgba(255,255,255,0.12)' },
];

// ── Tab: Appearance ─────────────────────────────────────────────────────────

function AppearanceTab() {
  const { settings, updateSettings } = useSettings();

  // Draft state — changes are only applied when the user clicks Save
  const [draftColorMode, setDraftColorMode] = useState<ColorMode>(settings.colorMode);
  const [draftTheme, setDraftTheme] = useState(settings.theme);

  // Sync draft when saved settings change externally (e.g. reset from another tab)
  useEffect(() => {
    setDraftColorMode(settings.colorMode);
    setDraftTheme(settings.theme);
  }, [settings.colorMode, settings.theme]);

  const hasChanges = draftColorMode !== settings.colorMode || draftTheme !== settings.theme;

  const handleSave = () => {
    updateSettings({ colorMode: draftColorMode, theme: draftTheme });
    toast.success('Appearance settings saved!', { description: 'Your theme and color mode have been applied.' });
  };

  const handleDiscard = () => {
    setDraftColorMode(settings.colorMode);
    setDraftTheme(settings.theme);
  };

  // Preview uses draft (unsaved) values so user can see before committing
  const previewTheme = THEMES[draftTheme];
  const previewMode = COLOR_MODES.find(m => m.key === draftColorMode) ?? COLOR_MODES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      {/* Live Preview */}
      <SectionCard title="Theme Preview" description="See how your chosen theme looks before saving">
        <div
          className="rounded-xl border p-5 transition-colors duration-300"
          style={{ backgroundColor: previewMode.bg, borderColor: previewMode.border }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ backgroundColor: previewTheme.primary, color: previewMode.bg }}
            >
              AD
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: previewMode.text }}>Admin</span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${previewTheme.primary}20`, color: previewTheme.primary }}
                >
                  ADMINISTRATOR
                </span>
                <span className="text-[10px]" style={{ color: `${previewMode.text}66` }}>Today at 10:30 PM</span>
              </div>
              <p className="text-sm mt-1" style={{ color: `${previewMode.text}BB` }}>
                This is an example of how this theme looks. The accent colors update across the entire dashboard.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
                  style={{ backgroundColor: `${previewTheme.primary}15`, color: previewTheme.primary }}
                >
                  👍 3
                </button>
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
                  style={{ backgroundColor: `${previewTheme.accent}15`, color: previewTheme.accent }}
                >
                  🎉 1
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Color Mode Selector */}
      <SectionCard title="Color Mode" description="Choose between dark, light, or grey dashboard background">
        <div className="grid grid-cols-3 gap-3">
          {COLOR_MODES.map(mode => {
            const isActive = draftColorMode === mode.key;
            const Icon = mode.icon;
            return (
              <button
                key={mode.key}
                onClick={() => setDraftColorMode(mode.key)}
                className={`relative group rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'border-white/40'
                    : 'border-white/5 hover:border-white/20'
                }`}
              >
                {/* Mini mockup */}
                <div className="p-3 pb-2" style={{ backgroundColor: mode.bg }}>
                  <div className="flex gap-1.5 mb-2">
                    <div className="w-6 h-full rounded" style={{ backgroundColor: mode.surface, border: `1px solid ${mode.border}`, minHeight: 28 }} />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: `${mode.text}22` }} />
                      <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: `${mode.text}15` }} />
                    </div>
                  </div>
                </div>
                {/* Label */}
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

      {/* Standard Color Themes */}
      <SectionCard title="Color Theme" description="Choose your preferred color palette">
        <div className="grid grid-cols-3 gap-3">
          {STANDARD_THEME_KEYS.map(key => {
            const theme = THEMES[key];
            const isActive = draftTheme === key;
            return (
              <button
                key={key}
                onClick={() => setDraftTheme(key)}
                className={`relative group rounded-xl p-4 border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-white/40 bg-white/5'
                    : 'border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#0B0A1A]" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.accent }} />
                </div>
                <p className="text-xs font-bold text-white text-left">{theme.label}</p>
                <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.accent})` }} />
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Accessibility Themes */}
      <SectionCard title="Accessibility Themes" description="Color palettes optimized for visual impairments">
        <div className="grid grid-cols-3 gap-3">
          {ACCESSIBILITY_THEME_KEYS.map(key => {
            const theme = THEMES[key];
            const isActive = draftTheme === key;
            const descriptions: Record<string, string> = {
              highVisibility: 'For low vision',
              warm: 'Reduced blue light',
              monochrome: 'Color-blind friendly',
            };
            return (
              <button
                key={key}
                onClick={() => setDraftTheme(key)}
                className={`relative group rounded-xl p-4 border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-white/40 bg-white/5'
                    : 'border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#0B0A1A]" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.accent }} />
                </div>
                <p className="text-xs font-bold text-white text-left">{theme.label}</p>
                <p className="text-[10px] text-gray-500 text-left mt-0.5">{descriptions[key]}</p>
                <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.accent})` }} />
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Save bar */}
      <UnsavedChangesBar hasChanges={hasChanges} onSave={handleSave} onDiscard={handleDiscard} />
    </motion.div>
  );
}

// ── Tab: Accessibility ──────────────────────────────────────────────────────

function AccessibilityTab() {
  const { settings, updateSettings, resetSettings } = useSettings();

  // Draft state — changes are only applied when the user clicks Save
  const [draftHighContrast, setDraftHighContrast] = useState(settings.highContrast);
  const [draftReduceMotion, setDraftReduceMotion] = useState(settings.reduceMotion);
  const [draftDyslexiaFont, setDraftDyslexiaFont] = useState(settings.dyslexiaFont);
  const [draftTextScale, setDraftTextScale] = useState<TextScale>(settings.textScale);

  // Sync draft when saved settings change externally (e.g. reset)
  useEffect(() => {
    setDraftHighContrast(settings.highContrast);
    setDraftReduceMotion(settings.reduceMotion);
    setDraftDyslexiaFont(settings.dyslexiaFont);
    setDraftTextScale(settings.textScale);
  }, [settings.highContrast, settings.reduceMotion, settings.dyslexiaFont, settings.textScale]);

  const hasChanges =
    draftHighContrast !== settings.highContrast ||
    draftReduceMotion !== settings.reduceMotion ||
    draftDyslexiaFont !== settings.dyslexiaFont ||
    draftTextScale !== settings.textScale;

  const handleSave = () => {
    updateSettings({
      highContrast: draftHighContrast,
      reduceMotion: draftReduceMotion,
      dyslexiaFont: draftDyslexiaFont,
      textScale: draftTextScale,
    });
    toast.success('Accessibility settings saved!', { description: 'Your changes have been applied.' });
  };

  const handleDiscard = () => {
    setDraftHighContrast(settings.highContrast);
    setDraftReduceMotion(settings.reduceMotion);
    setDraftDyslexiaFont(settings.dyslexiaFont);
    setDraftTextScale(settings.textScale);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <SectionCard title="Visual Accessibility" description="Customize the display for your comfort and needs">
        <ToggleSwitch
          enabled={draftHighContrast}
          onChange={setDraftHighContrast}
          label="High Contrast Mode"
          description="Increase border and text contrast for better visibility"
        />
        <div className="border-t border-white/5" />

        <ToggleSwitch
          enabled={draftReduceMotion}
          onChange={setDraftReduceMotion}
          label="Reduce Motion"
          description="Disable animations and page transitions"
        />
        <div className="border-t border-white/5" />

        <ToggleSwitch
          enabled={draftDyslexiaFont}
          onChange={setDraftDyslexiaFont}
          label="Dyslexia-Friendly Font"
          description="Switch to a more readable font with increased letter spacing"
        />
      </SectionCard>

      <SectionCard title="Text Size" description="Adjust the base font size across the dashboard">
        <div className="flex bg-white/[0.03] rounded-xl p-1 gap-1">
          {TEXT_SCALE_OPTIONS.map(opt => {
            const active = draftTextScale === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setDraftTextScale(opt.key)}
                className={`flex-1 relative px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="text-scale-bg"
                    className="absolute inset-0 bg-purple-500/20 border border-purple-500/30 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <div className="mt-4 rounded-xl bg-[#0B0A1A] border border-white/10 p-5">
          <p className="text-gray-400" style={{ fontSize: `${({ sm: 14, md: 16, lg: 18, xl: 20 })[draftTextScale]}px` }}>
            This is a preview of how your text will appear at the <strong className="text-white font-bold">{TEXT_SCALE_OPTIONS.find(o => o.key === draftTextScale)?.label}</strong> size setting. Readability is our top priority.
          </p>
        </div>
      </SectionCard>

      {/* Save bar */}
      <UnsavedChangesBar hasChanges={hasChanges} onSave={handleSave} onDiscard={handleDiscard} />

      {/* Reset */}
      <div className="flex justify-end mt-2">
        <button
          onClick={() => { resetSettings(); toast.success('Settings reset to defaults'); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Reset All Settings
        </button>
      </div>
    </motion.div>
  );
}
