import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, Loader2 } from 'lucide-react';
import { useNotebooks } from '@/hooks/useNotebooks';
import { useStudyHub } from '@/contexts/StudyHubContext';

export function NotebookSelector() {
  const { notebooks, loading, createNotebook, deleteNotebook } = useNotebooks();
  const { activeNotebookId, setActiveNotebookId } = useStudyHub();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const t = title.trim();
    if (!t) return;
    setCreating(true);
    const nb = await createNotebook(t);
    if (nb) setActiveNotebookId(nb.id);
    setTitle('');
    setShowCreate(false);
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this notebook and all its sources?')) return;
    await deleteNotebook(id);
    if (activeNotebookId === id) setActiveNotebookId(null);
  }

  return (
    <div className="w-64 shrink-0 border-r border-white/10 bg-white/[0.02] flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          Notebooks
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex items-center justify-center transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pt-3 overflow-hidden"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Notebook title..."
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 mb-2"
            />
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim()}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors disabled:opacity-40"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => { setShowCreate(false); setTitle(''); }}
                className="flex-1 py-1.5 text-xs rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : notebooks.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-gray-500">No notebooks yet</p>
            <p className="text-xs text-gray-600 mt-1">Create one to get started</p>
          </div>
        ) : (
          notebooks.map((nb) => (
            <div
              key={nb.id}
              onClick={() => setActiveNotebookId(nb.id)}
              className={`group flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                activeNotebookId === nb.id
                  ? 'bg-purple-500/10 border-r-2 border-purple-500 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <span className="text-sm truncate">{nb.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(nb.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
