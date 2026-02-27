import { useState } from 'react';
import { FileText } from 'lucide-react';
import { CitationPreview } from './CitationPreview';
import type { Citation } from '@/types/studyhub';

interface CitationBadgeProps {
  citation: Citation;
}

export function CitationBadge({ citation }: CitationBadgeProps) {
  const [showPreview, setShowPreview] = useState(false);

  const label = citation.page_or_paragraph
    ? `${citation.source_filename}, p.${citation.page_or_paragraph}`
    : citation.source_filename;

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/20 hover:bg-purple-500/25 transition-colors cursor-pointer"
      >
        <FileText className="w-3 h-3" />
        {label}
      </button>
      {showPreview && (
        <CitationPreview
          citation={citation}
          onClose={() => setShowPreview(false)}
        />
      )}
    </span>
  );
}
