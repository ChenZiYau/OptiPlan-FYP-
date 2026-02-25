import { useState, useMemo } from 'react';
import { UserCircle, Wifi, MessageSquare, UserPlus, Filter, FileText, Trash2, ToggleRight, Edit, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatCard } from '@/components/admin/StatCard';
import { CustomDropdown } from '@/components/ui/custom-dropdown';
import { useAdminStats, useAdminActivityLog, useUserPresence } from '@/hooks/useAdminData';

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Map from internal section_key to nice display name
const sectionLabels: Record<string, string> = {
  hero: 'Hero',
  problems: 'Problems',
  features: 'Features',
  steps: 'How It Works',
  tutorial: 'Tutorial',
  faqs: 'FAQ',
  testimonials: 'Testimonials',
  about_creator: 'About Creator',
  about_optiplan: 'About OptiPlan',
  cta: 'Call to Action',
};

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

const actionOptions = [
  { label: 'All Types', value: 'all' },
  { label: 'Content Update', value: 'content_update' },
  { label: 'User Deletion', value: 'user_delete' },
  { label: 'Feedback Status', value: 'feedback_status_change' },
  { label: 'Section Toggle', value: 'section_toggle' },
];

function renderActivityDetails(item: any) {
  const adminName = item.admin_name ?? 'Admin';
  const target = item.target_section ? (sectionLabels[item.target_section] ?? item.target_section) : 'Section';

  if (item.action_type === 'section_toggle') {
    const isVisible = item.details?.visible;
    const state = isVisible ? 'On' : 'Off';
    return (
      <p className="text-sm text-gray-300">
        <span className="font-semibold text-white">{adminName}</span> has toggled <strong>{target}</strong> Visibility; <span className={isVisible ? "text-emerald-400 font-medium" : "text-gray-400 font-medium"}>{state}</span>
      </p>
    );
  }

  if (item.action_type === 'content_update') {
     const hasBeforeAfter = item.details?.current !== undefined;
     const currentContent = hasBeforeAfter ? item.details.current : item.details?.content;
     const previousContent = hasBeforeAfter ? item.details.previous : null;

     return (
       <div className="space-y-2">
         <p className="text-sm text-gray-300">
           <span className="font-semibold text-white">{adminName}</span> has updated content for <strong>{target}</strong>
         </p>
         <div className="mt-3 text-xs text-gray-400">
            {hasBeforeAfter && previousContent ? (
              <div className="space-y-4">
                {Object.entries(currentContent).map(([key, newVal]) => {
                  const oldVal = previousContent[key];
                  if (JSON.stringify(newVal) === JSON.stringify(oldVal)) return null;
                  
                  let formattedNew = String(newVal);
                  let formattedOld = String(oldVal);
                  if (typeof newVal === 'object' && newVal !== null) formattedNew = 'Array/Object Data (Changed)';
                  else if (formattedNew.length > 50) formattedNew = formattedNew.substring(0, 50) + '...';
                  
                  if (typeof oldVal === 'object' && oldVal !== null) formattedOld = 'Array/Object Data';
                  else if (formattedOld.length > 50) formattedOld = formattedOld.substring(0, 50) + '...';

                  return (
                    <div key={key} className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-2">
                      <p className="text-gray-300 font-semibold uppercase tracking-wider text-[10px] bg-white/5 inline-block px-2 py-0.5 rounded">{key}</p>
                      
                      <div className="space-y-1">
                        <p className="text-red-400/80 font-medium text-[11px] uppercase tracking-wider">Before:</p>
                        <p className="text-gray-400 line-through pl-2 border-l-2 border-red-500/30">{formattedOld}</p>
                      </div>

                      <div className="space-y-1">
                         <p className="text-emerald-400 font-medium text-[11px] uppercase tracking-wider">After:</p>
                         <p className="text-gray-200 pl-2 border-l-2 border-emerald-500/30">{formattedNew}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                <p className="text-gray-400 italic">Detailed field changes unavailable for this legacy save.</p>
              </div>
            )}
         </div>
       </div>
     );
  }

  // Fallback
  return (
    <pre className="text-xs text-gray-400 bg-white/5 p-3 rounded-lg overflow-x-auto">
      {JSON.stringify(item.details, null, 2)}
    </pre>
  );
}

export function Overview() {
  const { stats, loading: statsLoading } = useAdminStats();
  const { presence } = useUserPresence();

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionType, setActionType] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { activities, loading: actLoading } = useAdminActivityLog({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    actionType,
  });

  const onlineCount = presence.filter(p => p.is_online).length;

  // Count users created today
  const todayStr = new Date().toISOString().split('T')[0];

  const groupedActivities = useMemo(() => {
    const groups: {
      id: string;
      action_type: string;
      admin_name: string;
      target_section: string | null;
      items: typeof activities;
      created_at: string;
    }[] = [];

    for (const activity of activities) {
      const lastGroup = groups[groups.length - 1];
      
      if (lastGroup && lastGroup.action_type === activity.action_type && lastGroup.admin_name === activity.admin_name) {
        lastGroup.items.push(activity);
      } else {
        groups.push({
          id: activity.id,
          action_type: activity.action_type,
          admin_name: activity.admin_name,
          target_section: activity.target_section,
          items: [activity],
          created_at: activity.created_at,
        });
      }
    }
    return groups;
  }, [activities]);

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
            <div className="w-40 relative z-20">
              <CustomDropdown
                value={actionType}
                onChange={setActionType}
                options={actionOptions}
              />
            </div>
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
            {groupedActivities.map((group) => {
              const Icon = actionIcons[group.action_type] ?? FileText;
              const colors = actionColors[group.action_type] ?? 'from-gray-500/20 to-gray-500/20 border-gray-500/20';
              const label = actionLabels[group.action_type] ?? group.action_type;
              const isExpanded = expandedLogId === group.id;
              const count = group.items.length;

              return (
                <div
                  key={group.id}
                  className={`border-b border-white/[0.04] last:border-0`}
                >
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : group.id)}
                    className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors} border flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200">
                        <span className="font-medium text-white">{group.admin_name}</span>
                        {' '}{label}
                        {count > 1 ? (
                          <span className="text-gray-400 font-medium whitespace-nowrap"> {count} times</span>
                        ) : group.target_section ? (
                          <span className="text-gray-500"> — {group.target_section}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {count > 1 
                          ? `${formatDate(group.items[group.items.length - 1].created_at)} to ${formatDate(group.created_at)}`
                          : formatDate(group.created_at)
                        }
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {/* Expandable Details Area */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-[#131127]"
                      >
                        <div className="px-6 py-4 border-t border-white/[0.04] space-y-4">
                          {group.items.map((item, idx) => (
                            <div key={item.id} className={idx > 0 ? "pt-4 border-t border-white/[0.04]" : ""}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-gray-500">
                                  {formatDate(item.created_at)}
                                </span>
                              </div>
                              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                                {renderActivityDetails(item)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
