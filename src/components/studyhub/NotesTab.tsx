import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Loader2, AlertCircle, BookOpen, Sparkles } from 'lucide-react';
import { useStudyHub } from '@/contexts/StudyHubContext';
import { useNotes } from '@/hooks/useNotes';
import { supabase } from '@/lib/supabase';

export function NotesTab() {
  const { activeNotebookId } = useStudyHub();
  const { notes, loading, generating, error, generateNotes } = useNotes(activeNotebookId);
  const [sourceCount, setSourceCount] = useState(0);

  useEffect(() => {
    if (!activeNotebookId) {
      setSourceCount(0);
      return;
    }
    supabase
      .from('sources')
      .select('id', { count: 'exact', head: true })
      .eq('notebook_id', activeNotebookId)
      .then(({ count }) => setSourceCount(count ?? 0));
  }, [activeNotebookId]);

  if (!activeNotebookId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
        <BookOpen className="w-10 h-10" />
        <p>Select a notebook to view or generate notes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => generateNotes()}
          disabled={generating || sourceCount === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {generating
            ? 'Analyzing document chunks and generating notes...'
            : sourceCount > 0
              ? `Generate Notes from ${sourceCount} source${sourceCount !== 1 ? 's' : ''}`
              : 'No sources uploaded yet'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      )}

      {/* Notes list */}
      {!loading && notes.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3">
          <FileText className="w-10 h-10" />
          <p>No notes yet. Upload documents in Sources, then generate notes here.</p>
        </div>
      )}

      {notes.map((note) => (
        <motion.div
          key={note.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {new Date(note.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="text-[10px] text-gray-600 font-mono">{note.model}</span>
          </div>
          <div className="px-5 py-4 prose prose-invert prose-sm max-w-none prose-p:text-gray-300 prose-p:leading-relaxed prose-strong:text-white prose-li:text-gray-300 prose-code:text-purple-300 prose-code:bg-purple-900/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-headings:text-white prose-h1:text-xl prose-h2:text-base prose-h3:text-sm prose-table:text-gray-300 prose-th:text-white prose-th:bg-white/5 prose-td:border-white/10 prose-th:border-white/10 prose-blockquote:border-purple-500/40 prose-blockquote:text-gray-400 prose-a:text-purple-400 prose-img:rounded-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
