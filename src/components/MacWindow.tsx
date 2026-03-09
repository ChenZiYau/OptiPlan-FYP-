import type { ReactNode } from 'react';

interface MacWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function MacWindow({ title, children, className = '' }: MacWindowProps) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      {/* Title bar */}
      <div className="flex items-center px-4 py-3 border-b border-white/10">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="flex-1 text-center text-sm text-opti-text-secondary">
          {title}
        </span>
        <div className="w-[52px]" />
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
