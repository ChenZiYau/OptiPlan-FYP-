import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, Send, Plus, ChevronDown, Link, FileText, Calendar,
  Clock, CheckCircle2, Circle, ArrowRight, FolderOpen, Key,
  MessageSquare, ExternalLink, Copy, Check, X, Eye, EyeOff,
  Github, Figma, Globe, File, Upload,
} from 'lucide-react';
import { HoverTip } from '@/components/HoverTip';
import { useAuth } from '@/hooks/useAuth';

// ── Interfaces ──────────────────────────────────────────────

interface GroupProject {
  id: string;
  name: string;
  joinCode: string;
}

interface GroupMember {
  userId: string;
  name: string;
  initials: string;
  color: string;
  isOnline: boolean;
  role: 'admin' | 'member';
}

interface SharedTask {
  id: string;
  projectId: string;
  assignedTo: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isSystem: boolean;
}

interface TimeSlot {
  hour: number;
  day: string;
  availability: 'free' | 'partial' | 'blocked';
}

// ── Mock Data ───────────────────────────────────────────────

const PROJECTS: GroupProject[] = [];

const MEMBERS: GroupMember[] = [
  { userId: 'me', name: 'You', initials: 'YO', color: 'bg-purple-500', isOnline: true, role: 'admin' },
];

const INITIAL_MESSAGES: ChatMessage[] = [];

const INITIAL_TASKS: SharedTask[] = [];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

const SCHEDULE: TimeSlot[] = (() => {
  const slots: TimeSlot[] = [];
  const pattern: Record<string, ('free' | 'partial' | 'blocked')[]> = {
    Mon: ['free', 'free', 'free', 'free', 'free', 'free', 'free', 'free'],
    Tue: ['free', 'free', 'free', 'free', 'free', 'free', 'free', 'free'],
    Wed: ['free', 'free', 'free', 'free', 'free', 'free', 'free', 'free'],
    Thu: ['free', 'free', 'free', 'free', 'free', 'free', 'free', 'free'],
    Fri: ['free', 'free', 'free', 'free', 'free', 'free', 'free', 'free'],
  };
  DAYS.forEach(day => {
    HOURS.forEach((hour, i) => {
      slots.push({ hour, day, availability: pattern[day][i] });
    });
  });
  return slots;
})();

type ResourceCategory = 'documents' | 'links' | 'credentials';

interface VaultResource {
  id: string;
  title: string;
  url: string;
  category: ResourceCategory;
  addedBy: string; // userId
  icon: 'figma' | 'github' | 'drive' | 'trello' | 'link' | 'pdf' | 'doc' | 'key';
  isSecret?: boolean; // for credentials
}

const INITIAL_RESOURCES: VaultResource[] = [];

const CATEGORY_META: Record<ResourceCategory, { label: string; emoji: string }> = {
  documents: { label: 'Documents & Syllabus', emoji: '\uD83D\uDCC4' },
  links: { label: 'Important Links', emoji: '\uD83D\uDD17' },
  credentials: { label: 'Credentials & API Keys', emoji: '\uD83D\uDD10' },
};

// ── Helpers ─────────────────────────────────────────────────

const DEFAULT_MEMBER: GroupMember = { userId: 'me', name: 'You', initials: 'YO', color: 'bg-purple-500', isOnline: true, role: 'admin' };

