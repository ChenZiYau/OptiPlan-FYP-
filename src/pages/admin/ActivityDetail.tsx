import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Clock, User, Tag, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminActivityLog } from '@/types/admin';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const actionTypeLabels: Record<string, { label: string; color: string }> = {
  content_update: { label: 'Content Update', color: 'bg-blue-500/10 text-blue-400' },
  user_delete: { label: 'User Deletion', color: 'bg-red-500/10 text-red-400' },
  feedback_status_change: { label: 'Feedback Status Change', color: 'bg-yellow-500/10 text-yellow-400' },
  section_toggle: { label: 'Section Visibility Toggle', color: 'bg-purple-500/10 text-purple-400' },
};

function JsonDisplay({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
          <span className="text-xs font-medium text-gray-500 min-w-[140px] font-mono">{key}</span>
          <span className="text-sm text-gray-300 break-all">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '—')}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ActivityDetail() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<AdminActivityLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!activityId) return;
      const { data } = await supabase
        .from('admin_activity_log')
        .select('*')
        .eq('id', activityId)
        .single();
      setActivity(data);
      setLoading(false);
    }
    fetch();
  }, [activityId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Activity not found.</p>
        <button onClick={() => navigate('/admin')} className="mt-4 text-purple-400 hover:underline text-sm">
          Back to Overview
        </button>
      </div>
    );
  }

  const actionInfo = actionTypeLabels[activity.action_type] ?? { label: activity.action_type, color: 'bg-gray-500/10 text-gray-400' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/admin')}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Overview
      </button>

      <div className="rounded-xl bg-[#18162e] border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Activity Detail</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Action type badge */}
          <div className="flex items-center gap-3">
            <Tag className="w-4 h-4 text-gray-500" />
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${actionInfo.color}`}>
              {actionInfo.label}
            </span>
          </div>

          {/* Admin */}
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-sm text-white">{activity.admin_name}</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <p className="text-sm text-gray-300">{formatDate(activity.created_at)}</p>
          </div>

          {/* Target section */}
          {activity.target_section && (
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-300">Section: <span className="text-white">{activity.target_section}</span></p>
            </div>
          )}

          {/* Details */}
          {activity.details && Object.keys(activity.details).length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</h3>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4">
                <JsonDisplay data={activity.details} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
