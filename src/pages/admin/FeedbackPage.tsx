import { useState } from 'react';
import { MessageSquare, Bug, Lightbulb, Inbox } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { useAdminFeedback, useAdminStats } from '@/hooks/useAdminData';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const categoryColors: Record<string, string> = {
  bug: 'bg-red-500/10 text-red-400',
  feature: 'bg-blue-500/10 text-blue-400',
  general: 'bg-gray-500/10 text-gray-400',
  other: 'bg-yellow-500/10 text-yellow-400',
};

export function FeedbackPage() {
  const { feedback, loading } = useAdminFeedback();
  const { stats, loading: statsLoading } = useAdminStats();
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered =
    categoryFilter === 'all'
      ? feedback
      : feedback.filter((f) => f.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Feedback"
          value={statsLoading ? '—' : stats.totalFeedback}
          subtitle="↑ Total submissions"
          icon={MessageSquare}
        />
        <StatCard
          title="Bug Reports"
          value={statsLoading ? '—' : stats.bugReports}
          subtitle="↑ Bug submissions"
          icon={Bug}
        />
        <StatCard
          title="Feature Requests"
          value={statsLoading ? '—' : stats.featureRequests}
          subtitle="↑ Feature submissions"
          icon={Lightbulb}
        />
      </div>

      {/* Feedback List */}
      <div className="rounded-xl bg-[#18162e] border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">All Feedback</h2>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="bug">Bug Reports</option>
            <option value="feature">Feature Requests</option>
            <option value="general">General</option>
            <option value="other">Other</option>
          </select>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="w-48 h-3 bg-white/5 rounded animate-pulse" />
                  <div className="w-full h-2.5 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Inbox className="w-12 h-12 mb-3 text-gray-600" />
            <p className="text-sm">No feedback found.</p>
          </div>
        ) : (
          <div>
            {filtered.map((item, i) => (
              <div
                key={item.id}
                className={`px-6 py-4 ${
                  i < filtered.length - 1 ? 'border-b border-white/[0.04]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">
                        {item.user_name ?? item.user_email.split('@')[0]}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryColors[item.category]}`}>
                        {item.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400">
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.message}</p>
                    <p className="text-xs text-gray-600 mt-1.5">{item.user_email} &middot; {formatDate(item.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
