import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users, Send, Plus, ChevronDown, ChevronLeft, ChevronRight, Link, FileText, Calendar,
  Clock, CheckCircle2, Circle, ArrowRight, FolderOpen, Key,
  MessageSquare, ExternalLink, Copy, Check, X,
  Github, Figma, Globe, File, Trash2, MoreVertical,
  UserPlus, UserMinus, Pencil, StickyNote, Bell, Archive, ArchiveRestore, ArrowLeft,
  Shield, Info, AlertTriangle,
} from 'lucide-react';
import { HoverTip } from '@/components/HoverTip';
import { useAuth } from '@/hooks/useAuth';
import {
  addFriendByUid,
  getFriends,
  getPendingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  updateFriendNickname,
  updateFriendNote,
  createGroup,
  joinGroupByCode,
  getUserGroups,
  getGroupMembers,
  getGroupMessages,
  sendGroupMessage,
  unsendGroupMessage,
  UNSENT_MARKER,
  getGroupLinks,
  addGroupLink,
  getGroupFiles,
  uploadGroupFile,
  getGroupTasks,
  createGroupTask,
  updateGroupTask,
  deleteGroupTask,
  getGroupSchedules,
  deleteGroup,
  getGroupScheduleTasks,
  createGroupScheduleTask,
  type GroupMemberSchedule,
  type ScheduleTask,
} from '@/lib/collabService';
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Interfaces ──────────────────────────────────────────────

interface GroupProject {
  id: string;
  name: string;
  joinCode: string;
  creatorId: string;
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
  createdBy: string;
  assignedTo: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done' | 'archived';
  assigneeUsername: string | null;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderUsername?: string;
  text: string;
  timestamp: Date;
  isSystem: boolean;
}



// ── Schedule Block Logic ────────────────────────────────────────

type ResourceCategory = 'files' | 'links';

interface VaultResource {
  id: string;
  title: string;
  url: string;
  category: ResourceCategory;
  addedBy: string; // userId
  icon: 'figma' | 'github' | 'drive' | 'trello' | 'link' | 'pdf' | 'doc' | 'key' | 'file';
  isSecret?: boolean; // for credentials (unused now but keeps compat)
}

const CATEGORY_META: Record<ResourceCategory, { label: string; emoji: string }> = {
  files: { label: 'Documents & Files', emoji: '📄' },
  links: { label: 'Important Links', emoji: '🔗' },
};

// ── Helpers ─────────────────────────────────────────────────

function generateInitials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Component ───────────────────────────────────────────────

function MemberAvatar({ member, size = 'md' }: { member: GroupMember; size?: 'sm' | 'md' }) {
  const { profile } = useAuth();
  const isMe = member.userId === 'me' || member.userId === profile?.id;
  const avatarUrl = isMe ? profile?.avatar_url : null;

  const displayInitials = generateInitials(member.name);
  const sizeClasses = size === 'sm' ? 'w-4 h-4 text-[6px]' : 'w-9 h-9 text-[11px]';

  if (avatarUrl) {
    return <img src={avatarUrl} alt={member.name} className={`${size === 'sm' ? 'w-4 h-4' : 'w-9 h-9'} rounded-full object-cover`} />;
  }
  return (
    <div className={`rounded-full ${member.color} flex items-center justify-center font-bold text-white ${sizeClasses}`} title={member.name}>
      {displayInitials}
    </div>
  );
}

