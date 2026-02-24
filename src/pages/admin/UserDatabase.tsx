import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCircle, Shield, Search, Pencil, Trash2 } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { useAdminUsers, useAdminStats, useUserPresence } from '@/hooks/useAdminData';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLastSeen(dateStr: string | undefined) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return formatDate(dateStr);
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export function UserDatabase() {
  const { users, loading, refetch } = useAdminUsers();
  const { stats, loading: statsLoading } = useAdminStats();
  const { presenceMap } = useUserPresence();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={statsLoading ? '—' : stats.totalUsers}
          subtitle="↑ Registered users"
          icon={Users}
        />
        <StatCard
          title="Regular Users"
          value={statsLoading ? '—' : stats.regularUsers}
          subtitle="↑ Standard accounts"
          icon={UserCircle}
        />
        <StatCard
          title="Admins"
          value={statsLoading ? '—' : stats.adminUsers}
          subtitle="↑ Admin accounts"
          icon={Shield}
        />
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-[#18162e] border border-white/10 overflow-hidden">
        {/* Header Controls */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">All Users</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-gray-300 placeholder:text-gray-600 outline-none w-36"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Last Seen</th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3 bg-white/5 rounded animate-pulse" />
                          <div className="w-40 h-2.5 bg-white/5 rounded animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="w-12 h-5 bg-white/5 rounded-full animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="w-16 h-5 bg-white/5 rounded-full animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="w-24 h-3 bg-white/5 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="w-20 h-3 bg-white/5 rounded animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="w-16 h-3 bg-white/5 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
                  const pres = presenceMap.get(user.id);
                  const isOnline = pres?.is_online ?? false;

                  return (
                    <tr key={user.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                              <span className="text-xs font-semibold text-purple-300">
                                {getInitials(user.display_name, user.email)}
                              </span>
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#18162e] ${isOnline ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {user.display_name ?? user.email.split('@')[0]}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'
                        }`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatLastSeen(pres?.last_seen)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/users/delete/${user.id}`)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
