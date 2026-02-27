import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';

const TYPE_COLORS: Record<string, string> = {
  concept: 'border-purple-500/40 bg-purple-500/10',
  term: 'border-blue-500/40 bg-blue-500/10',
  person: 'border-green-500/40 bg-green-500/10',
  process: 'border-amber-500/40 bg-amber-500/10',
  example: 'border-pink-500/40 bg-pink-500/10',
};

const TYPE_TEXT: Record<string, string> = {
  concept: 'text-purple-300',
  term: 'text-blue-300',
  person: 'text-green-300',
  process: 'text-amber-300',
  example: 'text-pink-300',
};

function GlassNodeComponent({ data }: NodeProps) {
  const type = (data.type as string) || 'concept';
  const colorClass = TYPE_COLORS[type] || TYPE_COLORS.concept;
  const textClass = TYPE_TEXT[type] || TYPE_TEXT.concept;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !border-purple-400 !w-2 !h-2" />
      <div className={`px-4 py-2.5 rounded-xl border backdrop-blur-md ${colorClass} shadow-lg shadow-black/20 min-w-[80px] max-w-[180px]`}>
        <p className={`text-xs font-semibold text-center leading-tight ${textClass}`}>
          {data.label}
        </p>
        <p className="text-[9px] text-gray-500 text-center mt-0.5 uppercase tracking-wider">
          {type}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !border-purple-400 !w-2 !h-2" />
    </>
  );
}

export const GlassNode = memo(GlassNodeComponent);
