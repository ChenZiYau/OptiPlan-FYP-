import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, ArrowRight, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useAuth } from '@/hooks/useAuth';
import { navEntries } from '@/constants/navigation';
import type { NavGroup } from '@/constants/navigation';

// ── Ease curve used across all header animations ──────────────────────────────
const ease = [0.25, 0.1, 0.25, 1] as const;

// ── Desktop dropdown ──────────────────────────────────────────────────────────

interface DesktopDropdownProps {
  group: NavGroup;
  onNavigate: (id: string) => void;
  isActive: boolean;
  onOpen: () => void;
  onClose: () => void;
}

function DesktopDropdown({
  group,
  onNavigate,
  isActive,
  onOpen,
  onClose,
}: DesktopDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isActive) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isActive, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger */}
      <button
        onClick={() => (isActive ? onClose() : onOpen())}
        aria-expanded={isActive}
        aria-haspopup="true"
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
          isActive
            ? 'text-white bg-white/[0.06]'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        {group.label}
        <motion.span
          animate={{ rotate: isActive ? 180 : 0 }}
          transition={{ duration: 0.25, ease }}
          className="inline-flex"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>

        {/* Active bottom indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.span
              layoutId="nav-indicator"
              className="absolute -bottom-px left-3 right-3 h-0.5 rounded-full bg-opti-accent"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.2, ease }}
            />
          )}
        </AnimatePresence>
      </button>

      {/* Panel — static wrapper handles centering, motion.div handles animation */}
      <AnimatePresence>
        {isActive && (
          <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-72 z-50">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease }}
              role="menu"
              className="w-full rounded-2xl border border-white/[0.08] bg-[#0e0b19]/95 backdrop-blur-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
            >
            {/* Top accent bar */}
            <div className="h-px bg-gradient-to-r from-transparent via-opti-accent/30 to-transparent" />

            <div className="p-1.5">
              {group.items.map((item, i) => (
                <motion.button
                  key={item.href}
                  role="menuitem"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.2, ease }}
                  onClick={() => {
                    onNavigate(item.href);
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors duration-150 group hover:bg-white/[0.05]"
                >
                  <div className="mt-0.5 w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-opti-accent/10 group-hover:border-opti-accent/20 transition-colors duration-150">
                    <item.icon className="w-[18px] h-[18px] text-gray-400 group-hover:text-opti-accent transition-colors duration-150" />
                  </div>
                  <div className="pt-0.5">
                    <span className="block text-[13px] font-semibold text-gray-200 group-hover:text-white transition-colors duration-150">
                      {item.label}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5 leading-snug group-hover:text-gray-400 transition-colors duration-150">
                      {item.description}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mobile accordion section ──────────────────────────────────────────────────

interface MobileAccordionProps {
  group: NavGroup;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (id: string) => void;
  index: number;
}

function MobileAccordion({
  group,
  isOpen,
  onToggle,
  onNavigate,
  index,
}: MobileAccordionProps) {
  return (
    <motion.div
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-[15px] font-semibold text-gray-200">
          {group.label}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease }}
          className="inline-flex text-gray-500"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease }}
            className="overflow-hidden"
          >
            <div className="pb-3 space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.href}
                  onClick={() => onNavigate(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/[0.04] group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-opti-accent/10 transition-colors">
                    <item.icon className="w-4 h-4 text-gray-500 group-hover:text-opti-accent transition-colors" />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                    <span className="block text-xs text-gray-600 leading-snug">
                      {item.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-px bg-white/[0.06]" />
    </motion.div>
  );
}

// ── Profile dropdown (authenticated) ─────────────────────────────────────────

interface ProfileDropdownProps {
  name: string;
  initials: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
}

function ProfileDropdown({ name, initials, onNavigate, onSignOut }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/[0.06] transition-colors duration-200"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-opti-accent to-[#8B5CF6] flex items-center justify-center text-[#0B0A1A] font-semibold text-xs shrink-0">
          {initials}
        </div>
        <span className="text-sm font-medium text-gray-200 max-w-[120px] truncate">
          {name}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease }}
          className="inline-flex text-gray-500"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="absolute top-[calc(100%+8px)] right-0 w-56 z-50">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease }}
              className="w-full rounded-2xl border border-white/[0.08] bg-[#0e0b19]/95 backdrop-blur-2xl shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="h-px bg-gradient-to-r from-transparent via-opti-accent/30 to-transparent" />
              <div className="p-1.5">
                <button
                  onClick={() => { onNavigate('/dashboard'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/[0.05] group"
                >
                  <LayoutDashboard className="w-4 h-4 text-gray-400 group-hover:text-opti-accent transition-colors" />
                  <span className="text-[13px] font-medium text-gray-200 group-hover:text-white transition-colors">Dashboard</span>
                </button>
                <button
                  onClick={() => { onNavigate('/settings'); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/[0.05] group"
                >
                  <Settings className="w-4 h-4 text-gray-400 group-hover:text-opti-accent transition-colors" />
                  <span className="text-[13px] font-medium text-gray-200 group-hover:text-white transition-colors">Settings</span>
                </button>
                <div className="mx-3 my-1 h-px bg-white/[0.06]" />
                <button
                  onClick={() => { onSignOut(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-red-500/10 group"
                >
                  <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors" />
                  <span className="text-[13px] font-medium text-gray-200 group-hover:text-red-400 transition-colors">Log Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const { scrollToSection } = useSmoothScroll();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();

  const displayName = profile?.display_name ?? profile?.email ?? user?.email ?? 'User';

  const userInitials = (() => {
    const name = profile?.display_name;
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    const email = profile?.email ?? user?.email;
    return email ? email.substring(0, 2).toUpperCase() : '??';
  })();

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const handleNavClick = useCallback(
    (sectionId: string) => {
      scrollToSection(sectionId);
      setIsMobileOpen(false);
      setActiveDropdown(null);
    },
    [scrollToSection],
  );

  return (
    <>
      {/* ── Header bar ───────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0B0A1A]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_24px_rgba(0,0,0,0.25)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-[72px]">
            {/* ── Logo (left) ──────────────────────────────────────── */}
            <motion.a
              href="#"
              className="relative z-10 flex items-center gap-2.5 shrink-0"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-opti-accent to-[#8B5CF6] flex items-center justify-center">
                <span className="text-[#0B0A1A] font-bold text-sm">O</span>
              </div>
              <span className="font-display font-semibold text-lg text-white tracking-tight">
                OptiPlan
              </span>
            </motion.a>

            {/* ── Center nav (absolutely centered on desktop) ──────── */}
            <nav
              className="hidden lg:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              aria-label="Main"
            >
              {navEntries.map((entry) =>
                entry.kind === 'dropdown' ? (
                  <DesktopDropdown
                    key={entry.group.label}
                    group={entry.group}
                    onNavigate={handleNavClick}
                    isActive={activeDropdown === entry.group.label}
                    onOpen={() => setActiveDropdown(entry.group.label)}
                    onClose={() => setActiveDropdown(null)}
                  />
                ) : (
                  <button
                    key={entry.link.href}
                    onClick={() => handleNavClick(entry.link.href)}
                    className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {entry.link.label}
                  </button>
                ),
              )}
            </nav>

            {/* ── Right CTA group (desktop) ────────────────────────── */}
            <div className="hidden lg:flex relative z-10 items-center gap-3">
              {authLoading ? (
                <div className="w-8 h-8 rounded-full bg-white/[0.06] animate-pulse" />
              ) : user ? (
                <ProfileDropdown
                  name={displayName}
                  initials={userInitials}
                  onNavigate={(path) => navigate(path)}
                  onSignOut={handleSignOut}
                />
              ) : (
                <>
                  <motion.button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
                    whileTap={{ scale: 0.97 }}
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    onClick={() => navigate('/signup')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-opti-accent to-[#8B5CF6] text-[#0B0A1A] shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:shadow-[0_0_30px_rgba(139,92,246,0.35)] transition-shadow duration-300"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Get Early Access
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </>
              )}
            </div>

            {/* ── Hamburger (mobile) ───────────────────────────────── */}
            <motion.button
              onClick={() => setIsMobileOpen((v) => !v)}
              className="lg:hidden relative z-10 w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X size={20} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile menu overlay ─────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-[#0B0A1A]/95 backdrop-blur-2xl"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Content */}
            <motion.nav
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              className="absolute top-[72px] left-0 right-0 bottom-0 overflow-y-auto"
              aria-label="Mobile"
            >
              <div className="px-5 pt-4 pb-8">
                {/* Nav entries */}
                {navEntries.map((entry, i) =>
                  entry.kind === 'dropdown' ? (
                    <MobileAccordion
                      key={entry.group.label}
                      group={entry.group}
                      index={i}
                      isOpen={mobileAccordion === entry.group.label}
                      onToggle={() =>
                        setMobileAccordion((prev) =>
                          prev === entry.group.label ? null : entry.group.label,
                        )
                      }
                      onNavigate={handleNavClick}
                    />
                  ) : (
                    <motion.div
                      key={entry.link.href}
                      initial={{ x: -16, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.06, duration: 0.3, ease }}
                    >
                      <button
                        onClick={() => handleNavClick(entry.link.href)}
                        className="w-full text-left py-4 text-[15px] font-semibold text-gray-200 hover:text-white transition-colors"
                      >
                        {entry.link.label}
                      </button>
                      <div className="h-px bg-white/[0.06]" />
                    </motion.div>
                  ),
                )}

                {/* CTA buttons */}
                <motion.div
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3, ease }}
                  className="mt-8 space-y-3"
                >
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-opti-accent to-[#8B5CF6] flex items-center justify-center text-[#0B0A1A] font-semibold text-sm shrink-0">
                          {userInitials}
                        </div>
                        <span className="text-sm font-medium text-gray-200 truncate">{displayName}</span>
                      </div>
                      <button
                        onClick={() => { navigate('/dashboard'); setIsMobileOpen(false); }}
                        className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-300 hover:text-white hover:border-white/[0.15] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </button>
                      <button
                        onClick={() => { navigate('/settings'); setIsMobileOpen(false); }}
                        className="w-full flex items-center gap-3 py-3 px-4 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-300 hover:text-white hover:border-white/[0.15] transition-colors"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <button
                        onClick={() => { handleSignOut(); setIsMobileOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { navigate('/login'); setIsMobileOpen(false); }}
                        className="w-full py-3 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-300 hover:text-white hover:border-white/[0.15] transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => { navigate('/signup'); setIsMobileOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-opti-accent to-[#8B5CF6] text-sm font-semibold text-[#0B0A1A] shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                      >
                        Get Early Access
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </motion.div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
