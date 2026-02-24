import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, DollarSign, CheckSquare, CalendarDays,
  Users, Bot, BookOpen, LogOut, X, Plus, Sparkles, Heart, Settings, Trophy,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { HoverTip } from '@/components/HoverTip';
import { useDashboard } from '@/contexts/DashboardContext';
import type { DashboardNavItem } from '@/types/dashboard';

const navItems: DashboardNavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutGrid },
  { label: 'Finance Tracker', href: '/dashboard/finance', icon: DollarSign },
  { label: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
  { label: 'Schedules', href: '/dashboard/schedules', icon: CalendarDays },
  { label: 'Collaboration', href: '/dashboard/collab', icon: Users },
  { label: 'AI ChatBot', href: '/dashboard/chatbot', icon: Bot },
  { label: 'Study Hub', href: '/dashboard/studyhub', icon: BookOpen },
  { label: 'Wellness', href: '/dashboard/wellness', icon: Heart },
  { label: 'Wrapped', href: '/dashboard/wrapped', icon: Sparkles },
  { label: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { openModal } = useDashboard();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const displayName = profile?.display_name ?? 'User';
  const initials = (() => {
    const name = profile?.display_name;
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    return 'U';
  })();

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-[250px] bg-[#0B0A1A] dm-sidebar border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-semibold text-lg text-white tracking-tight">
              OptiPlan
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick action */}
        <div className="px-3 pb-2">
          <HoverTip label="Create a new task">
            <button
              onClick={openModal}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </HoverTip>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-semibold tracking-[0.15em] text-gray-600 uppercase">
            Menu
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-purple-900/20 text-white border-l-4 border-purple-500 pl-2'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-2'
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] ${active ? 'text-purple-400' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Settings link */}
        <div className="px-3 pb-2 shrink-0">
          <Link
            to="/dashboard/settings"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive('/dashboard/settings')
                ? 'bg-purple-900/20 text-white border-l-4 border-purple-500 pl-2'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent pl-2'
            }`}
          >
            <Settings className={`w-[18px] h-[18px] ${isActive('/dashboard/settings') ? 'text-purple-400' : ''}`} />
            Settings
          </Link>
        </div>

        {/* User profile */}
        <div className="px-3 pb-4 shrink-0">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-500">Free Plan</p>
              </div>
              <HoverTip label="Log out" side="right">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </HoverTip>
            </div>

            {/* Logout confirmation */}
            {showLogoutConfirm && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">Are you sure you want to log out?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
