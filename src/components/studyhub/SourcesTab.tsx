import { useState } from 'react';
import { FileText, Trash2, Loader2 } from 'lucide-react';
import { useStudyHub } from '@/contexts/StudyHubContext';
import { useSources } from '@/hooks/useSources';
import { FileUploader } from './FileUploader';
import { ChatPanel } from './ChatPanel';
import type { Source } from '@/types/studyhub';

export function SourcesTab() {
  const { activeNotebookId } = useStudyHub();
  const { sources, loading, uploading, uploadSource, deleteSource } = useSources(activeNotebookId);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  if (!activeNotebookId) {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-gray-500">Select or create a notebook to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* File uploader */}
      <FileUploader onUpload={uploadSource} uploading={uploading} />

      {/* Sources list + viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* File list */}
        <div className="rounded-xl bg-[#18162e] border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Sources ({sources.length})</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
              </div>
            ) : sources.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No sources uploaded yet</p>
            ) : (
              sources.map((src) => (
                <div
                  key={src.id}
                  onClick={() => setSelectedSource(src)}
                  className={`group flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-white/[0.04] ${
                    selectedSource?.id === src.id
                      ? 'bg-purple-500/10 text-white'
                      : 'text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{src.filename}</p>
                      <p className="text-[11px] text-gray-600">{src.char_count.toLocaleString()} chars</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSource(src.id); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Source viewer */}
        <div className="lg:col-span-2 rounded-xl bg-[#18162e] border border-white/10 overflow-hidden">
          {selectedSource ? (
            <>
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white truncate">{selectedSource.filename}</h3>
                <span className="text-[11px] text-gray-500">{selectedSource.file_type.toUpperCase()}</span>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {selectedSource.raw_text}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-8 h-8 text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">Select a source to view its content</p>
            </div>
          )}
        </div>
      </div>

      {/* RAG Chat */}
      <ChatPanel />
    </div>
  );
}
