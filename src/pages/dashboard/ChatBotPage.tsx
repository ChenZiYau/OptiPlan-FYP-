import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, DollarSign, CalendarDays, BookOpen, CheckSquare,
  Sparkles, Check, X, Loader2, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { uuid } from '@/lib/utils';
import { useFinance } from '@/contexts/FinanceContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, type ExpenseCategory } from '@/hooks/useFinanceData';
import { useChatHistory, type HistoryMessage } from '@/hooks/useChatHistory';
import type { ScheduleEntry, StudyPayload, Importance } from '@/types/dashboard';

// ── Types ────────────────────────────────────────────────────────────────────

type ComponentType = 'text' | 'main-menu' | 'sub-menu' | 'confirmation-card' | 'input-prompt';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  componentType: ComponentType;
  options?: MenuOption[];
  draftPayload?: DraftPayload;
  inputField?: InputField;
}

interface MenuOption {
  label: string;
  icon?: React.ReactNode;
  value: string;
  description?: string;
}

interface InputField {
  placeholder: string;
  type: 'text' | 'number' | 'date' | 'time';
  field: string;
}

type DraftPayload =
  | { type: 'expense'; title?: string; amount?: number; category?: ExpenseCategory; date?: string; description?: string }
  | { type: 'schedule'; subjectName?: string; startTime?: string; durationHours?: number; days?: number[]; color?: string }
  | { type: 'study'; title?: string; subject?: string; date?: string; importance?: Importance }
  | { type: 'task'; title?: string; date?: string; importance?: Importance; description?: string };

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SCHEDULE_COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];

const IMPORTANCE_OPTIONS: MenuOption[] = [
  { label: 'Low', value: '1', description: 'Not urgent' },
  { label: 'Medium', value: '2', description: 'Normal priority' },
  { label: 'High', value: '3', description: 'Urgent / important' },
];

const DAY_OPTIONS: MenuOption[] = DAY_NAMES.map((d, i) => ({ label: d, value: String(i) }));

