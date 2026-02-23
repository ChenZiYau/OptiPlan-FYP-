import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Palette, Accessibility, Type,
  Shield, Phone, Lock, Mail, Save, RotateCcw, Check,
} from 'lucide-react';
import { useSettings, THEMES, type ThemeKey, type TextScale } from '@/contexts/SettingsContext';
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
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
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
        <p className="text-sm font-medium text-white">{label}</p>
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

function InputField({ label, icon: Icon, type = 'text', placeholder, value, onChange, disabled }: {
  label: string; icon: typeof Mail; type?: string; placeholder: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">{label}</label>
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
  const { profile } = useAuth();
  const [username, setUsername] = useState(profile?.display_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [twoFA, setTwoFA] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <SectionCard title="Profile" description="Update your personal information">
        <InputField label="Username" icon={User} placeholder="Your display name" value={username} onChange={setUsername} />
        <InputField label="Email" icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
        <button
          onClick={() => toast.success('Profile saved!', { description: 'Your changes have been applied.' })}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all"
        >
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </SectionCard>

      <SectionCard title="Security" description="Manage your password and login methods">
        <InputField label="Current Password" icon={Lock} type="password" placeholder="••••••••" value={currentPassword} onChange={setCurrentPassword} />
        <InputField label="New Password" icon={Shield} type="password" placeholder="Enter new password" value={newPassword} onChange={setNewPassword} />
        <button
          onClick={() => { toast.success('Password updated!'); setCurrentPassword(''); setNewPassword(''); }}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all mb-6"
        >
          <Lock className="w-4 h-4" /> Change Password
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

// ── Tab: Appearance ─────────────────────────────────────────────────────────

function AppearanceTab() {
  const { settings, updateSettings } = useSettings();
  const currentTheme = THEMES[settings.theme];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      {/* Live Preview */}
      <SectionCard title="Theme Preview" description="See how your chosen theme looks in real time">
        <div className="rounded-xl bg-[#0B0A1A] border border-white/10 p-5">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: currentTheme.primary }}
            >
              AD
            </div>
            {/* Message */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Admin</span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.primary }}
                >
                  ADMINISTRATOR
                </span>
                <span className="text-[10px] text-gray-600">Today at 10:30 PM</span>
              </div>
              <p className="text-sm text-gray-300 mt-1">This is an example of how this theme looks. The accent colors update across the entire dashboard.</p>
              {/* Reaction bar */}
              <div className="flex gap-2 mt-3">
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
                  style={{ backgroundColor: `${currentTheme.primary}15`, color: currentTheme.primary }}
                >
                  👍 3
                </button>
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
                  style={{ backgroundColor: `${currentTheme.accent}15`, color: currentTheme.accent }}
                >
                  🎉 1
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Theme Selector */}
      <SectionCard title="Color Theme" description="Choose your preferred color palette">
        <div className="grid grid-cols-3 gap-3">
          {(Object.entries(THEMES) as [ThemeKey, typeof THEMES.purple][]).map(([key, theme]) => {
            const isActive = settings.theme === key;
            return (
              <button
                key={key}
                onClick={() => updateSettings({ theme: key })}
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
                <p className="text-xs font-semibold text-white text-left">{theme.label}</p>
                <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.accent})` }} />
              </button>
            );
          })}
        </div>
      </SectionCard>
    </motion.div>
  );
}

// ── Tab: Accessibility ──────────────────────────────────────────────────────

function AccessibilityTab() {
  const { settings, updateSettings, resetSettings } = useSettings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
    >
      <SectionCard title="Visual Accessibility" description="Customize the display for your comfort and needs">
        <ToggleSwitch
          enabled={settings.highContrast}
          onChange={v => updateSettings({ highContrast: v })}
          label="High Contrast Mode"
          description="Increase border and text contrast for better visibility"
        />
        <div className="border-t border-white/5" />

        <ToggleSwitch
          enabled={settings.reduceMotion}
          onChange={v => updateSettings({ reduceMotion: v })}
          label="Reduce Motion"
          description="Disable animations and page transitions"
        />
        <div className="border-t border-white/5" />

        <ToggleSwitch
          enabled={settings.dyslexiaFont}
          onChange={v => updateSettings({ dyslexiaFont: v })}
          label="Dyslexia-Friendly Font"
          description="Switch to a more readable font with increased letter spacing"
        />
      </SectionCard>

      <SectionCard title="Text Size" description="Adjust the base font size across the dashboard">
        <div className="flex bg-white/[0.03] rounded-xl p-1 gap-1">
          {TEXT_SCALE_OPTIONS.map(opt => {
            const active = settings.textScale === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => updateSettings({ textScale: opt.key })}
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
          <p className="text-gray-400" style={{ fontSize: `${({ sm: 14, md: 16, lg: 18, xl: 20 })[settings.textScale]}px` }}>
            This is a preview of how your text will appear at the <strong className="text-white">{TEXT_SCALE_OPTIONS.find(o => o.key === settings.textScale)?.label}</strong> size setting. Readability is our top priority.
          </p>
        </div>
      </SectionCard>

      {/* Reset */}
      <div className="flex justify-end">
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
