import { useEffect, useRef } from 'react';
import { X, FileText } from 'lucide-react';
import type { Citation } from '@/types/studyhub';

interface CitationPreviewProps {
  citation: Citation;
  onClose: () => void;
}

export function CitationPreview({ citation, onClose }: CitationPreviewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 bottom-full left-0 mb-2 w-80 rounded-xl bg-[#1a1735] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="text-xs font-semibold text-white truncate">
            {citation.source_filename}
          </span>
          {citation.page_or_paragraph && (
            <span className="text-[10px] text-gray-500 shrink-0">
              p.{citation.page_or_paragraph}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Excerpt */}
      <div className="px-4 py-3 max-h-40 overflow-y-auto">
        <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
          {citation.excerpt}
        </p>
      </div>
    </div>
  );
}