function getMember(id: string): GroupMember {
  return MEMBERS.find(m => m.userId === id) || DEFAULT_MEMBER;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatHour(h: number) {
  return h <= 12 ? `${h}AM` : `${h - 12}PM`;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Component ───────────────────────────────────────────────

function MemberAvatar({ member, size = 'md' }: { member: GroupMember; size?: 'sm' | 'md' }) {
  const { profile } = useAuth();
  const isMe = member.userId === 'me';
  const avatarUrl = isMe ? profile?.avatar_url : null;
  const displayInitials = isMe && profile?.display_name
    ? (() => {
        const parts = profile.display_name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return profile.display_name.substring(0, 2).toUpperCase();
      })()
    : member.initials;
  const sizeClasses = size === 'sm' ? 'w-4 h-4 text-[6px]' : 'w-9 h-9 text-[11px]';

  if (avatarUrl) {
    return <img src={avatarUrl} alt={member.name} className={`${size === 'sm' ? 'w-4 h-4' : 'w-9 h-9'} rounded-full object-cover`} />;
  }
  return (
    <div className={`rounded-full ${member.color} flex items-center justify-center font-bold text-white ${sizeClasses}`}>
      {displayInitials}
    </div>
  );
}

export function CollabPage() {
  const [selectedProject, setSelectedProject] = useState<GroupProject | null>(() => {
    const stored = localStorage.getItem('collab-project');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return PROJECTS[0] ?? null;
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = localStorage.getItem('collab-messages');
    if (stored) {
      try { 
        return JSON.parse(stored).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {}
    }
    return INITIAL_MESSAGES;
  });
  const [tasks, setTasks] = useState<SharedTask[]>(() => {
    const stored = localStorage.getItem('collab-tasks');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return INITIAL_TASKS;
  });
  const [chatInput, setChatInput] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedProject !== undefined) localStorage.setItem('collab-project', JSON.stringify(selectedProject));
  }, [selectedProject]);

  useEffect(() => {
    localStorage.setItem('collab-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('collab-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    const text = chatInput.trim();
    if (!text) return;
    setMessages(prev => [...prev, {
      id: `m${Date.now()}`,
      senderId: 'me',
      text,
      timestamp: new Date(),
      isSystem: false,
    }]);
    setChatInput('');
  }

  function moveTask(taskId: string) {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const next: Record<string, 'todo' | 'doing' | 'done'> = { todo: 'doing', doing: 'done', done: 'done' };
      return { ...t, status: next[t.status] };
    }));
  }

  function addTask() {
    const title = newTaskTitle.trim();
    if (!title || !selectedProject) return;
    setTasks(prev => [...prev, {
      id: `t${Date.now()}`,
      projectId: selectedProject.id,
      assignedTo: 'me',
      title,
      status: 'todo',
    }]);
    setNewTaskTitle('');
    setShowNewTask(false);
  }

  const projectTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject.id) : [];
  const todoTasks = projectTasks.filter(t => t.status === 'todo');
  const doingTasks = projectTasks.filter(t => t.status === 'doing');
  const doneTasks = projectTasks.filter(t => t.status === 'done');

  const hasProjects = PROJECTS.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {hasProjects && selectedProject ? (
          <div className="relative">
            <HoverTip label="Switch between your group projects">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.06] transition-colors"
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-sm">{selectedProject.name}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
            </HoverTip>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute z-50 mt-2 w-64 rounded-xl bg-[#18162e] border border-white/10 shadow-xl overflow-hidden"
                >
                  {PROJECTS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProject(p); setShowDropdown(false); }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-white/[0.06] transition-colors ${p.id === selectedProject.id ? 'text-purple-400 bg-white/[0.03]' : 'text-gray-300'}`}
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Code: {p.joinCode}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-sm text-white">Collaboration</span>
          </div>
        )}

        <div className="flex gap-2">
          <HoverTip label="Create a new group project">
            <button
              onClick={() => toast('Group creation coming soon!', { description: 'This feature is under development.' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </HoverTip>
          {hasProjects && (
            <HoverTip label="Copy invite link to share with teammates">
              <button
                onClick={() => { if (selectedProject) { navigator.clipboard.writeText(selectedProject.joinCode); toast.success('Invite code copied to clipboard!'); } else { toast('Invite members coming soon!', { description: 'Create a group first.' }); } }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/[0.06] transition-colors"
              >
                <Link className="w-4 h-4" /> Invite Members
              </button>
            </HoverTip>
          )}
        </div>
      </div>

      {/* ── Empty State ─────────────────────────────────── */}
      {!hasProjects ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No group projects yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">Create a group to start collaborating with teammates — share tasks, chat, match schedules, and more.</p>
          <button
            onClick={() => toast('Group creation coming soon!', { description: 'This feature is under development.' })}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" /> Create Group
          </button>
        </motion.div>
      ) : (
      <>
      {/* ── Active Members ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {MEMBERS.map(m => (
            <div key={m.userId} className="relative" title={m.name}>
              <div className="border-2 border-[#0B0A1A] rounded-full">
                <MemberAvatar member={m} />
              </div>
              {m.isOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0B0A1A]" />
              )}
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500">{MEMBERS.filter(m => m.isOnline).length} online</span>
      </div>

      {/* ── Main Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Chat ───────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="lg:col-span-1 flex flex-col h-[600px] rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Project Chat</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-full">
                <p className="text-sm text-gray-500 text-center">No messages yet — start the conversation!</p>
              </div>
            ) : (
              messages.map(msg => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="text-center text-[11px] text-gray-500 italic py-1">
                      {msg.text}
                    </div>
                  );
                }
                const isMe = msg.senderId === 'me';
                const member = getMember(msg.senderId);
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${isMe ? 'order-1' : ''}`}>
                      {!isMe && (
                        <span className="text-[10px] text-gray-500 mb-0.5 block">{member.name}</span>
                      )}
                      <div className={`px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm' : 'bg-white/5 text-gray-200 rounded-bl-sm'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-600 mt-0.5 block">{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message…"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50 transition-colors"
              />
              <HoverTip label="Send message">
                <button
                  onClick={sendMessage}
                  className="p-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </HoverTip>
            </div>
          </div>
        </motion.div>

        {/* ── Right Column ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Kanban ───────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="rounded-xl bg-white/[0.03] border border-white/10 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Group Kanban</span>
              </div>
              <HoverTip label="Add a new shared task">
                <button
                  onClick={() => setShowNewTask(true)}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              </HoverTip>
            </div>

            <AnimatePresence>
              {showNewTask && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex gap-2 overflow-hidden"
                >
                  <input
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTask()}
                    placeholder="New task title…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50"
                    autoFocus
                  />
                  <button onClick={addTask} className="px-3 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-colors">Add</button>
                  <button onClick={() => setShowNewTask(false)} className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">Cancel</button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { label: 'To Do', items: todoTasks, icon: Circle, color: 'text-gray-400' },
                { label: 'Doing', items: doingTasks, icon: Clock, color: 'text-amber-400' },
                { label: 'Done', items: doneTasks, icon: CheckCircle2, color: 'text-green-400' },
              ] as const).map(col => (
                <div key={col.label}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <col.icon className={`w-3.5 h-3.5 ${col.color}`} />
                    <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                    <span className="text-[10px] text-gray-600 ml-auto">{col.items.length}</span>
                  </div>
                  <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
                    {col.items.length === 0 && (
                      <p className="text-xs text-gray-600 text-center py-4">No tasks yet</p>
                    )}
                    {col.items.map(task => {
                      const assignee = getMember(task.assignedTo);
                      return (
                        <motion.div
                          key={task.id}
                          variants={fadeUp}
                          className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors group"
                        >
                          <p className="text-xs text-gray-200 mb-2">{task.title}</p>
                          <div className="flex items-center justify-between">
                            <div title={assignee.name}>
                              <MemberAvatar member={assignee} size="sm" />
                            </div>
                            {task.status !== 'done' && (
                              <HoverTip label="Move to next column">
                                <button
                                  onClick={() => moveTask(task.id)}
                                  className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-[10px] text-purple-400 hover:text-purple-300 transition-all"
                                >
                                  Move <ArrowRight className="w-3 h-3" />
                                </button>
                              </HoverTip>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Schedule Matcher ──────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="rounded-xl bg-white/[0.03] border border-white/10 p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Schedule Matcher</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/60" /> All free</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/50" /> Some busy</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-white/5" /> Blocked</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Header row */}
                <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)` }}>
                  <div />
                  {HOURS.map(h => (
                    <div key={h} className="text-center text-[10px] text-gray-500 pb-1">{formatHour(h)}</div>
                  ))}
                </div>
                {/* Day rows */}
                {DAYS.map(day => (
                  <div key={day} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)` }}>
                    <div className="text-xs text-gray-400 flex items-center">{day}</div>
                    {HOURS.map(hour => {
                      const slot = SCHEDULE.find(s => s.day === day && s.hour === hour)!;
                      const bg = slot.availability === 'free'
                        ? 'bg-green-500/40 hover:bg-green-500/60 cursor-pointer'
                        : slot.availability === 'partial'
                          ? 'bg-amber-500/30'
                          : 'bg-white/[0.03]';
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className={`h-8 rounded-md ${bg} transition-colors`}
                          title={`${day} ${formatHour(hour)} — ${slot.availability}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 text-right">
              <HoverTip label="Suggest a meeting during a free slot">
                <button
                  onClick={() => toast('Meeting proposal coming soon!', { description: 'Scheduling integration is under development.' })}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 ml-auto"
                >
                  <Clock className="w-3.5 h-3.5" /> Propose Meeting on Free Slot
                </button>
              </HoverTip>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Resource Vault ────────────────────────────── */}
      <ResourceVault />
      </>
      )}
    </motion.div>
  );
}

