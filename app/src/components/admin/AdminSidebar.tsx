import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, MessageSquare, FileEdit, LogOut, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { AdminNavItem } from '@/types/admin';

const navItems: AdminNavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutGrid },
  { label: 'User Database', href: '/admin/users', icon: Users },
  { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
  { label: 'Website Content', href: '/admin/content', icon: FileEdit },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const displayName = profile?.display_name ?? 'Admin User';
  const initials = (() => {
    const name = profile?.display_name;
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    return 'AD';
  })();

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-[250px] bg-[#0B0A1A] border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-lg text-white tracking-tight">
              AdminPlan
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-6 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-semibold tracking-[0.15em] text-gray-600 uppercase">
            Main Menu
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

        {/* User Profile Widget */}
        <div className="px-3 pb-4 shrink-0">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
