import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Wifi, MessageSquare, UserPlus, Filter, FileText, Trash2, ToggleRight, Edit } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { useAdminStats, useAdminActivityLog, useUserPresence } from '@/hooks/useAdminData';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const actionIcons: Record<string, typeof FileText> = {
  content_update: Edit,
  user_delete: Trash2,
  feedback_status_change: MessageSquare,
  section_toggle: ToggleRight,
};

const actionColors: Record<string, string> = {
  content_update: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20',
  user_delete: 'from-red-500/20 to-pink-500/20 border-red-500/20',
  feedback_status_change: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/20',
  section_toggle: 'from-purple-500/20 to-violet-500/20 border-purple-500/20',
};

const actionLabels: Record<string, string> = {
  content_update: 'updated content',
  user_delete: 'deleted a user',
  feedback_status_change: 'changed feedback status',
  section_toggle: 'toggled section visibility',
};

export function Overview() {
  const { stats, loading: statsLoading } = useAdminStats();
  const { presence } = useUserPresence();
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionType, setActionType] = useState('all');

  const { activities, loading: actLoading } = useAdminActivityLog({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    actionType,
  });

  const onlineCount = presence.filter(p => p.is_online).length;

  // Count users created today
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={statsLoading ? '—' : stats.totalUsers}
          subtitle="↑ Registered users"
          icon={UserCircle}
        />
        <StatCard
          title="Online Now"
          value={statsLoading ? '—' : onlineCount}
          subtitle="↑ Currently online"
          icon={Wifi}
          badge="LIVE"
          badgeColor="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          title="New Users Today"
          value={statsLoading ? '—' : todayStr ? '—' : 0}
          subtitle="↑ Joined today"
          icon={UserPlus}
        />
        <StatCard
          title="Support Tickets"
          value={statsLoading ? '—' : stats.totalFeedback}
          subtitle="↑ Total submissions"
          icon={MessageSquare}
        />
      </div>

      {/* Activity Log */}
      <div className="rounded-xl bg-[#18162e] border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Activity Log</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 outline-none"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 outline-none"
              placeholder="To"
            />
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="content_update">Content Update</option>
              <option value="user_delete">User Deletion</option>
              <option value="feedback_status_change">Feedback Status</option>
              <option value="section_toggle">Section Toggle</option>
            </select>
          </div>
        </div>

        {actLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="w-48 h-3 bg-white/5 rounded animate-pulse" />
                  <div className="w-24 h-2.5 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">No activity logged yet</div>
        ) : (
          <div>
            {activities.map((activity, i) => {
              const Icon = actionIcons[activity.action_type] ?? FileText;
              const colors = actionColors[activity.action_type] ?? 'from-gray-500/20 to-gray-500/20 border-gray-500/20';
              const label = actionLabels[activity.action_type] ?? activity.action_type;

              return (
                <div
                  key={activity.id}
                  onClick={() => navigate(`/admin/activity/${activity.id}`)}
                  className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors ${
                    i < activities.length - 1 ? 'border-b border-white/[0.04]' : ''
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors} border flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200">
                      <span className="font-medium text-white">{activity.admin_name}</span>
                      {' '}{label}
                      {activity.target_section && (
                        <span className="text-gray-500"> — {activity.target_section}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(activity.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