// ── Resource Vault Component ──────────────────────────────────────────────

function getResourceIcon(icon: VaultResource['icon']) {
  switch (icon) {
    case 'figma': return Figma;
    case 'github': return Github;
    case 'drive': return Globe;
    case 'trello': return CheckCircle2;
    case 'pdf': return FileText;
    case 'doc': return File;
    case 'key': return Key;
    default: return Link;
  }
}

function ResourceVault() {
  const [resources, setResources] = useState<VaultResource[]>(() => {
    const stored = localStorage.getItem('collab-resources');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return INITIAL_RESOURCES;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('collab-revealed');
    if (stored) {
      try { return new Set(JSON.parse(stored)); } catch (e) {}
    }
    return new Set();
  });

  useEffect(() => {
    localStorage.setItem('collab-resources', JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('collab-revealed', JSON.stringify(Array.from(revealedIds)));
  }, [revealedIds]);

  // Add resource form state
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<ResourceCategory>('links');
  const [formIcon, setFormIcon] = useState<VaultResource['icon']>('link');
  const [formIsSecret, setFormIsSecret] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  function copyToClipboard(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleReveal(id: string) {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleAddResource() {
    const title = formTitle.trim();
    const url = formUrl.trim();
    if (!title || !url) return;
    setResources(prev => [...prev, {
      id: `r${Date.now()}`,
      title,
      url,
      category: formCategory,
      addedBy: 'me',
      icon: formIcon,
      isSecret: formIsSecret,
    }]);
    setFormTitle('');
    setFormUrl('');
    setFormCategory('links');
    setFormIcon('link');
    setFormIsSecret(false);
    setShowAddModal(false);
  }

  const categories: ResourceCategory[] = ['documents', 'links', 'credentials'];

  return (
    <>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="rounded-xl bg-white/[0.03] border border-white/10 p-6"
      >
        {/* Vault Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Project Resource Vault</span>
            <span className="text-[10px] text-gray-600 ml-1">{resources.length} items</span>
          </div>
          <HoverTip label="Add a link, document, or credential">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" /> Add Resource
            </button>
          </HoverTip>
        </div>

        {/* Category Grids */}
        <div className="space-y-6">
          {resources.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No resources shared yet.</p>
              <p className="text-xs text-gray-600 mt-1">Click + Add Resource to get started.</p>
            </div>
          )}
          {categories.map(cat => {
            const meta = CATEGORY_META[cat];
            const catResources = resources.filter(r => r.category === cat);
            if (catResources.length === 0) return null;

            return (
              <div key={cat}>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>{meta.emoji}</span> {meta.label}
                  <span className="text-[10px] text-gray-600 font-normal lowercase tracking-normal">({catResources.length})</span>
                </h4>
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                >
                  {catResources.map(resource => {
                    const IconComp = getResourceIcon(resource.icon);
                    const member = getMember(resource.addedBy);
                    const isRevealed = revealedIds.has(resource.id);
                    const isCopied = copiedId === resource.id;

                    return (
                      <motion.div
                        key={resource.id}
                        variants={fadeUp}
                        className="bg-[#18162e] border border-white/10 hover:border-purple-500 transition-colors p-3 rounded-lg group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* Left: Icon + Title */}
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <IconComp className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-white truncate">{resource.title}</p>
                              {resource.isSecret ? (
                                <p className="text-[10px] text-gray-500 mt-0.5 font-mono truncate">
                                  {isRevealed ? resource.url : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                                </p>
                              ) : (
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{resource.url}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <MemberAvatar member={member} size="sm" />
                                <span className="text-[10px] text-gray-600">Added by {member.name}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {resource.isSecret && (
                              <HoverTip label={isRevealed ? 'Hide credential' : 'Show credential'}>
                                <button
                                  onClick={() => toggleReveal(resource.id)}
                                  className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                                  title={isRevealed ? 'Hide' : 'Reveal'}
                                >
                                  {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </HoverTip>
                            )}
                            <HoverTip label="Copy to clipboard">
                              <button
                                onClick={() => copyToClipboard(resource.id, resource.url)}
                                className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                                title="Copy"
                              >
                                {isCopied
                                  ? <Check className="w-3.5 h-3.5 text-green-400" />
                                  : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </HoverTip>
                            {!resource.isSecret && (
                              <HoverTip label="Open in new tab">
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                                  title="Open"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </HoverTip>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Add Resource Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
            >
              <div className="bg-[#131127] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Add Resource</h3>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-5 py-4 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Title</label>
                    <input
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="e.g. Project Design Specs"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">URL / Value</label>
                    <div className="relative">
                      <input
                        value={formUrl}
                        onChange={e => setFormUrl(e.target.value)}
                        placeholder="https://... or paste a credential"
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-10 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors"
                      />
                      <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    </div>
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
                    <div className="relative">
                      <button
                        onClick={() => setShowCatDropdown(!showCatDropdown)}
                        className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white hover:bg-white/[0.07] transition-colors"
                      >
                        <span>{CATEGORY_META[formCategory].emoji} {CATEGORY_META[formCategory].label}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showCatDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {showCatDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute z-10 top-full left-0 mt-1 w-full rounded-xl bg-[#18162e] border border-white/10 shadow-xl overflow-hidden"
                          >
                            {categories.map(cat => (
                              <button
                                key={cat}
                                onClick={() => {
                                  setFormCategory(cat);
                                  setFormIsSecret(cat === 'credentials');
                                  setShowCatDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                  formCategory === cat ? 'text-purple-400 bg-white/[0.03]' : 'text-gray-300 hover:bg-white/[0.06]'
                                }`}
                              >
                                {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Icon Selector */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Icon</label>
                    <div className="flex gap-2 flex-wrap">
                      {([
                        { value: 'link', Icon: Globe, label: 'Link' },
                        { value: 'pdf', Icon: FileText, label: 'PDF' },
                        { value: 'doc', Icon: File, label: 'Doc' },
                        { value: 'github', Icon: Github, label: 'GitHub' },
                        { value: 'figma', Icon: Figma, label: 'Figma' },
                        { value: 'key', Icon: Key, label: 'Key' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setFormIcon(opt.value)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors ${
                            formIcon === opt.value
                              ? 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                              : 'border-white/10 bg-white/[0.02] text-gray-500 hover:text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          <opt.Icon className="w-3 h-3" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Added by tag */}
                  <div className="flex items-center gap-2 pt-1">
                    <MemberAvatar member={DEFAULT_MEMBER} size="sm" />
                    <span className="text-[11px] text-gray-500">Added by You</span>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex gap-2 px-5 py-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 text-sm rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddResource}
                    disabled={!formTitle.trim() || !formUrl.trim()}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add Resource
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
