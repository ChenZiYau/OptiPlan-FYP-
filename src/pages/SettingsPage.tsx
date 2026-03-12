import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Palette, Accessibility } from 'lucide-react';
import { Toaster } from 'sonner';
import {
  AppearanceTab,
  AccessibilityTab,
  type SettingsTab,
} from '@/components/settings/SettingsTabComponents';

const TABS: { key: SettingsTab; label: string; icon: typeof Palette }[] = [
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility },
];

export function StandaloneSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07040A] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-[#07040A]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo2.png" alt="OptiPlan" className="h-8 w-auto" />
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Customize your appearance and accessibility preferences
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Left nav */}
          <div className="sm:w-[200px] shrink-0">
            <nav className="flex sm:flex-col gap-2 sm:gap-1 sm:sticky sm:top-24">
              {TABS.map(tab => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
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
              {activeTab === 'appearance' && <AppearanceTab key="appearance" />}
              {activeTab === 'accessibility' && <AccessibilityTab key="accessibility" />}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1735',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}
