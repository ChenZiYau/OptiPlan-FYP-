import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Send, Trash2 } from 'lucide-react';
import { uuid } from '@/lib/utils';
import type { DashboardItem, TaskStatus, Importance, TaskNote } from '@/types/dashboard';
import { ImportanceSlider } from '@/components/dashboard/ImportanceSlider';

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-indigo-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-500' },
];

interface TaskDetailDrawerProps {
  item: DashboardItem | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<DashboardItem>) => void;
  onDelete: (id: string) => void;
}

export function TaskDetailDrawer({ item, open, onClose, onUpdate, onDelete }: TaskDetailDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [importance, setImportance] = useState<Importance>(2);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const noteInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when item changes
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description);
      setDate(item.date);
      setImportance(item.importance);
      setStatus(item.status ?? 'todo');
      setNotes(item.notes ?? []);
    }
  }, [item]);

  if (!item) return null;

  const handleBlurTitle = () => {
    if (title.trim() && title !== item.title) {
      onUpdate(item.id, { title: title.trim() });
    }
  };

  const handleBlurDescription = () => {
    if (description !== item.description) {
      onUpdate(item.id, { description: description.trim() });
    }
  };

  const handleBlurDate = () => {
    if (date !== item.date) {
      onUpdate(item.id, { date });
    }
  };

  const handleImportanceChange = (v: Importance) => {
    setImportance(v);
    onUpdate(item.id, { importance: v });
  };

  const handleStatusChange = (s: TaskStatus) => {
    setStatus(s);
    onUpdate(item.id, { status: s });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const newNote: TaskNote = {
      id: uuid(),
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...notes, newNote];
    setNotes(updated);
    setNoteText('');
    onUpdate(item.id, { notes: updated });
    noteInputRef.current?.focus();
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    onUpdate(item.id, { notes: updated });
  };

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#12101f] border-l border-white/10 z-[91] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Task Details</span>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleBlurTitle}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleBlurDescription}
                  rows={3}
                  placeholder="Add details..."
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleStatusChange(opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        status === opt.value
                          ? `${opt.color} text-white`
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onBlur={handleBlurDate}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-purple-500/50 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Importance */}
              <ImportanceSlider value={importance} onChange={handleImportanceChange} />

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Notes</label>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {notes.length === 0 && (
                    <p className="text-xs text-gray-600 italic">No notes yet</p>
                  )}
                  {notes.map((note) => (
                    <div key={note.id} className="group flex gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 whitespace-pre-wrap">{note.text}</p>
                        <p className="text-[10px] text-gray-600 mt-1">
                          {new Date(note.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="shrink-0 p-1 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add note input */}
                <div className="flex gap-2">
                  <input
                    ref={noteInputRef}
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                    placeholder="Add a note..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-all"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!noteText.trim()}
                    className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors w-full justify-center"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Task
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