const DURATION_OPTIONS: MenuOption[] = [
  { label: '30 min', value: '0.5' },
  { label: '1 hour', value: '1' },
  { label: '1.5 hours', value: '1.5' },
  { label: '2 hours', value: '2' },
  { label: '3 hours', value: '3' },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function uid(): string {
  return uuid();
}

function pickColor(schedules: ScheduleEntry[]): string {
  const used = new Set(schedules.map((s) => s.color));
  return SCHEDULE_COLORS.find((c) => !used.has(c)) ?? SCHEDULE_COLORS[Math.floor(Math.random() * SCHEDULE_COLORS.length)];
}

// ── Component ────────────────────────────────────────────────────────────────

export function ChatBotPage() {
  const { addTransaction, refresh } = useFinance();
  const { addItem, addSchedule, schedules } = useDashboard();
  const { history, loading: historyLoading, loadHistory, saveMessage, clearHistory } = useChatHistory();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [pendingField, setPendingField] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, processing, historyLoaded]);

  // Load history on mount
  useEffect(() => {
    loadHistory().then(() => setHistoryLoaded(true));
  }, [loadHistory]);

  // Show welcome after history loads
  useEffect(() => {
    if (!historyLoaded) return;
    const timer = setTimeout(() => {
      push('bot', "Hey! I'm your **OptiPlan AI Wizard**. What would you like to do?", 'main-menu', {
        options: MAIN_MENU,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [historyLoaded]);

  // ── Helpers ──

  const push = useCallback((
    sender: 'bot' | 'user',
    text: string,
    componentType: ComponentType = 'text',
    extra: Partial<ChatMessage> = {},
  ) => {
    setMessages((prev) => [...prev, { id: uid(), sender, text, componentType, ...extra }]);
    if (text) saveMessage(sender, text, componentType);
  }, [saveMessage]);

  const pushBot = useCallback((text: string, componentType: ComponentType = 'text', extra: Partial<ChatMessage> = {}) => {
    push('bot', text, componentType, extra);
  }, [push]);

  const pushUser = useCallback((text: string) => {
    push('user', text, 'text');
  }, [push]);

  async function handleClearHistory() {
    await clearHistory();
    toast.success('Chat history cleared');
  }

  // ── Main Menu ──

  const MAIN_MENU: MenuOption[] = [
    { label: 'Add Expense', icon: <DollarSign className="w-4 h-4" />, value: 'expense', description: 'Track a new expense' },
    { label: 'Schedule Class', icon: <CalendarDays className="w-4 h-4" />, value: 'schedule', description: 'Add to your timetable' },
    { label: 'Create Task', icon: <CheckSquare className="w-4 h-4" />, value: 'task', description: 'Add a to-do item' },
    { label: 'Study Task', icon: <BookOpen className="w-4 h-4" />, value: 'study', description: 'Homework or revision' },
  ];

  // ── Flow Handlers ──

  function handleMainMenu(value: string) {
    switch (value) {
      case 'expense': return startExpenseFlow();
      case 'schedule': return startScheduleFlow();
      case 'task': return startTaskFlow();
      case 'study': return startStudyFlow();
    }
  }

  // ── Expense Flow ──

  function startExpenseFlow() {
    pushUser('Add Expense');
    setDraft({ type: 'expense', date: todayISO() });
    setPendingField('title');
    setTimeout(() => {
      pushBot('What did you spend on? Give me a short name (e.g., "Burger", "Uber ride").', 'input-prompt', {
        inputField: { placeholder: 'e.g. Burger, Electric bill...', type: 'text', field: 'title' },
      });
    }, 300);
  }

  function handleExpenseInput(field: string, value: string) {
    const d = { ...(draft as Extract<DraftPayload, { type: 'expense' }>) };

    if (field === 'title') {
      d.title = value;
      d.description = value;
      setDraft(d);
      pushUser(value);
      // Ask category
      setTimeout(() => {
        pushBot('Which category?', 'sub-menu', {
          options: EXPENSE_CATEGORIES.map((c) => ({
            label: c,
            value: c,
            icon: <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} />,
          })),
        });
        setPendingField('category');
      }, 300);
    } else if (field === 'category') {
      d.category = value as ExpenseCategory;
      setDraft(d);
      pushUser(value);
      setTimeout(() => {
        pushBot('How much did it cost?', 'input-prompt', {
          inputField: { placeholder: 'e.g. 15.50', type: 'number', field: 'amount' },
        });
        setPendingField('amount');
      }, 300);
    } else if (field === 'amount') {
      const amount = parseFloat(value);
      if (!amount || amount <= 0) {
        pushBot("That doesn't look right. Enter a number like **15** or **15.50**.");
        return;
      }
      d.amount = amount;
      setDraft(d);
      pushUser(`$${amount.toFixed(2)}`);
      // Show confirmation
      setTimeout(() => {
        pushBot('Here\'s what I\'ll add:', 'confirmation-card', { draftPayload: d });
        setPendingField('confirm');
      }, 300);
    }
  }

  // ── Schedule Flow ──

  function startScheduleFlow() {
    pushUser('Schedule Class');
    setDraft({ type: 'schedule', color: pickColor(schedules) });
    setPendingField('subjectName');
    setTimeout(() => {
      pushBot("What's the subject/class name?", 'input-prompt', {
        inputField: { placeholder: 'e.g. Calculus, Moral Education...', type: 'text', field: 'subjectName' },
      });
    }, 300);
  }

  function handleScheduleInput(field: string, value: string) {
    const d = { ...(draft as Extract<DraftPayload, { type: 'schedule' }>) };

    if (field === 'subjectName') {
      d.subjectName = value;
      setDraft(d);
      pushUser(value);
      setTimeout(() => {
        pushBot('Which days does this class occur?', 'sub-menu', { options: DAY_OPTIONS });
        setPendingField('days');
      }, 300);
    } else if (field === 'days') {
      const dayNums = value.split(',').map(Number);
      d.days = dayNums;
      setDraft(d);
      pushUser(dayNums.map((n) => DAY_NAMES[n]).join(', '));
      setTimeout(() => {
        pushBot('What time does it start?', 'input-prompt', {
          inputField: { placeholder: 'e.g. 09:00, 14:30...', type: 'time', field: 'startTime' },
        });
        setPendingField('startTime');
      }, 300);
    } else if (field === 'startTime') {
      d.startTime = value;
      setDraft(d);
      pushUser(value);
      setTimeout(() => {
        pushBot('How long is the class?', 'sub-menu', { options: DURATION_OPTIONS });
        setPendingField('durationHours');
      }, 300);
    } else if (field === 'durationHours') {
      d.durationHours = parseFloat(value);
      setDraft(d);
      pushUser(DURATION_OPTIONS.find((o) => o.value === value)?.label ?? value);
      setTimeout(() => {
        pushBot("Here's the schedule I'll add:", 'confirmation-card', { draftPayload: d });
        setPendingField('confirm');
      }, 300);
    }
  }

  // ── Task Flow ──

  function startTaskFlow() {
    pushUser('Create Task');
    setDraft({ type: 'task', date: todayISO() });
    setPendingField('title');
    setTimeout(() => {
      pushBot("What's the task?", 'input-prompt', {
        inputField: { placeholder: 'e.g. Buy groceries, Fix bug...', type: 'text', field: 'title' },
      });
    }, 300);
  }

  function handleTaskInput(field: string, value: string) {
    const d = { ...(draft as Extract<DraftPayload, { type: 'task' }>) };

    if (field === 'title') {
      d.title = value;
      d.description = value;
      setDraft(d);
      pushUser(value);
      setTimeout(() => {
        pushBot('When is it due?', 'input-prompt', {
          inputField: { placeholder: 'YYYY-MM-DD', type: 'date', field: 'date' },
        });
        setPendingField('date');
      }, 300);
    } else if (field === 'date') {
      d.date = value;
      setDraft(d);
      pushUser(value);
      setTimeout(() => {
        pushBot('How important is this?', 'sub-menu', { options: IMPORTANCE_OPTIONS });
        setPendingField('importance');
      }, 300);
    } else if (field === 'importance') {
      d.importance = Number(value) as Importance;
      setDraft(d);
      pushUser(IMPORTANCE_OPTIONS.find((o) => o.value === value)?.label ?? value);
      setTimeout(() => {
        pushBot("Here's the task:", 'confirmation-card', { draftPayload: d });
        setPendingField('confirm');
      }, 300);
    }
  }

  // ── Study Flow ──

  function startStudyFlow() {
    pushUser('Study Task');
    setDraft({ type: 'study', date: todayISO() });
    setPendingField('title');
    setTimeout(() => {
      pushBot("What's the assignment/task title?", 'input-prompt', {
        inputField: { placeholder: 'e.g. Chapter 5 revision...', type: 'text', field: 'title' },
      });
    }, 300);
  }

  function handleStudyInput(field: string, value: string) {
    const d = { ...(draft as Extract<DraftPayload, { type: 'study' }>) };

    if (field === 'title') {
      d.title = value;
      setDraft(d);
      pushUser(value);
      const registeredSubjects = [...new Set(schedules.map((s) => s.subjectName))];
      const subjectOptions: MenuOption[] = registeredSubjects.length > 0
        ? registeredSubjects.map((s) => ({ label: s, value: s }))
        : [{ label: 'General', value: 'General', description: 'No subjects registered yet' }];
      setTimeout(() => {
        pushBot('Which subject is this for?', 'sub-menu', { options: subjectOptions });
        setPendingField('subject');
      }, 300);
    } else if (field === 'subject') {
      d.subject = value;
      setDraft(d);
      pushUser(value);
      setTimeout(() => {
        pushBot('When is it due?', 'input-prompt', {
          inputField: { placeholder: 'YYYY-MM-DD', type: 'date', field: 'date' },
        });
        setPendingField('date');
      }, 300);
    } else if (field === 'date') {
      d.date = value;
      setDraft(d);
      pushUser(value);
      setTimeout(() => {
        pushBot('How important is this?', 'sub-menu', { options: IMPORTANCE_OPTIONS });
        setPendingField('importance');
      }, 300);
    } else if (field === 'importance') {
      d.importance = Number(value) as Importance;
      setDraft(d);
      pushUser(IMPORTANCE_OPTIONS.find((o) => o.value === value)?.label ?? value);
      setTimeout(() => {
        pushBot("Here's the study task:", 'confirmation-card', { draftPayload: d });
        setPendingField('confirm');
      }, 300);
    }
  }

  // ── Dispatch input to current flow ──

  function handleFieldInput(value: string) {
    if (!draft || !pendingField) return;
    switch (draft.type) {
      case 'expense': return handleExpenseInput(pendingField, value);
      case 'schedule': return handleScheduleInput(pendingField, value);
      case 'task': return handleTaskInput(pendingField, value);
      case 'study': return handleStudyInput(pendingField, value);
    }
  }

  // ── Confirm / Cancel ──

  async function handleConfirm() {
    if (!draft) return;
    setProcessing(true);
    pushUser('Confirm');

    try {
      if (draft.type === 'expense' && draft.amount && draft.category) {
        await addTransaction({
          type: 'expense',
          amount: draft.amount,
          category: draft.category,
          transaction_date: draft.date ?? todayISO(),
          description: draft.title ?? draft.description ?? 'Expense',
          is_recurring: false,
        });
        await refresh();
        toast.success(`Expense added: $${draft.amount.toFixed(2)}`);
        pushBot(`Done! **$${draft.amount.toFixed(2)}** added to **${draft.category}**.`);
      } else if (draft.type === 'schedule' && draft.subjectName && draft.startTime && draft.days?.length) {
        const dur = draft.durationHours ?? 1;
        const [h, m] = draft.startTime.split(':').map(Number);
        const totalMin = h * 60 + m + dur * 60;
        const endH = Math.min(Math.floor(totalMin / 60), 23);
        const endM = totalMin % 60;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        await addSchedule({
          id: uid(),
          subjectName: draft.subjectName,
          startTime: draft.startTime,
          endTime,
          days: draft.days,
          color: draft.color ?? pickColor(schedules),
        });
        toast.success(`Schedule added: ${draft.subjectName}`);
        pushBot(`Done! **${draft.subjectName}** added to your timetable.`);
      } else if (draft.type === 'task' && draft.title) {
        await addItem({
          id: uid(),
          type: 'task',
          title: draft.title,
          description: draft.description ?? draft.title,
          date: draft.date ?? todayISO(),
          importance: draft.importance ?? 2,
          color: '#a855f7',
        });
        toast.success(`Task created: ${draft.title}`);
        pushBot(`Done! Task **${draft.title}** created.`);
      } else if (draft.type === 'study' && draft.title && draft.subject) {
        const payload: StudyPayload = {
          id: uid(),
          type: 'study',
          title: draft.title,
          description: draft.title,
          date: draft.date ?? todayISO(),
          importance: draft.importance ?? 2,
          color: '#6366f1',
          startTime: '09:00',
          endTime: '10:00',
          subject: draft.subject,
        };
        await addItem(payload);
        toast.success(`Study task created: ${draft.title}`);
        pushBot(`Done! Study task **${draft.title}** for **${draft.subject}** created.`);
      }
    } catch {
      pushBot("Something went wrong. Please try again.");
      toast.error('Failed to save');
    }

    setDraft(null);
    setPendingField(null);
    setProcessing(false);

    // Show main menu again after a moment
    setTimeout(() => {
      pushBot('What else would you like to do?', 'main-menu', { options: MAIN_MENU });
    }, 800);
  }

  function handleCancel() {
    pushUser('Cancel');
    setDraft(null);
    setPendingField(null);
    pushBot('No problem! What would you like to do instead?', 'main-menu', { options: MAIN_MENU });
  }

  // ── Text input submit ──

  function handleTextSubmit() {
    const val = inputValue.trim();
    if (!val || processing) return;
    setInputValue('');
    handleFieldInput(val);
  }

  // ── Sub-menu / option click ──

  function handleOptionClick(value: string) {
    if (!pendingField) return;
    handleFieldInput(value);
  }

  // ── Multi-select for days ──
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  function toggleDay(dayNum: number) {
    setSelectedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort(),
    );
  }

  function confirmDays() {
    if (selectedDays.length === 0) return;
    handleFieldInput(selectedDays.join(','));
    setSelectedDays([]);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-white">OptiPlan AI Wizard</h2>
          <p className="text-[11px] text-green-400">Online · Interactive mode</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-white/[0.04] border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 scroll-smooth">
        {/* Past history (read-only) */}
        {historyLoaded && history.length > 0 && (
          <>
            {history.map((h) => (
              <HistoryBubble key={h.id} msg={h} />
            ))}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Current session</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </>
        )}

        {historyLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>Loading history...</span>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {msg.sender === 'user' ? (
                <UserBubble text={msg.text ?? ''} />
              ) : (
                <BotMessage
                  msg={msg}
                  onOptionClick={handleOptionClick}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  onMainMenu={handleMainMenu}
                  pendingField={pendingField}
                  selectedDays={selectedDays}
                  toggleDay={toggleDay}
                  confirmDays={confirmDays}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {processing && (
          <div className="flex items-center gap-2 text-gray-500 text-sm pl-12">
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="pt-3 border-t border-white/10 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); handleTextSubmit(); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type={pendingField === 'amount' ? 'number' : pendingField === 'date' ? 'date' : pendingField === 'startTime' ? 'time' : 'text'}
            step={pendingField === 'amount' ? '0.01' : undefined}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              pendingField === 'confirm' ? 'Use the buttons above...'
              : pendingField ? 'Type your answer...'
              : 'Select an option above...'
            }
            disabled={processing || pendingField === 'confirm' || (!pendingField && !draft)}
            className="flex-1 px-4 py-3 text-sm bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || processing}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function HistoryBubble({ msg }: { msg: HistoryMessage }) {
  if (msg.sender === 'user') {
    return (
      <div className="flex justify-end opacity-60">
        <div className="max-w-[75%] rounded-2xl rounded-tr-md bg-purple-600/15 border border-purple-500/10 px-4 py-2.5">
          <p className="text-sm text-white/70">{msg.text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 opacity-60">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 text-purple-400/60" />
      </div>
      <div className="rounded-2xl rounded-tl-md bg-white/[0.03] border border-white/[0.04] px-4 py-3 max-w-[85%]">
        <RichText text={msg.text} />
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-2xl rounded-tr-md bg-purple-600/25 border border-purple-500/20 px-4 py-2.5">
        <p className="text-sm text-white">{text}</p>
      </div>
    </div>
  );
}

function BotMessage({
  msg,
  onOptionClick,
  onConfirm,
  onCancel,
  onMainMenu,
  pendingField,
  selectedDays,
  toggleDay,
  confirmDays,
}: {
  msg: ChatMessage;
  onOptionClick: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onMainMenu: (value: string) => void;
  pendingField: string | null;
  selectedDays: number[];
  toggleDay: (d: number) => void;
  confirmDays: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {/* Text */}
        {msg.text && (
          <div className="rounded-2xl rounded-tl-md bg-white/[0.05] border border-white/[0.06] px-4 py-3 max-w-[85%]">
            <RichText text={msg.text} />
          </div>
        )}

        {/* Main menu buttons */}
        {msg.componentType === 'main-menu' && msg.options && (
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            {msg.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onMainMenu(opt.value)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-purple-500/30 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/25 transition shrink-0">
                  {opt.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{opt.label}</p>
                  {opt.description && <p className="text-[10px] text-gray-500 truncate">{opt.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Sub-menu (category, importance, etc.) */}
        {msg.componentType === 'sub-menu' && msg.options && pendingField !== 'days' && (
          <div className="flex flex-wrap gap-1.5 max-w-sm">
            {msg.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onOptionClick(opt.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:bg-purple-500/15 hover:border-purple-500/30 hover:text-purple-300 transition-all text-xs text-gray-300"
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Day multi-select */}
        {msg.componentType === 'sub-menu' && pendingField === 'days' && msg.options && (
          <div className="space-y-2 max-w-sm">
            <div className="flex flex-wrap gap-1.5">
              {DAY_NAMES.map((d, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedDays.includes(i)
                      ? 'bg-purple-500/25 border-purple-500/50 text-purple-300'
                      : 'bg-white/[0.04] border-white/10 text-gray-400 hover:bg-white/[0.06]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            {selectedDays.length > 0 && (
              <button
                onClick={confirmDays}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium border border-purple-500/30 hover:bg-purple-500/30 transition"
              >
                <Check className="w-3 h-3" />
                Confirm: {selectedDays.map((n) => DAY_NAMES[n]).join(', ')}
              </button>
            )}
          </div>
        )}

        {/* Confirmation card */}
        {msg.componentType === 'confirmation-card' && msg.draftPayload && (
          <ConfirmationCard draft={msg.draftPayload} onConfirm={onConfirm} onCancel={onCancel} />
        )}
      </div>
    </div>
  );
}

// ── Confirmation Card ────────────────────────────────────────────────────────

function ConfirmationCard({ draft, onConfirm, onCancel }: { draft: DraftPayload; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="rounded-xl bg-[#131127] border border-white/10 p-4 max-w-xs shadow-xl">
      {/* Type badge */}
      <div className="flex items-center gap-1.5 mb-3">
        {draft.type === 'expense' && <DollarSign className="w-3.5 h-3.5 text-yellow-400" />}
        {draft.type === 'schedule' && <CalendarDays className="w-3.5 h-3.5 text-blue-400" />}
        {draft.type === 'task' && <CheckSquare className="w-3.5 h-3.5 text-green-400" />}
        {draft.type === 'study' && <BookOpen className="w-3.5 h-3.5 text-purple-400" />}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {draft.type === 'expense' ? 'New Expense' : draft.type === 'schedule' ? 'New Schedule' : draft.type === 'task' ? 'New Task' : 'Study Task'}
        </span>
      </div>

      {/* Fields */}
      <div className="space-y-2 mb-4">
        {draft.type === 'expense' && (
          <>
            <Field label="Title" value={draft.title} />
            <Field label="Category" value={draft.category} color={draft.category ? CATEGORY_COLORS[draft.category] : undefined} />
            <Field label="Amount" value={draft.amount ? `$${draft.amount.toFixed(2)}` : undefined} highlight />
            <Field label="Date" value={draft.date} />
          </>
        )}
        {draft.type === 'schedule' && (
          <>
            <Field label="Subject" value={draft.subjectName} />
            <Field label="Days" value={draft.days?.map((d) => DAY_NAMES[d]).join(', ')} />
            <Field label="Start Time" value={draft.startTime} />
            <Field label="Duration" value={draft.durationHours ? `${draft.durationHours}h` : undefined} />
          </>
        )}
        {draft.type === 'task' && (
          <>
            <Field label="Task" value={draft.title} />
            <Field label="Due Date" value={draft.date} />
            <Field label="Importance" value={draft.importance ? ['', 'Low', 'Medium', 'High'][draft.importance] : undefined} />
          </>
        )}
        {draft.type === 'study' && (
          <>
            <Field label="Title" value={draft.title} />
            <Field label="Subject" value={draft.subject} />
            <Field label="Due Date" value={draft.date} />
            <Field label="Importance" value={draft.importance ? ['', 'Low', 'Medium', 'High'][draft.importance] : undefined} />
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/15 text-green-400 text-xs font-semibold border border-green-500/25 hover:bg-green-500/25 transition"
        >
          <Check className="w-3.5 h-3.5" />
          Confirm
        </button>
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-gray-400 text-xs font-semibold border border-white/10 hover:bg-white/10 transition"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, highlight, color }: { label: string; value?: string; highlight?: boolean; color?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={`text-xs font-medium ${highlight ? 'text-green-400' : 'text-white'}`} style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}

// ── Rich Text (bold) ─────────────────────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return (
    <p className="text-sm text-gray-300 leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <span key={i} className="font-semibold text-white">{part.slice(2, -2)}</span>;
        }
        return part;
      })}
    </p>
  );
}
