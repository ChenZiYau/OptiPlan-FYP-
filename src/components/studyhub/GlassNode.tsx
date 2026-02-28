import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { ChevronRight, ChevronDown, MessageSquare } from 'lucide-react';

const ACCENT_COLORS: Record<string, string> = {
  root: '#a855f7',
  section: '#3b82f6',
  topic: '#10b981',
  detail: '#f59e0b',
};

const ACCENT_BG: Record<string, string> = {
  root: 'bg-purple-500/15',
  section: 'bg-blue-500/10',
  topic: 'bg-emerald-500/10',
  detail: 'bg-amber-500/10',
};

function StudyCardComponent({ data }: NodeProps) {
  const type = (data.type as string) || 'topic';
  const isRoot = type === 'root';
  const accent = ACCENT_COLORS[type] || ACCENT_COLORS.topic;
  const accentBg = ACCENT_BG[type] || ACCENT_BG.topic;
  const hasChildren = data.hasChildren as boolean;
  const isCollapsed = data.isCollapsed as boolean;
  const details = (data.details as string) || '';

  return (
    <div className="relative">
      {/* Target handle — left */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !border-0"
          style={{ background: accent }}
        />
      )}

      {/* Card body */}
      <div
        className={`group rounded-xl border border-white/[0.08] shadow-xl shadow-black/40 ${
          hasChildren ? 'cursor-pointer' : 'cursor-pointer'
        }`}
        style={{
          background: '#2D3342',
          minWidth: isRoot ? 260 : 220,
          maxWidth: 300,
        }}
      >
        {/* Top accent bar */}
        <div
          className="h-[3px] rounded-t-xl"
          style={{ background: accent }}
        />

        {/* Label row */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: accent }}
          />
          <span
            className={`font-bold leading-tight flex-1 ${
              isRoot ? 'text-sm text-white' : 'text-[13px] text-gray-100'
            }`}
          >
            {data.label}
          </span>
          {hasChildren && (
            <span className="shrink-0 text-gray-500 ml-1">
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          )}
          {data.onChatClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                (data.onChatClick as (label: string, details: string) => void)(
                  data.label as string,
                  (data.details as string) || ''
                );
              }}
              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Details row */}
        {details && (
          <div className={`mx-3 mb-3 mt-1 px-2.5 py-2 rounded-lg ${accentBg}`}>
            <p className="text-[11px] leading-relaxed text-gray-300">
              {details}
            </p>
          </div>
        )}

        {/* Minimal bottom padding if no details */}
        {!details && <div className="pb-2.5" />}
      </div>

      {/* Source handle — right */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-0"
        style={{ background: accent }}
      />
    </div>
  );
}

export const GlassNode = memo(StudyCardComponent);