export function CollabPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<GroupProject[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);

  const [selectedProject, setSelectedProject] = useState<GroupProject | null>(() => {
    const stored = localStorage.getItem('collab-project');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return null;
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getUserGroups(user.id).then(g => {
        const mapped = g.map((x: any) => ({
          id: x.id,
          name: x.name,
          joinCode: x.invite_code,
          creatorId: x.creator_id,
        }));
        setProjects(mapped);
        if (mapped.length > 0 && !selectedProject) {
          setSelectedProject(mapped[0]);
        }
      }).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('collab-project', JSON.stringify(selectedProject));
      getGroupMembers(selectedProject.id).then(m => {
        setMembers(m.map((x: any) => ({
          userId: x.uid,
          name: x.username,
          initials: generateInitials(x.username),
          color: 'bg-purple-500',
          isOnline: true, // simplified mock
          role: x.uid === selectedProject.creatorId ? 'admin' : 'member',
        })));
      }).catch(console.error);
    }
  }, [selectedProject]);

  async function handleCreateGroup() {
    if (!user || !modalInput.trim()) return;
    setIsSubmitting(true);
    try {
      const g = await createGroup(modalInput.trim(), user.id);
      const newProj = { id: g.id, name: g.name, joinCode: g.invite_code, creatorId: g.creator_id };
      setProjects(prev => [...prev, newProj]);
      setSelectedProject(newProj);
      toast.success('Group created successfully! Invite code: ' + g.invite_code);
      setShowCreateModal(false);
      setModalInput('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoinGroup() {
    if (!user || !modalInput.trim() || modalInput.trim().length !== 6) {
      toast.error('Invalid code. Must be 6 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      const g = await joinGroupByCode(modalInput.trim(), user.id);
      const newProj = { id: g.id, name: g.name, joinCode: g.invite_code, creatorId: g.creator_id };
      setProjects(prev => {
        if (!prev.find(p => p.id === newProj.id)) return [...prev, newProj];
        return prev;
      });
      setSelectedProject(newProj);
      toast.success('Joined group successfully!');
      setShowJoinModal(false);
      setModalInput('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to join group');
    } finally {
      setIsSubmitting(false);
    }
  }

  const [collabView, setCollabView] = useState<'chat' | 'schedule'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<SharedTask[]>([]);
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [, setSchedules] = useState<GroupMemberSchedule[]>([]);
  const [currentWeekOffset] = useState(0);
  const [scheduleScale] = useState<'week' | 'month'>('week');
  const scrollLockRef = useRef<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [selectedTask, setSelectedTask] = useState<SharedTask | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [editingTaskDesc, setEditingTaskDesc] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<SharedTask | null>(null);
  const [confirmArchiveTask, setConfirmArchiveTask] = useState<SharedTask | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat messages & tasks when group changes
  useEffect(() => {
    if (selectedProject) {
      getGroupMessages(selectedProject.id).then(msgs => {
        setMessages(msgs.map(m => ({
          id: m.id,
          senderId: m.sender_id,
          senderUsername: m.sender_username,
          text: m.content,
          timestamp: new Date(m.created_at),
          isSystem: false,
        })));
      }).catch(console.error);

      getGroupTasks(selectedProject.id).then(t => {
        setTasks(t.map(x => ({
          id: x.id,
          projectId: x.groupId,
          createdBy: x.createdBy,
          assignedTo: x.assignedTo || x.createdBy,
          title: x.title,
          description: x.description,
          status: x.status,
          assigneeUsername: x.assigneeUsername,
        })));
      }).catch(console.error);

      getGroupSchedules(selectedProject.id, currentWeekOffset).then(data => {
        if (scheduleScale === 'month') {
          // Fetch all 4 visible weeks for month view
          Promise.all(
            Array.from({ length: 4 }, (_, i) => getGroupSchedules(selectedProject.id, currentWeekOffset + i))
          ).then(results => setSchedules(results.flat())).catch(console.error);
        } else {
          setSchedules(data);
        }
      }).catch(console.error);

      // Load schedule calendar tasks
      getGroupScheduleTasks(selectedProject.id).then(setScheduleTasks).catch(console.error);

      // Real-time Kanban syncing
      const tasksChannel = supabase.channel(`group_tasks_${selectedProject.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_tasks', filter: `group_id=eq.${selectedProject.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const d = payload.new;
              setTasks(prev => {
                if (prev.find(t => t.id === d.id)) return prev;
                return [...prev, {
                  id: d.id,
                  projectId: d.group_id,
                  createdBy: d.created_by,
                  assignedTo: d.assigned_to,
                  title: d.title,
                  description: d.description || '',
                  status: d.status as 'todo' | 'doing' | 'done' | 'archived',
                  assigneeUsername: null,
                }];
              });
            } else if (payload.eventType === 'UPDATE') {
              const d = payload.new;
              setTasks(prev => prev.map(t => t.id === d.id ? {
                ...t,
                assignedTo: d.assigned_to,
                title: d.title,
                description: d.description || '',
                status: d.status as 'todo' | 'doing' | 'done' | 'archived',
              } : t));
            } else if (payload.eventType === 'DELETE') {
              const d = payload.old;
              setTasks(prev => prev.filter(t => t.id !== d.id));
            }
          }
        )
        .subscribe();

      // Real-time Chat Syncing
      const messagesChannel = supabase.channel(`group_messages_${selectedProject.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_messages', filter: `group_id=eq.${selectedProject.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const d = payload.new;
              setMessages(prev => {
                // Skip if already exists (optimistic insert from sender)
                if (prev.find(m => m.id === d.id)) return prev;
                return [...prev, {
                  id: d.id,
                  senderId: d.sender_id,
                  senderUsername: undefined, // will show from member lookup
                  text: d.content,
                  timestamp: new Date(d.created_at),
                  isSystem: false,
                }];
              });
            } else if (payload.eventType === 'UPDATE') {
              const d = payload.new;
              setMessages(prev => prev.map(m => m.id === d.id ? { ...m, text: d.content } : m));
            }
          }
        )
        .subscribe();

      // Real-time Schedule Syncing
      const schedulesChannel = supabase.channel(`group_schedules_${selectedProject.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_member_schedules', filter: `group_id=eq.${selectedProject.id}` },
          (_payload) => {
            getGroupSchedules(selectedProject.id, currentWeekOffset).then(setSchedules);
          }
        )
        .subscribe();

      // Real-time Schedule Tasks (Calendar) Syncing
      const scheduleTasksChannel = supabase.channel(`group_schedule_tasks_${selectedProject.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_schedule_tasks', filter: `group_id=eq.${selectedProject.id}` },
          () => {
            getGroupScheduleTasks(selectedProject.id).then(setScheduleTasks).catch(console.error);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(tasksChannel);
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(schedulesChannel);
        supabase.removeChannel(scheduleTasksChannel);
      };
    } else {
      setMessages([]);
      setTasks([]);
      setSchedules([]);
      setScheduleTasks([]);
    }
  }, [selectedProject, currentWeekOffset, scheduleScale]);

  // Lock scroll position when schedule scale changes
  useLayoutEffect(() => {
    if (scrollLockRef.current !== null) {
      window.scrollTo(0, scrollLockRef.current);
      scrollLockRef.current = null;
    }
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = chatInput.trim();
    if (!text || !user || !selectedProject) return;

    const tempId = `temp-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      senderId: user.id,
      senderUsername: user.user_metadata?.username || 'You',
      text,
      timestamp: new Date(),
      isSystem: false,
    };

    setMessages(prev => [...prev, newMsg]);
    setChatInput('');

    try {
      const saved = await sendGroupMessage(selectedProject.id, user.id, text);
      setMessages(prev => prev.map(m => m.id === tempId ? {
        id: saved.id,
        senderId: saved.sender_id,
        senderUsername: saved.sender_username,
        text: saved.content,
        timestamp: new Date(saved.created_at),
        isSystem: false,
      } : m));
    } catch (e: any) {
      toast.error('Failed to send message: ' + e.message);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  }

  async function handleUnsendMessage(messageId: string) {
    if (!user || !selectedProject) return;
    // Optimistically push a local tombstone so it unsends instantly in UI
    const backup = messages;
    const tombstone: ChatMessage = {
      id: `temp-tombstone-${Date.now()}`,
      senderId: user.id,
      text: `${UNSENT_MARKER}:${messageId}`,
      timestamp: new Date(),
      isSystem: false,
    };
    setMessages(prev => [...prev, tombstone]);
    try {
      await unsendGroupMessage(messageId, selectedProject.id, user.id);
    } catch (e: any) {
      toast.error('Failed to unsend message: ' + e.message);
      setMessages(backup);
    }
  }

  async function moveTask(taskId: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === 'done') return;
    const next: Record<string, 'todo' | 'doing' | 'done'> = { todo: 'doing', doing: 'done', done: 'done' };
    const newStatus = next[task.status];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await updateGroupTask(taskId, { status: newStatus });
    } catch (e: any) {
      toast.error('Failed to update task');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t));
    }
  }

  async function moveTaskBack(taskId: string) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === 'todo') return;
    const prev: Record<string, 'todo' | 'doing' | 'done'> = { todo: 'todo', doing: 'todo', done: 'doing' };
    const newStatus = prev[task.status];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await updateGroupTask(taskId, { status: newStatus });
    } catch (e: any) {
      toast.error('Failed to update task');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t));
    }
  }

  async function handleDeleteTask() {
    if (!confirmDeleteTask) return;
    const taskId = confirmDeleteTask.id;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setConfirmDeleteTask(null);
    try {
      await deleteGroupTask(taskId);
      toast.success('Task deleted');
    } catch (e: any) {
      toast.error('Failed to delete task');
    }
  }

  async function handleArchiveTask() {
    if (!confirmArchiveTask) return;
    const taskId = confirmArchiveTask.id;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'archived' } : t));
    setConfirmArchiveTask(null);
    try {
      await updateGroupTask(taskId, { status: 'archived' });
      toast.success('Task archived');
    } catch (e: any) {
      toast.error('Failed to archive task');
    }
  }

  async function handleUnarchiveTask(taskId: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'done' } : t));
    try {
      await updateGroupTask(taskId, { status: 'done' });
      toast.success('Task unarchived');
    } catch (e: any) {
      toast.error('Failed to unarchive task');
    }
  }

  async function addTask() {
    const title = newTaskTitle.trim();
    if (!title || !selectedProject || !user) return;
    try {
      const saved = await createGroupTask(selectedProject.id, user.id, title, newTaskDesc.trim() || undefined);
      setTasks(prev => [...prev, {
        id: saved.id,
        projectId: saved.groupId,
        createdBy: saved.createdBy,
        assignedTo: saved.assignedTo || user.id,
        title: saved.title,
        description: saved.description,
        status: saved.status,
        assigneeUsername: saved.assigneeUsername,
      }]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowNewTask(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create task');
    }
  }

  function getMemberObj(id: string): GroupMember {
    if (id === 'me' && user) return { userId: user.id, name: 'You', initials: 'YO', color: 'bg-purple-500', isOnline: true, role: 'admin' };
    return members.find(m => m.userId === id) || { userId: id, name: 'Unknown', initials: '?', color: 'bg-gray-500', isOnline: false, role: 'member' };
  }

  function openTaskDetail(task: SharedTask) {
    setSelectedTask(task);
    setEditingTaskTitle(task.title);
    setEditingTaskDesc(task.description);
  }

  async function saveTaskEdit() {
    if (!selectedTask) return;
    const newTitle = editingTaskTitle.trim();
    if (!newTitle) { toast.error('Title is required'); return; }
    setIsSavingTask(true);
    try {
      await updateGroupTask(selectedTask.id, { title: newTitle, description: editingTaskDesc.trim() });
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, title: newTitle, description: editingTaskDesc.trim() } : t));
      setSelectedTask(null);
      toast.success('Task updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update task');
    } finally {
      setIsSavingTask(false);
    }
  }

  const projectTasks = selectedProject ? tasks.filter(t => t.projectId === selectedProject.id) : [];
  const todoTasks = projectTasks.filter(t => t.status === 'todo');
  const doingTasks = projectTasks.filter(t => t.status === 'doing');
  const doneTasks = projectTasks.filter(t => t.status === 'done');
  const archivedTasks = projectTasks.filter(t => t.status === 'archived');

  const [showArchived, setShowArchived] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  async function handleDeleteGroup() {
    if (!user || !selectedProject) return;
    setIsDeletingGroup(true);
    try {
      await deleteGroup(selectedProject.id, user.id);
      toast.success('Group deleted successfully.');
      setConfirmDeleteGroup(false);
      setShowGroupInfo(false);
      setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
      const remaining = projects.filter(p => p.id !== selectedProject.id);
      setSelectedProject(remaining.length > 0 ? remaining[0] : null);
      localStorage.removeItem('collab-project');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete group');
    } finally {
      setIsDeletingGroup(false);
    }
  }

  const hasProjects = projects.length > 0;

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
                  {projects.map(p => (
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
          <HoverTip label="Join an existing group with a code">
            <button
              onClick={() => { setModalInput(''); setShowJoinModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
            >
              <Link className="w-4 h-4" /> Join Group
            </button>
          </HoverTip>
          <HoverTip label="Create a new group project">
            <button
              onClick={() => { setModalInput(''); setShowCreateModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </HoverTip>
          {hasProjects && (
            <HoverTip label="Copy setup invite link to share with teammates">
              <button
                onClick={() => { if (selectedProject) { navigator.clipboard.writeText(selectedProject.joinCode); toast.success('Invite code copied to clipboard!'); } }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/[0.06] transition-colors ml-2"
                title="Copy Invite Code"
              >
                <Copy className="w-4 h-4" />
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
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => { setModalInput(''); setShowJoinModal(true); }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              <Link className="w-5 h-5" /> Join Group
            </button>
            <button
              onClick={() => { setModalInput(''); setShowCreateModal(true); }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" /> Create Group
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* ── Active Members + View Toggle ────────────────── */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {members.map(m => (
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
              <span className="text-xs text-gray-500">{members.length} members</span>
            </div>

            {/* Segmented Control Toggle */}
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
              <button
                onClick={() => setCollabView('chat')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${collabView === 'chat'
                  ? 'bg-purple-500/30 text-purple-300 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </button>
              <button
                onClick={() => setCollabView('schedule')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${collabView === 'schedule'
                  ? 'bg-purple-500/30 text-purple-300 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule Matcher
              </button>
            </div>
          </div>

          {collabView === 'chat' ? (
          <>
          {/* ── Chat View Layout ─────────────────────────── */}
          <div className="flex flex-col xl:flex-row gap-6">

            {/* ── Main Content Area ─────────────────────────── */}
            <div className="flex-1 space-y-6 min-w-0">

                {/* ── Chat Panel ───────────────────────────────── */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col h-[600px] rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden"
                >
                  <button
                    onClick={() => setShowGroupInfo(true)}
                    className="flex items-center gap-3 w-full px-4 py-3 border-b border-white/10 hover:bg-white/[0.04] transition-colors cursor-pointer group/header"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {selectedProject ? generateInitials(selectedProject.name) : '?'}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="text-sm font-semibold text-white block truncate">{selectedProject?.name || 'Project Chat'}</span>
                      <span className="text-[10px] text-gray-500">{members.length} members · tap for info</span>
                    </div>
                    <Info className="w-4 h-4 text-gray-500 group-hover/header:text-purple-400 transition-colors shrink-0" />
                  </button>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                    {(() => {
                      // Process tombstones
                      const unsentIds = new Set<string>();
                      messages.forEach(m => {
                        if (m.text.startsWith(UNSENT_MARKER + ':')) {
                          unsentIds.add(m.text.substring(UNSENT_MARKER.length + 1));
                        }
                      });
                      const activeMessages = messages
                        .filter(m => !m.text.startsWith(UNSENT_MARKER + ':'))
                        .map(m => unsentIds.has(m.id) ? { ...m, text: UNSENT_MARKER } : m);

                      if (activeMessages.length === 0) {
                        return (
                          <div className="flex-1 flex items-center justify-center h-full">
                            <p className="text-sm text-gray-500 text-center">No messages yet — start the conversation!</p>
                          </div>
                        );
                      }

                      return activeMessages.map(msg => {
                        if (msg.isSystem) {
                          return (
                            <div key={msg.id} className="text-center text-[11px] text-gray-500 italic py-1">
                              {msg.text}
                            </div>
                          );
                        }
                        const isMe = msg.senderId === user?.id;
                        const member = getMemberObj(msg.senderId);
                        // Use the fetched senderUsername if available
                        if (msg.senderUsername) {
                          member.name = msg.senderUsername;
                          member.initials = generateInitials(msg.senderUsername);
                        }

                        const isUnsent = msg.text === UNSENT_MARKER;

                        return (
                          <div key={msg.id} className={`group/msg flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
                            <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                              {!isMe && (
                                <span className="text-[10px] text-gray-500 mb-0.5 ml-1">{member.name}</span>
                              )}

                              <div className="flex items-center gap-2">
                                {/* Three Dot Menu */}
                                {isMe && !isUnsent && (
                                  <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                          <MoreVertical className="w-4 h-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="min-w-[120px]">
                                        <DropdownMenuItem
                                          onClick={() => handleUnsendMessage(msg.id)}
                                          className="text-red-400 focus:text-red-300 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                                          Unsend
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}

                                {/* Bubble Content */}
                                {isUnsent ? (
                                  <div className="px-3 py-2 rounded-xl text-sm bg-white/[0.03] border border-white/5 text-gray-500 italic rounded-br-[4px] shadow-sm">
                                    🚫 This message was unsent
                                  </div>
                                ) : (
                                  <div className={`px-3 py-2 rounded-xl text-sm shadow-sm ${isMe ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-[4px]' : 'bg-white/5 text-gray-200 rounded-bl-[4px]'}`} style={{ wordBreak: 'break-word' }}>
                                    {msg.text}
                                  </div>
                                )}
                              </div>
                              <span className={`text-[9px] font-medium text-gray-500 mt-1 opacity-70 ${isMe ? 'mr-1' : 'ml-1'}`}>{formatTime(msg.timestamp)}</span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-3 border-t border-white/10 shrink-0">
                    <div className="flex items-center gap-2 w-full">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message…"
                        className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50 transition-colors"
                      />
                      <HoverTip label="Send message">
                        <button
                          onClick={sendMessage}
                          className="p-2 shrink-0 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </HoverTip>
                    </div>
                  </div>
                </motion.div>

              {/* ── Resource Vault ────────────────────────────── */}
              <ResourceVault selectedProject={selectedProject} members={members} />
            </div>

            {/* ── Friend List Sidebar ───────────────────────── */}
            <div className="w-full xl:w-96 shrink-0 space-y-6">

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
                      className="mb-4 space-y-2 overflow-hidden"
                    >
                      <input
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addTask()}
                        placeholder="Task title…"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50"
                        autoFocus
                      />
                      <textarea
                        value={newTaskDesc}
                        onChange={e => setNewTaskDesc(e.target.value)}
                        placeholder="Description (optional)…"
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50 resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => addTask()} className="px-3 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-colors">Add</button>
                        <button onClick={() => { setShowNewTask(false); setNewTaskTitle(''); setNewTaskDesc(''); }} className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">Cancel</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 gap-4">
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
                      <div className="space-y-2">
                        <AnimatePresence>
                          {col.items.length === 0 && (
                            <p className="text-xs text-gray-600 text-center py-4">No tasks yet</p>
                          )}
                          {col.items.map(task => {
                            const assignee = getMemberObj(task.assignedTo);
                            return (
                              <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => openTaskDetail(task)}
                                className="relative p-3 rounded-lg bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 hover:border-purple-500/50 hover:bg-white/[0.04] transition-all group shadow-sm cursor-pointer"
                              >
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {task.status === 'done' && (
                                    <HoverTip label="Archive task">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmArchiveTask(task); }}
                                        className="p-1.5 rounded-md text-orange-400/70 hover:text-orange-400 hover:bg-orange-400/10 transition-colors"
                                      >
                                        <Archive className="w-4 h-4" />
                                      </button>
                                    </HoverTip>
                                  )}
                                  <HoverTip label="Delete task">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteTask(task); }}
                                      className="p-1.5 rounded-md text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </HoverTip>
                                </div>
                                <p className={`text-xs mb-1 min-w-0 break-words pr-16 ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{task.title}</p>
                                {task.description && (
                                  <p className="text-[10px] text-gray-500 mb-2 line-clamp-2 break-words">{task.description}</p>
                                )}
                                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
                                  <MemberAvatar member={assignee} size="sm" />
                                  <span className="text-[10px] text-gray-500 truncate min-w-0 pr-2">{task.assigneeUsername || assignee.name}</span>

                                  {/* Movement Buttons */}
                                  <div className="flex items-center gap-1.5 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {task.status !== 'todo' && (
                                      <HoverTip label="Move Left">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); moveTaskBack(task.id); }}
                                          className="p-1.5 rounded-md bg-white/5 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 border border-white/5 transition-colors"
                                        >
                                          <ArrowLeft className="w-3.5 h-3.5" />
                                        </button>
                                      </HoverTip>
                                    )}
                                    {task.status !== 'done' && (
                                      <HoverTip label="Move Right">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); moveTask(task.id); }}
                                          className="p-1.5 rounded-md bg-white/5 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 border border-white/5 transition-colors"
                                        >
                                          <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                      </HoverTip>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>

                {archivedTasks.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => setShowArchived(!showArchived)}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {showArchived ? 'Hide Archived Tasks' : `Show Archived Tasks (${archivedTasks.length})`}
                    </button>
                    <AnimatePresence>
                      {showArchived && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden space-y-2"
                        >
                          {archivedTasks.map(task => (
                            <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                              <div>
                                <p className="text-xs text-gray-400 break-words">{task.title}</p>
                                {task.description && <p className="text-[10px] text-gray-600 line-clamp-1 break-words">{task.description}</p>}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[10px] text-gray-500 font-medium">Archived</span>
                                <HoverTip label="Unarchive to Done">
                                  <button
                                    onClick={() => handleUnarchiveTask(task.id)}
                                    className="p-1.5 rounded-md bg-white/5 hover:bg-green-500/20 text-gray-500 hover:text-green-400 transition-colors"
                                  >
                                    <ArchiveRestore className="w-3.5 h-3.5" />
                                  </button>
                                </HoverTip>
                                <HoverTip label="Delete permanently">
                                  <button
                                    onClick={() => setConfirmDeleteTask(task)}
                                    className="p-1.5 rounded-md bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </HoverTip>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>

              <FriendSidebar />
            </div>

          </div>
          </>
          ) : (
            /* ── Schedule Matcher View ──────────────────────── */
            <ScheduleMatcherCalendar
              selectedProject={selectedProject}
              scheduleTasks={scheduleTasks}
              setScheduleTasks={setScheduleTasks}
              user={user}
            />
          )}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-2xl bg-[#0B0A1A] border border-white/10 p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2">Create a Group</h3>
              <p className="text-sm text-gray-400 mb-4">Enter a name for your new group project.</p>
              <input type="text" value={modalInput} onChange={e => setModalInput(e.target.value)} placeholder="Group Name..." onKeyDown={e => e.key === 'Enter' && handleCreateGroup()} autoFocus className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition-colors mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleCreateGroup} disabled={isSubmitting || !modalInput.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 disabled:opacity-50 transition-colors">{isSubmitting ? 'Creating...' : 'Create'}</button>
              </div>
            </motion.div>
          </div>
        )}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm rounded-2xl bg-[#0B0A1A] border border-white/10 p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-2">Join a Group</h3>
              <p className="text-sm text-gray-400 mb-4">Enter the 6-character code from a teammate.</p>
              <input type="text" value={modalInput} onChange={e => setModalInput(e.target.value)} placeholder="ABC123" maxLength={6} onKeyDown={e => e.key === 'Enter' && handleJoinGroup()} autoFocus className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl tracking-[0.2em] text-center uppercase text-white placeholder:text-gray-500/50 outline-none focus:border-purple-500 transition-colors mb-4 font-mono" />
              <div className="flex gap-3">
                <button onClick={() => setShowJoinModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleJoinGroup} disabled={isSubmitting || modalInput.trim().length !== 6} className="flex-1 px-4 py-2.5 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 disabled:opacity-50 transition-colors">{isSubmitting ? 'Joining...' : 'Join'}</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-[#0B0A1A] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">Task Details</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${selectedTask.status === 'todo' ? 'bg-gray-500/20 text-gray-400' :
                    selectedTask.status === 'doing' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                    {selectedTask.status === 'todo' ? 'To Do' : selectedTask.status === 'doing' ? 'Doing' : 'Done'}
                  </span>
                  <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Title</label>
                  <input
                    value={editingTaskTitle}
                    onChange={e => setEditingTaskTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Description</label>
                  <textarea
                    value={editingTaskDesc}
                    onChange={e => setEditingTaskDesc(e.target.value)}
                    placeholder="Add a description..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors resize-none"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <MemberAvatar member={getMemberObj(selectedTask.assignedTo)} size="sm" />
                  <span>Assigned to {selectedTask.assigneeUsername || getMemberObj(selectedTask.assignedTo).name}</span>
                </div>
              </div>

              <div className="flex gap-2 px-5 py-4 border-t border-white/[0.06]">
                <button onClick={() => setSelectedTask(null)} className="flex-1 py-2.5 text-sm rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={saveTaskEdit} disabled={isSavingTask} className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity disabled:opacity-40">
                  {isSavingTask ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Kanban Task Modal */}
      <AnimatePresence>
        {confirmDeleteTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDeleteTask(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-[#0B0A1A] border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3 text-red-400">
                <div className="p-2 rounded-full bg-red-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Delete Task</h3>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                Are you sure you want to permanently delete <span className="text-white font-semibold">"{confirmDeleteTask.title}"</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteTask(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleDeleteTask} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Archive Kanban Task Modal */}
      <AnimatePresence>
        {confirmArchiveTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmArchiveTask(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-[#0B0A1A] border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3 text-orange-400">
                <div className="p-2 rounded-full bg-orange-500/20">
                  <Archive className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Archive Task</h3>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                Are you sure you want to archive <span className="text-white font-semibold">"{confirmArchiveTask.title}"</span>? It will be minimized at the bottom of the Kanban board.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmArchiveTask(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleArchiveTask} className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors">Archive</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Group Info Panel (WhatsApp-style slide-over) ─────────────── */}
      <AnimatePresence>
        {showGroupInfo && selectedProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGroupInfo(false)}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#0B0A1A] border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              {/* Panel Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <button
                  onClick={() => setShowGroupInfo(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-white">Group Info</span>
              </div>

              {/* Group Avatar & Name */}
              <div className="flex flex-col items-center px-5 py-8 border-b border-white/[0.06]">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-purple-500/20">
                  {generateInitials(selectedProject.name)}
                </div>
                <h2 className="text-lg font-bold text-white mb-1">{selectedProject.name}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Group · {members.length} members</span>
                </div>
                <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[10px] text-gray-400 font-mono">Invite: {selectedProject.joinCode}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(selectedProject.joinCode); toast.success('Invite code copied!'); }}
                    className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">{members.length} Members</p>
                <div className="space-y-1">
                  {/* Sort so creator appears first */}
                  {[...members]
                    .sort((a, b) => {
                      if (a.userId === selectedProject.creatorId) return -1;
                      if (b.userId === selectedProject.creatorId) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map(member => {
                      const isCreator = member.userId === selectedProject.creatorId;
                      const isMe = member.userId === user?.id;
                      return (
                        <div key={member.userId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                          <div className="relative">
                            <MemberAvatar member={member} />
                            {member.isOnline && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0B0A1A]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white truncate">{member.name}{isMe ? ' (You)' : ''}</span>
                              {isCreator && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[9px] font-bold uppercase shrink-0">
                                  <Shield className="w-2.5 h-2.5" />
                                  Creator
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Danger Zone - Only visible to creator */}
              {user?.id === selectedProject.creatorId && (
                <div className="px-5 py-4 border-t border-white/[0.06]">
                  <p className="text-[10px] text-red-400/60 uppercase tracking-wider font-semibold mb-3">Danger Zone</p>
                  <button
                    onClick={() => setConfirmDeleteGroup(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Group
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Group Modal ─────────────────────────────── */}
      <AnimatePresence>
        {confirmDeleteGroup && selectedProject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => !isDeletingGroup && setConfirmDeleteGroup(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-[#0B0A1A] border border-red-500/20 p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-full bg-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Delete Group</h3>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                Are you sure you want to permanently delete <span className="text-white font-semibold">"{selectedProject.name}"</span>?
              </p>
              <p className="text-xs text-red-400/80 mb-5 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/10">
                This will permanently delete all messages, tasks, files, links, and schedules for every member in this group. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteGroup(false)}
                  disabled={isDeletingGroup}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGroup}
                  disabled={isDeletingGroup}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeletingGroup ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Friend System Component ──────────────────────────────────────────────

function FriendSidebar() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<{ uid: string; username: string; nickname: string | null; note: string | null }[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ id: string; uid: string; username: string; created_at: string }[]>([]);
  const [friendUid, setFriendUid] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Modal state for nickname / note editing
  const [editModal, setEditModal] = useState<{ type: 'nickname' | 'note'; friendUid: string; friendUsername: string; value: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Confirm remove state
  const [confirmRemove, setConfirmRemove] = useState<{ uid: string; username: string } | null>(null);

  function reload() {
    if (!user) return;
    getFriends(user.id).then(setFriends).catch(console.error);
    getPendingRequests(user.id).then(setPendingRequests).catch(console.error);
  }

  useEffect(() => {
    reload();

    if (!user) return;

    // Real-time sync for friendships
    const channel = supabase.channel(`friendships_${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `user_id=eq.${user.id}` },
        () => reload()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `friend_id=eq.${user.id}` },
        () => reload()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function handleAddFriend() {
    if (!user || !friendUid.trim()) return;
    setIsAdding(true);
    try {
      await addFriendByUid(user.id, friendUid.trim());
      toast.success('Friend request sent!');
      setFriendUid('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send request.');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleAccept(requestId: string) {
    if (!user) return;
    try {
      await acceptFriendRequest(requestId, user.id);
      toast.success('Friend request accepted!');
      reload();
    } catch (e: any) {
      toast.error(e.message || 'Failed to accept.');
    }
  }

  async function handleDecline(requestId: string) {
    if (!user) return;
    try {
      await declineFriendRequest(requestId, user.id);
      toast.success('Friend request declined.');
      reload();
    } catch (e: any) {
      toast.error(e.message || 'Failed to decline.');
    }
  }

  async function handleRemoveFriend(friendUid: string) {
    if (!user) return;
    try {
      await removeFriend(user.id, friendUid);
      toast.success('Friend removed.');
      setConfirmRemove(null);
      reload();
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove friend.');
    }
  }

  async function handleSaveEdit() {
    if (!user || !editModal) return;
    setIsSavingEdit(true);
    try {
      if (editModal.type === 'nickname') {
        await updateFriendNickname(user.id, editModal.friendUid, editValue.trim() || null);
        toast.success(editValue.trim() ? 'Nickname updated!' : 'Nickname removed.');
      } else {
        await updateFriendNote(user.id, editModal.friendUid, editValue.trim() || null);
        toast.success(editValue.trim() ? 'Note saved!' : 'Note removed.');
      }
      setEditModal(null);
      reload();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save.');
    } finally {
      setIsSavingEdit(false);
    }
  }

  function copyMyUid() {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast.success('Your UID copied to clipboard!');
    }
  }

  return (
    <>
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5 w-full">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Friend System</span>
        </div>

        {/* Your UID */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Your UID</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#18162e] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-gray-300 font-mono truncate select-all">
              {user?.id || 'Not logged in'}
            </div>
            <HoverTip label="Copy your UID to give to a friend">
              <button
                onClick={copyMyUid}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </HoverTip>
          </div>
        </div>

        {/* Send Friend Request */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Send Friend Request</p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={friendUid}
              onChange={(e) => setFriendUid(e.target.value)}
              placeholder="Enter friend's exact UID..."
              className="w-full bg-[#18162e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-purple-500/50 transition-colors font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
            />
            <button
              onClick={handleAddFriend}
              disabled={isAdding || !friendUid.trim()}
              className="w-full py-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isAdding ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>

        {/* Pending Friend Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Bell className="w-3 h-3 text-amber-400" />
                Friend Requests
              </span>
              <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded-md font-bold">{pendingRequests.length}</span>
            </p>
            <div className="space-y-2">
              {pendingRequests.map(req => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {req.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{req.username}</p>
                    <p className="text-[10px] text-gray-500">wants to be your friend</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAccept(req.id)}
                      className="p-1.5 rounded-md bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors"
                      title="Accept"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      className="p-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                      title="Decline"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Friend List */}
        <div>
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider flex justify-between items-center">
            <span>My Friends</span>
            <span className="bg-white/10 text-white text-[10px] px-1.5 py-0.5 rounded-md">{friends.length}</span>
          </p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
            {friends.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4 italic">No friends added yet.</p>
            ) : (
              friends.map(f => (
                <div key={f.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group/friend">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {(f.nickname || f.username).substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-white truncate">{f.nickname || f.username}</p>
                      {f.note && <span title="Has a note"><StickyNote className="w-3 h-3 text-yellow-500/60 shrink-0" /></span>}
                    </div>
                    {f.nickname && (
                      <p className="text-[10px] text-gray-500 truncate">@{f.username}</p>
                    )}
                  </div>

                  {/* 3-dot menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-md opacity-0 group-hover/friend:opacity-100 hover:bg-white/10 text-gray-500 hover:text-white transition-all">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditValue(f.nickname || '');
                          setEditModal({ type: 'nickname', friendUid: f.uid, friendUsername: f.username, value: f.nickname || '' });
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5 mr-2" />
                        Change Name
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditValue(f.note || '');
                          setEditModal({ type: 'note', friendUid: f.uid, friendUsername: f.username, value: f.note || '' });
                        }}
                      >
                        <StickyNote className="w-3.5 h-3.5 mr-2" />
                        {f.note ? 'Edit Note' : 'Add Note'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setConfirmRemove({ uid: f.uid, username: f.nickname || f.username })}
                      >
                        <UserMinus className="w-3.5 h-3.5 mr-2" />
                        Remove Friend
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Edit Nickname / Note Modal */}
      <AnimatePresence>
        {editModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-[#0B0A1A] border border-white/10 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-1">
                {editModal.type === 'nickname' ? 'Change Name' : 'Note'}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {editModal.type === 'nickname'
                  ? `Set a custom name for ${editModal.friendUsername}. Only visible to you.`
                  : `Add a private note for ${editModal.friendUsername}. Only visible to you.`}
              </p>
              {editModal.type === 'nickname' ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  placeholder={editModal.friendUsername}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                  autoFocus
                  maxLength={32}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition-colors mb-4"
                />
              ) : (
                <textarea
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  placeholder="Write a note..."
                  autoFocus
                  maxLength={256}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-purple-500 transition-colors mb-4 resize-none"
                />
              )}
              <div className="flex gap-3">
                <button onClick={() => setEditModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleSaveEdit} disabled={isSavingEdit} className="flex-1 px-4 py-2.5 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 disabled:opacity-50 transition-colors">
                  {isSavingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Remove Friend Modal */}
      <AnimatePresence>
        {confirmRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl bg-[#0B0A1A] border border-white/10 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-2">Remove Friend</h3>
              <p className="text-sm text-gray-400 mb-4">
                Are you sure you want to remove <span className="text-white font-semibold">{confirmRemove.username}</span> from your friends? This action removes the friendship for both of you.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmRemove(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={() => handleRemoveFriend(confirmRemove.uid)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </>
  );
}

// ── Schedule Matcher Calendar Component ──────────────────────────────────

const TASK_BAR_COLORS = [
  { bg: 'bg-purple-500/90', border: 'border-purple-400/60', shadow: 'shadow-purple-500/30' },
  { bg: 'bg-emerald-500/90', border: 'border-emerald-400/60', shadow: 'shadow-emerald-500/30' },
  { bg: 'bg-blue-500/90', border: 'border-blue-400/60', shadow: 'shadow-blue-500/30' },
  { bg: 'bg-rose-500/90', border: 'border-rose-400/60', shadow: 'shadow-rose-500/30' },
  { bg: 'bg-amber-500/90', border: 'border-amber-400/60', shadow: 'shadow-amber-500/30' },
  { bg: 'bg-cyan-500/90', border: 'border-cyan-400/60', shadow: 'shadow-cyan-500/30' },
];

function ScheduleMatcherCalendar({
  selectedProject,
  scheduleTasks,
  setScheduleTasks,
  user,
}: {
  selectedProject: GroupProject | null;
  scheduleTasks: ScheduleTask[];
  setScheduleTasks: React.Dispatch<React.SetStateAction<ScheduleTask[]>>;
  user: any;
}) {
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  // Fill grid: leading blanks + days
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Trailing blanks to fill last row
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Helper to get YYYY-MM-DD for a day number
  function toDateStr(day: number) {
    return `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // For each week, find tasks that overlap
  function getWeekTasks(week: (number | null)[]) {
    const validDays = week.filter((d): d is number => d !== null);
    if (validDays.length === 0) return [];
    const weekStart = toDateStr(validDays[0]);
    const weekEnd = toDateStr(validDays[validDays.length - 1]);

    return scheduleTasks.filter(t => t.startDate <= weekEnd && t.endDate >= weekStart);
  }

  // Map a date to its column index within the week
  function getColForDate(dateStr: string, week: (number | null)[]) {
    const day = parseInt(dateStr.split('-')[2], 10);
    const month = parseInt(dateStr.split('-')[1], 10) - 1;
    const year = parseInt(dateStr.split('-')[0], 10);

    if (year === calYear && month === calMonth) {
      const idx = week.indexOf(day);
      if (idx >= 0) return idx;
    }
    // Before this week
    if (dateStr < toDateStr(week.find(d => d !== null)!)) return 0;
    // After this week
    return 6;
  }

  return (
    <>
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="rounded-xl bg-[#121212] border border-white/10 overflow-hidden"
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">{monthNames[calMonth]} {calYear}</h2>
        </div>
        <div className="flex items-center gap-2">
          <HoverTip label="Add a task to the schedule">
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity mr-3"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </HoverTip>
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setCalMonth(today.getMonth()); setCalYear(today.getFullYear()); }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-colors border border-purple-500/30"
          >
            Today
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day-of-week Header */}
      <div className="grid grid-cols-7 border-b border-gray-800">
        {dayNames.map(d => (
          <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div>
        {weeks.map((week, wi) => {
          const weekTasks = getWeekTasks(week);

          return (
            <div key={wi} className="border-b border-gray-800 last:border-b-0">
              {/* Day Numbers Row */}
              <div className="grid grid-cols-7">
                {week.map((day, di) => {
                  const dateStr = day ? toDateStr(day) : '';
                  const isToday = dateStr === todayStr;

                  return (
                    <div
                      key={di}
                      className={`min-h-[40px] px-2 py-1.5 border-r border-gray-800 last:border-r-0 ${day === null ? 'bg-[#0a0a0a]' : ''}`}
                    >
                      {day !== null && (
                        <div className="flex justify-start">
                          {isToday ? (
                            <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">
                              {day}
                            </div>
                          ) : (
                            <span className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">
                              {day}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Task Bars */}
              {weekTasks.length > 0 && (
                <div className="px-0.5 pb-2 space-y-1">
                  {weekTasks.map((task) => {
                    const colorIdx = scheduleTasks.indexOf(task) % TASK_BAR_COLORS.length;
                    const color = TASK_BAR_COLORS[colorIdx];

                    // Calculate start/end columns
                    const startCol = getColForDate(task.startDate, week);
                    const endCol = getColForDate(task.endDate, week);
                    const span = endCol - startCol + 1;

                    // Calculate percentage-based positioning
                    const leftPct = (startCol / 7) * 100;
                    const widthPct = (span / 7) * 100;

                    const priorityBadge = task.priority === 'High' ? '🔴' : task.priority === 'Medium' ? '🟡' : task.priority === 'Low' ? '🟢' : '';

                    return (
                      <div
                        key={task.id}
                        className="relative h-8"
                      >
                        <div
                          className={`absolute top-0 h-full ${color.bg} border ${color.border} rounded-lg flex items-center gap-1.5 px-2.5 overflow-hidden cursor-default shadow-md ${color.shadow} hover:brightness-110 transition-all`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                          title={`${task.name}\n${task.startDate} → ${task.endDate}${task.priority !== 'None' ? `\nPriority: ${task.priority}` : ''}${task.estimatedTime ? `\nEst: ${task.estimatedTime}` : ''}`}
                        >
                          {priorityBadge && <span className="text-[10px] shrink-0">{priorityBadge}</span>}
                          <span className="text-[13px] font-medium text-white truncate drop-shadow-sm">{task.name}</span>
                          {task.estimatedTime && (
                            <span className="text-[10px] text-white/70 shrink-0 ml-auto">{task.estimatedTime}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </motion.div>

      {/* New Task Modal — rendered outside motion.div to fix centering */}
      <AnimatePresence>
        {showNewTaskModal && (
          <NewScheduleTaskModal
            onClose={() => setShowNewTaskModal(false)}
            selectedProject={selectedProject}
            user={user}
            onCreated={(task) => {
              setScheduleTasks(prev => [...prev, task]);
              setShowNewTaskModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── New Schedule Task Modal ──────────────────────────────────────────────

function NewScheduleTaskModal({
  onClose,
  selectedProject,
  user,
  onCreated,
}: {
  onClose: () => void;
  selectedProject: GroupProject | null;
  user: any;
  onCreated: (task: ScheduleTask) => void;
}) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('None');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !startDate || !endDate || !user || !selectedProject) return;
    if (endDate < startDate) {
      toast.error('End date cannot be before start date');
      return;
    }
    setIsCreating(true);
    try {
      const task = await createGroupScheduleTask(selectedProject.id, user.id, {
        name: name.trim(),
        priority,
        startDate,
        endDate,
        estimatedTime: estimatedTime.trim() || undefined,
      });
      onCreated(task);
      toast.success('Task created!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create task');
    } finally {
      setIsCreating(false);
    }
  }

  const inputCls = 'w-full bg-[#2a2a2a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors';
  const labelCls = 'text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block';

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg"
      >
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-base font-bold text-white">New Task</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-5 space-y-4">
            {/* NAME */}
            <div>
              <label className={labelCls}>Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Task name..."
                className={inputCls}
                autoFocus
              />
            </div>

            {/* PRIORITY */}
            <div>
              <label className={labelCls}>Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className={inputCls + ' appearance-none cursor-pointer'}
              >
                <option value="None">None</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* START DATE & END DATE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className={inputCls + ' cursor-pointer'}
                />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className={inputCls + ' cursor-pointer'}
                />
              </div>
            </div>

            {/* ESTIMATED TIME */}
            <div>
              <label className={labelCls}>Estimated Time</label>
              <input
                value={estimatedTime}
                onChange={e => setEstimatedTime(e.target.value)}
                placeholder="e.g. 2 hours"
                className={inputCls}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isCreating || !name.trim() || !startDate || !endDate}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>
      </motion.div>
    </>,
    document.body
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
    case 'file': return File;
    case 'key': return Key;
    default: return Link;
  }
}

function ResourceVault({ selectedProject, members }: { selectedProject: GroupProject | null, members: GroupMember[] }) {
  const { user } = useAuth();
  const [resources, setResources] = useState<VaultResource[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProject) {
      setResources([]);
      return;
    }

    async function load() {
      if (!selectedProject) return;
      try {
        const [links, files] = await Promise.all([
          getGroupLinks(selectedProject.id),
          getGroupFiles(selectedProject.id)
        ]);

        const mappedLinks: VaultResource[] = links.map(l => ({
          id: `l_${l.id}`,
          title: l.title,
          url: l.url,
          category: 'links',
          addedBy: l.added_by,
          icon: 'link'
        }));

        const mappedFiles: VaultResource[] = files.map(f => {
          const t = f.file_type || '';
          let icon: VaultResource['icon'] = 'file';
          if (t.includes('pdf')) icon = 'pdf';
          else if (t.includes('word')) icon = 'doc';

          return {
            id: `f_${f.id}`,
            title: f.file_name,
            url: f.file_url,
            category: 'files',
            addedBy: f.uploaded_by,
            icon
          };
        });

        setResources([...mappedLinks, ...mappedFiles].sort((a, b) => a.title.localeCompare(b.title)));
      } catch (e: any) {
        console.error('Failed to load resources:', e);
      }
    }

    load();
  }, [selectedProject]);

  // Add resource form state
  const [formType, setFormType] = useState<'link' | 'file'>('link');
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function copyToClipboard(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleAddResource() {
    if (!user || !selectedProject) return;

    setIsUploading(true);
    try {
      if (formType === 'link') {
        const title = formTitle.trim();
        const url = formUrl.trim();
        if (!title || !url) throw new Error('Title and URL required');
        const l = await addGroupLink(selectedProject.id, user.id, url, title);
        setResources(prev => [...prev, {
          id: `l_${l.id}`,
          title: l.title,
          url: l.url,
          category: 'links',
          addedBy: l.added_by,
          icon: 'link'
        }]);
      } else {
        if (!formFile) throw new Error('File required');
        const f = await uploadGroupFile(selectedProject.id, user.id, formFile);
        let icon: VaultResource['icon'] = 'file';
        if (f.file_type?.includes('pdf')) icon = 'pdf';
        else if (f.file_type?.includes('word')) icon = 'doc';

        setResources(prev => [...prev, {
          id: `f_${f.id}`,
          title: f.file_name,
          url: f.file_url,
          category: 'files',
          addedBy: f.uploaded_by,
          icon
        }]);
      }

      toast.success(formType === 'link' ? 'Link added!' : 'File uploaded!');
      setFormTitle('');
      setFormUrl('');
      setFormFile(null);
      setShowAddModal(false);
    } catch (e: any) {
      toast.error(e.message || 'Error adding resource');
    } finally {
      setIsUploading(false);
    }
  }

  const categories: ResourceCategory[] = ['files', 'links'];

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <AnimatePresence>
                    {catResources.map(resource => {
                      const IconComp = getResourceIcon(resource.icon);
                      const member = members.find(m => m.userId === resource.addedBy) || { userId: resource.addedBy, name: 'Unknown User', initials: '?', color: 'bg-gray-500', isOnline: false, role: 'member' as const };
                      const isCopied = copiedId === resource.id;

                      return (
                        <motion.div
                          key={resource.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
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
                                <p className="text-[10px] text-gray-500 mt-0.5 truncate">{resource.url}</p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <MemberAvatar member={member} size="sm" />
                                  <span className="text-[10px] text-gray-600">Added by {member.name}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
                              <HoverTip label={resource.category === 'files' ? "Download file" : "Open in new tab"}>
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
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
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
                  {/* Type Toggle */}
                  <div className="flex bg-[#18162e] rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() => setFormType('link')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-colors ${formType === 'link' ? 'bg-purple-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Link className="w-3.5 h-3.5" /> Add Link
                    </button>
                    <button
                      onClick={() => setFormType('file')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-colors ${formType === 'file' ? 'bg-purple-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                      <File className="w-3.5 h-3.5" /> Upload File
                    </button>
                  </div>

                  {formType === 'link' ? (
                    <>
                      {/* Link Title */}
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Title</label>
                        <input
                          value={formTitle}
                          onChange={e => setFormTitle(e.target.value)}
                          placeholder="e.g. Project Specs"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors"
                          autoFocus
                        />
                      </div>

                      {/* URL */}
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">URL</label>
                        <input
                          value={formUrl}
                          onChange={e => setFormUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 transition-colors"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* File Upload */}
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Select File (PDF, DOC/X, PPT/X)</label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          onChange={e => setFormFile(e.target.files?.[0] || null)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-purple-500/50 transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                        />
                      </div>
                    </>
                  )}



                  {/* Added by tag */}
                  <div className="flex items-center gap-2 pt-1">
                    <MemberAvatar member={{ userId: 'me', name: 'You', initials: 'YO', color: 'bg-purple-500', isOnline: true, role: 'admin' }} size="sm" />
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
                    disabled={isUploading || (formType === 'link' ? (!formTitle.trim() || !formUrl.trim()) : !formFile)}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Add Resource'}
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
