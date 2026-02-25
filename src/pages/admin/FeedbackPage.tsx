import { useState } from 'react';
import { MessageSquare, Bug, Lightbulb, Inbox, ChevronDown, Search } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { CustomDropdown } from '@/components/ui/custom-dropdown';
import { useAdminFeedback, useAdminStats, logAdminActivity } from '@/hooks/useAdminData';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const categoryColors: Record<string, string> = {
  bug: 'bg-red-500/10 text-red-400',
  feature: 'bg-blue-500/10 text-blue-400',
  general: 'bg-gray-500/10 text-gray-400',
  other: 'bg-yellow-500/10 text-yellow-400',
};

const statusColors: Record<string, string> = {
  new: 'bg-purple-500/10 text-purple-400',
  reviewed: 'bg-blue-500/10 text-blue-400',
  resolved: 'bg-emerald-500/10 text-emerald-400',
};

const categoryOptions = [
  { label: 'All Categories', value: 'all' },
  { label: 'Bug Reports', value: 'bug' },
  { label: 'Feature Requests', value: 'feature' },
  { label: 'General', value: 'general' },
  { label: 'Other', value: 'other' },
];

const statusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Resolved', value: 'resolved' },
];

export function FeedbackPage() {
  const { feedback, loading, refetch } = useAdminFeedback();
  const { stats, loading: statsLoading } = useAdminStats();
  const { profile } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const filtered = feedback.filter((f) => {
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (dateFrom && f.created_at < dateFrom) return false;
    if (dateTo && f.created_at > dateTo + 'T23:59:59') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !(f.user_email.toLowerCase().includes(q) ||
          (f.user_name?.toLowerCase().includes(q) ?? false) ||
          f.message.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    if (!profile) return;
    setUpdatingStatus(feedbackId);

    const item = feedback.find(f => f.id === feedbackId);
    const oldStatus = item?.status;

    await supabase
      .from('feedback')
      .update({ status: newStatus })
      .eq('id', feedbackId);

    await logAdminActivity(
      profile.id,
      profile.display_name ?? profile.email,
      'feedback_status_change',
      null,
      {
        feedback_id: feedbackId,
        old_status: oldStatus,
        new_status: newStatus,
        user_email: item?.user_email,
      },
    );

    setUpdatingStatus(null);
    refetch();
  };

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
        <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">All Feedback</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Search className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-gray-300 placeholder:text-gray-600 outline-none w-28"
              />
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 outline-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 outline-none"
            />
            <div className="w-40 relative z-20">
              <CustomDropdown
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
              />
            </div>
          </div>
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
            {filtered.map((item, i) => {
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  className={i < filtered.length - 1 ? 'border-b border-white/[0.04]' : ''}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {item.user_name ?? item.user_email.split('@')[0]}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${categoryColors[item.category]}`}>
                            {item.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[item.status]}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed line-clamp-1">{item.message}</p>
                        <p className="text-xs text-gray-600 mt-1.5">{item.user_email} &middot; {formatDate(item.created_at)}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform mt-1 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-6 pb-5">
                      <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Message</h4>
                          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{item.message}</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">Email</span>
                            <p className="text-gray-300 mt-0.5">{item.user_email}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Category</span>
                            <p className="text-gray-300 mt-0.5 capitalize">{item.category}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Submitted</span>
                            <p className="text-gray-300 mt-0.5">{formatDateTime(item.created_at)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">User ID</span>
                            <p className="text-gray-300 mt-0.5 font-mono text-[10px]">{item.user_id ?? '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                          <span className="text-xs text-gray-500">Status:</span>
                          <div className="w-32 relative">
                            <CustomDropdown
                              value={item.status}
                              disabled={updatingStatus === item.id}
                              onChange={(val) => handleStatusChange(item.id, val)}
                              options={statusOptions}
                            />
                          </div>
                          {updatingStatus === item.id && (
                            <span className="text-xs text-gray-500">Updating...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
