import type { StatCardProps } from '@/types/admin';

export function StatCard({ title, value, subtitle, icon: Icon, badge, badgeColor = 'bg-emerald-500/10 text-emerald-400' }: StatCardProps) {
  return (
    <div className="rounded-xl bg-[#18162e] border border-white/10 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-wider text-gray-500 uppercase">{title}</p>
          <div className="mt-2 flex items-center gap-2.5">
            <span className="text-3xl font-bold text-white">{value}</span>
            {badge && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-emerald-400">{subtitle}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
