import { UserCircle, Wifi, MessageSquare, UserPlus } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { useAdminStats, useRecentActivity } from '@/hooks/useAdminData';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function Overview() {
  const { stats, loading: statsLoading } = useAdminStats();
  const { activities, loading: actLoading } = useRecentActivity();

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Users"
          value={statsLoading ? '—' : stats.totalUsers}
          subtitle="↑ Registered users"
          icon={UserCircle}
        />
        <StatCard
          title="Active Sessions"
          value={statsLoading ? '—' : 1}
          subtitle="↑ Currently online"
          icon={Wifi}
          badge="LIVE"
          badgeColor="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          title="Support Tickets"
          value={statsLoading ? '—' : stats.totalFeedback}
          subtitle="↑ Total submissions"
          icon={MessageSquare}
        />
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl bg-[#18162e] border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
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
          <div className="p-12 text-center text-gray-500 text-sm">No recent activity</div>
        ) : (
          <div>
            {activities.map((activity, i) => (
              <div
                key={activity.id}
                className={`flex items-center gap-4 px-6 py-4 ${
                  i < activities.length - 1 ? 'border-b border-white/[0.04]' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">
                    <span className="font-medium text-white">{activity.user_name}</span>
                    {' '}{activity.action}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDate(activity.created_at)}</p>
                </div>
                <UserCircle className="w-4 h-4 text-gray-600 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
