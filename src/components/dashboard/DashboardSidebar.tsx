import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, DollarSign, CheckSquare, CalendarDays,
  Users, Bot, BookOpen, LogOut, X, Plus, Sparkles, Heart, Settings, Trophy,
  ChevronLeft, ChevronRight,
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
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function DashboardSidebar({ isOpen, onClose, collapsed, onToggleCollapse }: DashboardSidebarProps) {
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
        className={`group/sidebar fixed top-0 left-0 z-50 h-screen bg-[#0A0A0A] dm-sidebar border-r border-[#1F1F1F] flex flex-col transition-all duration-300 lg:translate-x-0 ${
          collapsed ? 'w-16' : 'w-[250px]'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Edge handle — hover-reveal collapse/expand toggle */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-3 z-[60] w-6 h-6 items-center justify-center rounded-full bg-[#1A1A1A] border border-[#1F1F1F] text-zinc-500 hover:text-white hover:bg-zinc-700 opacity-0 group-hover/sidebar:opacity-100 transition-colors duration-150"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Brand */}
        <div className={`flex items-center h-16 shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          <Link to="/" className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <img src="/logo2.png" alt="OptiPlan" className={`${collapsed ? 'h-8 w-auto' : 'h-10 w-auto'}`} />
          </Link>
          {!collapsed && (
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick action */}
        <div className={`pb-2 ${collapsed ? 'px-2' : 'px-3'}`}>
          <HoverTip label="Create a new task" side={collapsed ? 'right' : 'top'}>
            <button
              onClick={openModal}
              className={`w-full flex items-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors duration-150 ${
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-2 px-3 py-2.5'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              {!collapsed && 'New Task'}
            </button>
          </HoverTip>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 pt-4 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
          {!collapsed && (
            <p className="px-3 mb-3 text-[10px] font-semibold tracking-wide text-zinc-600 uppercase">
              Menu
            </p>
          )}
          <div className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return collapsed ? (
                <HoverTip key={item.href} label={item.label} side="right">
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-center w-full py-2.5 rounded-lg transition-colors duration-150 ${
                      active
                        ? 'bg-indigo-500/10 text-white'
                        : 'text-zinc-500 hover:text-white hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <item.icon className={`w-[18px] h-[18px] ${active ? 'text-indigo-400' : ''}`} />
                  </Link>
                </HoverTip>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-indigo-500/10 text-white border-l-4 border-indigo-500 pl-2'
                      : 'text-zinc-500 hover:text-white hover:bg-[#1A1A1A] border-l-4 border-transparent pl-2'
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] ${active ? 'text-indigo-400' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User profile + Settings + Logout */}
        <div className={`pb-4 shrink-0 ${collapsed ? 'px-2' : 'px-3'}`}>
          {collapsed ? (
            <div className="space-y-1">
              <HoverTip label="Settings" side="right">
                <Link
                  to="/dashboard/settings"
                  onClick={onClose}
                  className={`flex items-center justify-center w-full py-2.5 rounded-lg transition-colors duration-150 ${
                    isActive('/dashboard/settings')
                      ? 'bg-indigo-500/10 text-white'
                      : 'text-zinc-500 hover:text-white hover:bg-[#1A1A1A]'
                  }`}
                >
                  <Settings className={`w-[18px] h-[18px] ${isActive('/dashboard/settings') ? 'text-indigo-400' : ''}`} />
                </Link>
              </HoverTip>
              <HoverTip label={displayName} side="right">
                <button
                  onClick={() => setShowLogoutConfirm((v) => !v)}
                  className="w-full flex items-center justify-center py-2"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-xs">
                      {initials}
                    </div>
                  )}
                </button>
              </HoverTip>
            </div>
          ) : (
            <div className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-3">
              <div className="flex items-center gap-3">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-xs shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">{displayName}</p>
                  <p className="text-xs text-zinc-500">Free Plan</p>
                </div>
                <div className="flex items-center gap-1">
                  <HoverTip label="Settings" side="top">
                    <Link
                      to="/dashboard/settings"
                      onClick={onClose}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-150 ${
                        isActive('/dashboard/settings')
                          ? 'text-indigo-400 bg-indigo-500/10'
                          : 'text-zinc-500 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                  </HoverTip>
                  <HoverTip label="Log out" side="top">
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
                      aria-label="Log out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </HoverTip>
                </div>
              </div>

              {/* Logout confirmation */}
              {showLogoutConfirm && (
                <div className="mt-3 pt-3 border-t border-[#1F1F1F]">
                  <p className="text-xs text-zinc-500 mb-2">Are you sure you want to log out?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-zinc-500 hover:bg-white/10 transition-colors duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors duration-150"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
