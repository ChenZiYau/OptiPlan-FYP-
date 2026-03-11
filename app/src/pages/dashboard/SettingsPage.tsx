import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Palette, Accessibility,
  Shield, Phone, Lock, Mail, Save,
  Camera, Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  SectionCard,
  ToggleSwitch,
  InputField,
  AppearanceTab,
  AccessibilityTab,
} from '@/components/settings/SettingsTabComponents';

// ── Types ───────────────────────────────────────────────────────────────────

type SettingsTab = 'account' | 'appearance' | 'accessibility';

const TABS: { key: SettingsTab; label: string; icon: typeof User }[] = [
  { key: 'account', label: 'My Account', icon: User },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility },
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
