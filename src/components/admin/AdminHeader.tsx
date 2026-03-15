import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, RefreshCw } from 'lucide-react';
import { useAdminRefreshButton } from '@/contexts/AdminRefreshContext';

const adminPages = [
  { label: 'Overview', path: '/admin', keywords: ['overview', 'dashboard', 'home', 'stats'] },
  { label: 'User Database', path: '/admin/users', keywords: ['users', 'user', 'database', 'accounts'] },
  { label: 'Feedback', path: '/admin/feedback', keywords: ['feedback', 'tickets', 'bugs', 'reports'] },
  { label: 'Content Editor', path: '/admin/content', keywords: ['content', 'editor', 'website', 'sections'] },
  { label: 'Settings', path: '/admin/settings', keywords: ['settings', 'config', 'site'] },
];

interface AdminHeaderProps {
  title: string;
  onMenuToggle: () => void;
}

export function AdminHeader({ title, onMenuToggle }: AdminHeaderProps) {
  const { refresh, refreshing } = useAdminRefreshButton();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || !search.trim()) return;
    const q = search.toLowerCase();
    const match = adminPages.find(
      (p) => p.label.toLowerCase().includes(q) || p.keywords.some((k) => k.includes(q)),
    );
    if (match) {
      navigate(match.path);
      setSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B0A1A]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 w-64">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Go to page..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="bg-transparent text-sm text-gray-300 placeholder:text-gray-600 outline-none w-full"
          />
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          title="Refresh page data"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-[18px] h-[18px] ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => {}}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white/40 cursor-not-allowed opacity-50 transition-colors"
          title="Notifications coming soon"
          disabled
        >
          <Bell className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
