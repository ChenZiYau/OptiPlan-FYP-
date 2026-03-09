import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, Check, DollarSign, CalendarDays, BookOpen, CheckSquare, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { uuid } from '@/lib/utils';
import { useFinance } from '@/contexts/FinanceContext';
import { useDashboard } from '@/contexts/DashboardContext';
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, type ExpenseCategory } from '@/hooks/useFinanceData';
import type { ScheduleEntry, StudyPayload, Importance } from '@/types/dashboard';

// ── Types ────────────────────────────────────────────────────────────────────

type ComponentType = 'text' | 'main-menu' | 'sub-menu' | 'confirmation-card' | 'input-prompt';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
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

const DURATION_OPTIONS: MenuOption[] = [
  { label: '30m', value: '0.5' },
  { label: '1h', value: '1' },
  { label: '1.5h', value: '1.5' },
  { label: '2h', value: '2' },
  { label: '3h', value: '3' },
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

// ── NLP helpers (kept for free-text fallback) ────────────────────────────────

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  Food: ['food', 'burger', 'pizza', 'lunch', 'dinner', 'breakfast', 'coffee', 'tea', 'snack', 'meal', 'eat', 'ate', 'restaurant', 'cafe', 'drink', 'sushi', 'rice', 'chicken', 'noodle', 'bread', 'grocery', 'groceries', 'takeout', 'takeaway', 'mcdonald', 'starbucks', 'kfc'],
  Transport: ['transport', 'uber', 'lyft', 'taxi', 'cab', 'bus', 'train', 'subway', 'metro', 'gas', 'fuel', 'petrol', 'parking', 'toll', 'flight', 'airline', 'grab', 'ride'],
  Shopping: ['shopping', 'shoes', 'clothes', 'shirt', 'pants', 'dress', 'jacket', 'amazon', 'store', 'mall', 'buy', 'bought', 'purchase', 'order', 'ordered'],
  Entertainment: ['entertainment', 'movie', 'cinema', 'netflix', 'spotify', 'game', 'gaming', 'concert', 'show', 'ticket', 'subscription', 'youtube', 'disney'],
  Education: ['education', 'book', 'course', 'tuition', 'school', 'university', 'udemy', 'textbook'],
  Health: ['health', 'doctor', 'hospital', 'medicine', 'pharmacy', 'gym', 'fitness', 'dental', 'dentist', 'vitamin', 'supplement', 'therapy', 'clinic'],
  Bills: ['bill', 'bills', 'rent', 'electricity', 'water', 'internet', 'wifi', 'phone', 'insurance', 'utility', 'utilities', 'mortgage', 'payment'],
  Other: ['other'],
};

function inferCategory(text: string): ExpenseCategory {
  const lower = text.toLowerCase();
  let best: ExpenseCategory = 'Other';
  let bestScore = 0;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS) as [ExpenseCategory, string[]][]) {
    if (cat === 'Other') continue;
    let s = 0;
    for (const kw of kws) if (lower.includes(kw)) s++;
    if (s > bestScore) { bestScore = s; best = cat; }
  }
  return best;
}

function inferDate(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('yesterday')) { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }
  if (lower.includes('tomorrow')) { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }
  return todayISO();
}

function extractAmount(text: string): number | null {
  const patterns = [
    /\$\s?([\d,]+(?:\.\d{1,2})?)/,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:dollars?|bucks?|usd)/i,
    /(?:rm|myr)\s?([\d,]+(?:\.\d{1,2})?)/i,
    /(?:spent|paid|cost|bought|pay)\s+(?:\$|rm|myr)?\s?([\d,]+(?:\.\d{1,2})?)/i,
    /(?:spent|paid|cost|bought|pay)\s+.*?([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:for|on)\s+/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { const v = parseFloat(m[1].replace(/,/g, '')); if (v > 0 && v < 1_000_000) return v; }
  }
  return null;
}

function extractTitle(text: string): string {
  let desc = text
    .replace(/^(i\s+)?(just\s+)?(spent|paid|bought|got|had|ordered|grabbed)\s+/i, '')
    .replace(/\$[\d,.]+\s*/g, '')
    .replace(/rm\s?[\d,.]+\s*/gi, '')
    .replace(/[\d,.]+\s*(dollars?|bucks?|usd)\s*/gi, '')
    .replace(/\b(on|for|at)\s+/i, '')
    .replace(/\byesterday\b/gi, '').replace(/\btoday\b/gi, '').replace(/\btomorrow\b/gi, '')
    .replace(/\b(can you|help me|place it|put it|in my|finance tracker|tracker)\b/gi, '')
    .replace(/\s{2,}/g, ' ').trim();
  const words = desc.split(/\s+/).filter((w) => w.length > 0);
  const t = words.slice(0, 3).join(' ');
  return t.length > 0 ? t[0].toUpperCase() + t.slice(1) : 'Expense';
}

// Schedule NLP
const SCHEDULE_VERBS = /\b(class|lecture|lesson|tutorial|lab|seminar|meeting|session)\b/i;
const SCHEDULE_PHRASES = /\b(put .*(in|into) .*(schedul|timetable)|add .*(to|into) .*(schedul|timetable)|scheduling tab)\b/i;
function detectsScheduleIntent(text: string): boolean { return SCHEDULE_VERBS.test(text) || SCHEDULE_PHRASES.test(text); }

function extractTime(text: string): string | null {
  const m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const mer = m[3]?.toLowerCase();
  if (mer === 'pm' && h < 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function extractDurationHours(text: string): number | null {
  const m = text.match(/(?:for|about|around)\s+(?:a\s+)?(?:whole|full|entire|solid|good)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  if (m) { const v = parseFloat(m[1]); if (v > 0 && v <= 12) return v; }
  return null;
}

function extractSubjectName(text: string): string | null {
  const cleaned = text.replace(/(?:for|about|around)\s+(?:a\s+)?(?:whole|full|entire|solid|good)?\s*\d+(?:\.\d+)?\s*(?:hours?|hrs?|h|minutes?|mins?|m)\b/gi, '');
  const calledMatch = cleaned.match(/(?:called|named)\s+([A-Za-z][A-Za-z\s]{0,30})/i);
  if (calledMatch) return calledMatch[1].trim();
  const myMatch = cleaned.match(/\bmy\s+([A-Za-z][A-Za-z\s]{0,30}?)\s+(?:class|lecture|lesson|tutorial|lab|seminar|meeting|session)\b/i);
  if (myMatch) return myMatch[1].trim();
  const beforeMatch = cleaned.match(/\b([A-Za-z][A-Za-z\s]{0,30}?)\s+(?:class|lecture|lesson|tutorial|lab|seminar|meeting|session)\b/i);
  if (beforeMatch) {
    const c = beforeMatch[1].trim();
    if (!/^(a|an|the|i|my|have|has|had|this|that|next|every|each)$/i.test(c)) return c;
  }
  const forMatch = cleaned.match(/\bfor\s+([A-Za-z][A-Za-z\s]{1,30}?)\s*$/i);
  if (forMatch) {
    const c = forMatch[1].trim();
    if (!/^(a|an|the|it|that|this|me|you|tomorrow|today|yesterday)$/i.test(c)) return c;
  }
  return null;
}

const DAY_MAP: Record<string, number> = { sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2, wednesday: 3, wed: 3, thursday: 4, thu: 4, thurs: 4, friday: 5, fri: 5, saturday: 6, sat: 6 };
function extractDays(text: string): number[] | null {
  const lower = text.toLowerCase();
  const found: number[] = [];
  for (const [name, num] of Object.entries(DAY_MAP)) if (lower.includes(name) && !found.includes(num)) found.push(num);
  return found.length > 0 ? found.sort() : null;
}

// Study NLP
const STUDY_VERBS = /\b(homework|assignment|revision|revise|study|review|practice|prepare|essay|report|project|quiz|exam|test)\b/i;
const STUDY_PHRASES = /\b(remind me to .*(do|finish|complete|submit|start|work)|add .*(study|homework|assignment)|create .*(study|task).*for)\b/i;
function detectsStudyIntent(text: string): boolean { return STUDY_VERBS.test(text) || STUDY_PHRASES.test(text); }

function extractStudyTitle(text: string): string | null {
  const doMatch = text.match(/(?:do|finish|complete|submit|start|work on)\s+(?:my\s+)?(.+?)(?:\s+(?:by|before|tomorrow|today|yesterday|on|due)|\s*$)/i);
  if (doMatch) { const t = doMatch[1].trim(); if (t.length > 2) return t[0].toUpperCase() + t.slice(1); }
  const taskMatch = text.match(/\b(homework|assignment|revision|essay|report|project|quiz)\s+(?:for|on|about)\s+(.+?)(?:\s+(?:by|before|tomorrow|today|on|due)|\s*$)/i);
  if (taskMatch) return `${taskMatch[1][0].toUpperCase()}${taskMatch[1].slice(1)} for ${taskMatch[2].trim()}`;
  return null;
}

function extractStudySubject(text: string, subjects: string[]): string | null {
  const lower = text.toLowerCase();
  for (const s of subjects) if (lower.includes(s.toLowerCase())) return s;
  const forMatch = text.match(/(?:for|in|on)\s+([A-Za-z][A-Za-z\s]{1,30}?)(?:\s+(?:class|by|before|tomorrow|today|due)|\s*$)/i);
  if (forMatch) return forMatch[1].trim();
  const myMatch = text.match(/\bmy\s+([A-Za-z][A-Za-z\s]{1,30}?)\s+(?:homework|assignment|revision|essay|report|project)/i);
  if (myMatch) return myMatch[1].trim();
  return null;
}

function extractImportance(text: string): Importance {
  const lower = text.toLowerCase();
  if (/\b(urgent|critical|important|high)\b/.test(lower)) return 3;
  if (/\b(medium|moderate|normal)\b/.test(lower)) return 2;
  if (/\b(low|minor|optional|whenever)\b/.test(lower)) return 1;
  return 2;
}

// Navigation
function detectNavigation(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\b(show|open|go to|take me to|view)\b.*\b(schedul|timetable|weekly)\b/.test(lower)) return '/dashboard/schedules';
  if (/\b(show|open|go to|take me to|view)\b.*\b(study|hub|study hub|materials|flashcard|notes)\b/.test(lower)) return '/dashboard/study-hub';
  if (/\b(show|open|go to|take me to|view)\b.*\b(financ|expense|budget|tracker|money)\b/.test(lower)) return '/dashboard/finance-tracker';
  if (/\b(show|open|go to|take me to|view)\b.*\b(task|todo)\b/.test(lower)) return '/dashboard/tasks';
  if (/\b(show|open|go to|take me to|view)\b.*\b(dashboard|overview|home)\b/.test(lower)) return '/dashboard';
  return null;
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard/schedules': 'Schedules', '/dashboard/study-hub': 'Study Hub',
  '/dashboard/finance-tracker': 'Finance Tracker', '/dashboard/tasks': 'Tasks', '/dashboard': 'Dashboard',
};

// Spending detection
const SPENDING_VERBS = /\b(spent|spend|paid|pay|bought|buy|cost|grabbed|got|ordered|ate|had)\b/i;
const SPENDING_PHRASES = /\b(can you .*(add|put|log|track|record)|add .*(to|into) .*tracker|put .*(into|in) .*tracker|log .*(expense|spending))\b/i;
function detectsSpendingIntent(text: string): boolean { return SPENDING_VERBS.test(text) || SPENDING_PHRASES.test(text); }

// ── NLP processor for free-text input ────────────────────────────────────────

interface NLPResult {
  type: 'expense' | 'schedule' | 'study' | 'navigate' | 'chat';
  message: string;
  draft?: DraftPayload;
  navPath?: string;
  complete?: boolean; // All required fields extracted — can auto-confirm
}

function processNLP(text: string, schedules: ScheduleEntry[]): NLPResult {
  // Navigation
  const navPath = detectNavigation(text);
  if (navPath) return { type: 'navigate', message: `Taking you to **${ROUTE_LABELS[navPath] ?? 'that page'}** now!`, navPath };

  // Schedule
  if (detectsScheduleIntent(text)) {
    const subjectName = extractSubjectName(text);
    const startTime = extractTime(text);
    const dur = extractDurationHours(text) ?? 1;
    const days = extractDays(text) ?? [new Date().getDay()];
    const color = pickColor(schedules);
    if (subjectName && startTime) {
      const [h, m] = startTime.split(':').map(Number);
      const totalMin = h * 60 + m + dur * 60;
      const endH = Math.min(Math.floor(totalMin / 60), 23);
      const endM = totalMin % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      const dayLabel = days.map((d) => DAY_NAMES[d]).join(', ');
      return {
        type: 'schedule', complete: true,
        draft: { type: 'schedule', subjectName, startTime, durationHours: dur, days, color },
        message: `I'll add **${subjectName}** on **${dayLabel}** at **${startTime}–${endTime}**:`,
      };
    }
    return {
      type: 'schedule', complete: false,
      draft: { type: 'schedule', subjectName: subjectName ?? undefined, startTime: startTime ?? undefined, durationHours: dur, days, color },
      message: subjectName
        ? `I'll schedule **${subjectName}**. What time does it start?`
        : "I can add that to your schedule! What's the subject name?",
    };
  }

  // Study
  if (detectsStudyIntent(text)) {
    const registeredSubjects = [...new Set(schedules.map((s) => s.subjectName))];
    const title = extractStudyTitle(text);
    const subject = extractStudySubject(text, registeredSubjects);
    const date = inferDate(text);
    const importance = extractImportance(text);
    if (title && subject) {
      return {
        type: 'study', complete: true,
        draft: { type: 'study', title, subject, date, importance },
        message: `I'll create this study task:`,
      };
    }
    return {
      type: 'study', complete: false,
      draft: { type: 'study', title: title ?? undefined, subject: subject ?? undefined, date, importance },
      message: !title ? "What's the title for the study task?" : `Which subject is **${title}** for?`,
    };
  }

  // Expense
  const amount = extractAmount(text);
  const category = inferCategory(text);
  const date = inferDate(text);
  const description = extractTitle(text);
  if (amount !== null) {
    return {
      type: 'expense', complete: true,
      draft: { type: 'expense', title: description, amount, category, date, description },
      message: `I'll add this expense:`,
    };
  }
  if (detectsSpendingIntent(text) || (category !== 'Other' && description !== 'Expense')) {
    return {
      type: 'expense', complete: false,
      draft: { type: 'expense', title: description !== 'Expense' ? description : undefined, category, date },
      message: `I can log that **${description !== 'Expense' ? description : category}** expense. How much did it cost?`,
    };
  }

  // General chat
  const lower = text.toLowerCase();
  if (/^(hi|hello|hey|sup|yo)\b/.test(lower)) {
    return { type: 'chat', message: "Hey there! I'm your **OptiPlan AI**. Use the buttons below or just type naturally — I can handle expenses, schedules, study tasks, and more!" };
  }
  if (lower.includes('help') || lower.includes('what can you do')) {
    return { type: 'chat', message: "I can help with:\n- **Expenses** — *\"$15 on lunch\"*\n- **Schedule classes** — *\"Calculus on Monday at 12:30\"*\n- **Study tasks** — *\"Math assignment due tomorrow\"*\n- **Navigate** — *\"Show my schedule\"*\n\nOr use the buttons below!" };
  }
  if (lower.includes('thank')) return { type: 'chat', message: "You're welcome! Let me know if you need anything else." };

  if (/\b(what|which|do i have|any)\b.*\b(class|classes|today|schedule)\b/i.test(lower)) {
    const dow = new Date().getDay();
    const today = schedules.filter((s) => s.days.includes(dow)).sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (today.length > 0) {
      const list = today.map((c) => `- **${c.subjectName}** at ${c.startTime}–${c.endTime}`).join('\n');
      return { type: 'chat', message: `Your classes today (${DAY_NAMES[dow]}):\n\n${list}` };
    }
    return { type: 'chat', message: `No classes scheduled for today (${DAY_NAMES[dow]}).` };
  }

  return { type: 'chat', message: "I'm not sure what you'd like to do. Try the buttons below, or type something like *\"$15 on lunch\"* or *\"Add my Calculus class on Monday at 2pm\"*." };
}

// ── Component ────────────────────────────────────────────────────────────────

const MAIN_MENU: MenuOption[] = [
  { label: 'Add Expense', icon: <DollarSign className="w-3.5 h-3.5" />, value: 'expense', description: 'Track spending' },
  { label: 'Schedule Class', icon: <CalendarDays className="w-3.5 h-3.5" />, value: 'schedule', description: 'Add to timetable' },
  { label: 'Create Task', icon: <CheckSquare className="w-3.5 h-3.5" />, value: 'task', description: 'Add a to-do' },
  { label: 'Study Task', icon: <BookOpen className="w-3.5 h-3.5" />, value: 'study', description: 'Homework / revision' },
];

export function FloatingAIAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState<DraftPayload | null>(null);
  const [pendingField, setPendingField] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTransaction, refresh } = useFinance();
  const { addItem, addSchedule, schedules } = useDashboard();
  const initializedRef = useRef(false);

  // Show welcome + main menu on first open
  useEffect(() => {
    if (open && !initializedRef.current) {
      initializedRef.current = true;
      setTimeout(() => {
        pushBot("Hi! I'm your **OptiPlan AI**. What would you like to do?", 'main-menu', { options: MAIN_MENU });
      }, 300);
    }
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, processing]);

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  // ── Helpers ──

  const pushBot = useCallback((text: string, componentType: ComponentType = 'text', extra: Partial<Message> = {}) => {
    setMessages((prev) => [...prev, { id: uid(), role: 'assistant', text, componentType, ...extra }]);
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role: 'user', text, componentType: 'text' }]);
  }, []);

  function showMainMenu(text = 'What else would you like to do?') {
    pushBot(text, 'main-menu', { options: MAIN_MENU });
  }

  // ── Main Menu ──

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
    setTimeout(() => pushBot('What did you spend on?', 'input-prompt', {
      inputField: { placeholder: 'e.g. Burger, Uber ride...', type: 'text', field: 'title' },
    }), 300);
  }

  function handleExpenseInput(field: string, value: string) {
    const d = { ...(draft as Extract<DraftPayload, { type: 'expense' }>) };
    if (field === 'title') {
      d.title = value; d.description = value; setDraft(d); pushUser(value);
      setTimeout(() => {
        pushBot('Which category?', 'sub-menu', {
          options: EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c, icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} /> })),
        });
        setPendingField('category');
      }, 300);
    } else if (field === 'category') {
      d.category = value as ExpenseCategory; setDraft(d); pushUser(value);
      setTimeout(() => {
        pushBot('How much?', 'input-prompt', { inputField: { placeholder: 'e.g. 15.50', type: 'number', field: 'amount' } });
        setPendingField('amount');
      }, 300);
    } else if (field === 'amount') {
      const amt = parseFloat(value);
      if (!amt || amt <= 0) { pushBot("Enter a valid number like **15** or **15.50**."); return; }
      d.amount = amt; setDraft(d); pushUser(`$${amt.toFixed(2)}`);
      setTimeout(() => {
        pushBot("Here's what I'll add:", 'confirmation-card', { draftPayload: d });
        setPendingField('confirm');
      }, 300);
    }
  }

  // ── Schedule Flow ──

  function startScheduleFlow() {
    pushUser('Schedule Class');
    setDraft({ type: 'schedule', color: pickColor(schedules) });
    setPendingField('subjectName');
    setTimeout(() => pushBot("What's the subject/class name?", 'input-prompt', {
      inputField: { placeholder: 'e.g. Calculus...', type: 'text', field: 'subjectName' },
    }), 300);
  }

  function handleScheduleInput(field: string, value: string) {
    const d = { ...(draft as Extract<DraftPayload, { type: 'schedule' }>) };
    if (field === 'subjectName') {
      d.subjectName = value; setDraft(d); pushUser(value);
      setTimeout(() => {
        pushBot('Which days?', 'sub-menu', { options: DAY_NAMES.map((dn, i) => ({ label: dn, value: String(i) })) });
        setPendingField('days');
      }, 300);
    } else if (field === 'days') {
      const dayNums = value.split(',').map(Number);
      d.days = dayNums; setDraft(d); pushUser(dayNums.map((n) => DAY_NAMES[n]).join(', '));
      setTimeout(() => {
        pushBot('Start time?', 'input-prompt', { inputField: { placeholder: 'e.g. 09:00', type: 'time', field: 'startTime' } });
        setPendingField('startTime');
      }, 300);
    } else if (field === 'startTime') {
      d.startTime = value; setDraft(d); pushUser(value);
      setTimeout(() => {
        pushBot('How long?', 'sub-menu', { options: DURATION_OPTIONS });
        setPendingField('durationHours');
      }, 300);
    } else if (field === 'durationHours') {
      d.durationHours = parseFloat(value); setDraft(d);
      pushUser(DURATION_OPTIONS.find((o) => o.value === value)?.label ?? value);
      setTimeout(() => {
        pushBot("Here's the schedule:", 'confirmation-card', { draftPayload: d });
        setPendingField('confirm');
      }, 300);
    }
  }

  // ── Task Flow ──

  function startTaskFlow() {
    pushUser('Create Task');
    setDraft({ type: 'task', date: todayISO() });
    setPendingField('title');
    setTimeout(() => pushBot("What's the task?", 'input-prompt', {
      inputField: { placeholder: 'e.g. Buy groceries...', type: 'text', field: 'title' },
    }), 300);
  }

  function handleTaskInput(field: string, value: string) {
    const d = { ...(draft as Extract<DraftPayload, { type: 'task' }>) };
    if (field === 'title') {
      d.title = value; d.description = value; setDraft(d); pushUser(value);
      setTimeout(() => {
        pushBot('When is it due?', 'input-prompt', { inputField: { placeholder: 'YYYY-MM-DD', type: 'date', field: 'date' } });
        setPendingField('date');
      }, 300);
    } else if (field === 'date') {
      d.date = value; setDraft(d); pushUser(value);
      setTimeout(() => {
        pushBot('Importance?', 'sub-menu', { options: IMPORTANCE_OPTIONS });
        setPendingField('importance');
      }, 300);
    } else if (field === 'importance') {
      d.importance = Number(value) as Importance; setDraft(d);
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
    setTimeout(() => pushBot("Assignment/task title?", 'input-prompt', {
      inputField: { placeholder: 'e.g. Chapter 5 revision...', type: 'text', field: 'title' },
    }), 300);
  }

  function handleStudyInput(field: string, value: string) {
    const d = { ...(draft as Extract<DraftPayload, { type: 'study' }>) };
    if (field === 'title') {
      d.title = value; setDraft(d); pushUser(value);
      const subs = [...new Set(schedules.map((s) => s.subjectName))];
      const opts: MenuOption[] = subs.length > 0
        ? subs.map((s) => ({ label: s, value: s }))
        : [{ label: 'General', value: 'General', description: 'No subjects yet' }];
      setTimeout(() => {
        pushBot('Which subject?', 'sub-menu', { options: opts });
        setPendingField('subject');
      }, 300);
    } else if (field === 'subject') {
      d.subject = value; setDraft(d); pushUser(value);
      setTimeout(() => {
        pushBot('Due date?', 'input-prompt', { inputField: { placeholder: 'YYYY-MM-DD', type: 'date', field: 'date' } });
        setPendingField('date');
      }, 300);
    } else if (field === 'date') {
      d.date = value; setDraft(d); pushUser(value);
      setTimeout(() => {
        pushBot('Importance?', 'sub-menu', { options: IMPORTANCE_OPTIONS });
        setPendingField('importance');
      }, 300);
    } else if (field === 'importance') {
      d.importance = Number(value) as Importance; setDraft(d);
      pushUser(IMPORTANCE_OPTIONS.find((o) => o.value === value)?.label ?? value);
      setTimeout(() => {
        pushBot("Here's the study task:", 'confirmation-card', { draftPayload: d });
        setPendingField('confirm');
      }, 300);
    }
  }

  // ── Dispatch ──

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
        await addTransaction({ type: 'expense', amount: draft.amount, category: draft.category, transaction_date: draft.date ?? todayISO(), description: draft.title ?? draft.description ?? 'Expense', is_recurring: false });
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
        await addSchedule({ id: uid(), subjectName: draft.subjectName, startTime: draft.startTime, endTime, days: draft.days, color: draft.color ?? pickColor(schedules) });
        toast.success(`Schedule added: ${draft.subjectName}`);
        pushBot(`Done! **${draft.subjectName}** added to your timetable.`);
      } else if (draft.type === 'task' && draft.title) {
        await addItem({ id: uid(), type: 'task', title: draft.title, description: draft.description ?? draft.title, date: draft.date ?? todayISO(), importance: draft.importance ?? 2, color: '#a855f7' });
        toast.success(`Task created: ${draft.title}`);
        pushBot(`Done! Task **${draft.title}** created.`);
      } else if (draft.type === 'study' && draft.title && draft.subject) {
        const payload: StudyPayload = { id: uid(), type: 'study', title: draft.title, description: draft.title, date: draft.date ?? todayISO(), importance: draft.importance ?? 2, color: '#6366f1', startTime: '09:00', endTime: '10:00', subject: draft.subject };
        await addItem(payload);
        toast.success(`Study task created: ${draft.title}`);
        pushBot(`Done! **${draft.title}** for **${draft.subject}** created.`);
      }
    } catch {
      pushBot("Something went wrong. Please try again.");
      toast.error('Failed to save');
    }

    setDraft(null);
    setPendingField(null);
    setProcessing(false);
    setTimeout(() => showMainMenu(), 800);
  }

  function handleCancel() {
    pushUser('Cancel');
    setDraft(null);
    setPendingField(null);
    showMainMenu('No problem! What would you like to do instead?');
  }

  // ── Day multi-select ──

  function toggleDay(dayNum: number) {
    setSelectedDays((prev) => prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort());
  }

  function confirmDays() {
    if (selectedDays.length === 0) return;
    handleFieldInput(selectedDays.join(','));
    setSelectedDays([]);
  }

  // ── Option click ──

  function handleOptionClick(value: string) {
    if (!pendingField) return;
    handleFieldInput(value);
  }

  // ── Free-text NLP fallback ──

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || processing) return;
    setInput('');

    // If in a wizard flow, route to current field
    if (draft && pendingField && pendingField !== 'confirm') {
      handleFieldInput(text);
      return;
    }

    // NLP fallback
    pushUser(text);
    setProcessing(true);

    setTimeout(async () => {
      const result = processNLP(text, schedules);

      if (result.type === 'navigate' && result.navPath) {
        navigate(result.navPath);
        pushBot(result.message);
        setProcessing(false);
        return;
      }

      if (result.type === 'chat') {
        pushBot(result.message);
        setProcessing(false);
        return;
      }

      // Has a draft — show confirmation or continue flow
      if (result.draft) {
        setDraft(result.draft);
        if (result.complete) {
          pushBot(result.message, 'confirmation-card', { draftPayload: result.draft });
          setPendingField('confirm');
        } else {
          // Incomplete — start the appropriate wizard flow for the missing field
          pushBot(result.message);
          if (result.type === 'expense') {
            const d = result.draft as Extract<DraftPayload, { type: 'expense' }>;
            if (!d.amount) {
              setPendingField('amount');
              setTimeout(() => pushBot('Enter the amount:', 'input-prompt', {
                inputField: { placeholder: 'e.g. 15.50', type: 'number', field: 'amount' },
              }), 400);
            }
          } else if (result.type === 'schedule') {
            const d = result.draft as Extract<DraftPayload, { type: 'schedule' }>;
            if (!d.subjectName) {
              setPendingField('subjectName');
            } else if (!d.startTime) {
              setPendingField('startTime');
              setTimeout(() => pushBot('Enter the start time:', 'input-prompt', {
                inputField: { placeholder: 'e.g. 09:00', type: 'time', field: 'startTime' },
              }), 400);
            }
          } else if (result.type === 'study') {
            const d = result.draft as Extract<DraftPayload, { type: 'study' }>;
            if (!d.title) {
              setPendingField('title');
            } else if (!d.subject) {
              setPendingField('subject');
              const subs = [...new Set(schedules.map((s) => s.subjectName))];
              const opts: MenuOption[] = subs.length > 0
                ? subs.map((s) => ({ label: s, value: s }))
                : [{ label: 'General', value: 'General' }];
              setTimeout(() => pushBot('Which subject?', 'sub-menu', { options: opts }), 400);
            }
          }
        }
      }

      setProcessing(false);
    }, 600 + Math.random() * 400);
  }, [input, processing, draft, pendingField, schedules, navigate, pushBot, pushUser]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 flex items-center justify-center transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open AI Assistant"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[370px] h-[520px] bg-[#18162e] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">OptiPlan AI</h3>
                  <p className="text-[10px] text-green-400">Online · Ready to help</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-colors" aria-label="Close chat">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-purple-600/25 border border-purple-500/20 px-3 py-2">
                          <p className="text-sm text-white">{msg.text}</p>
                        </div>
                      </div>
                    ) : (
                      <BotBubble
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
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-white/[0.06] border border-white/[0.06] px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-white/10 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type={pendingField === 'amount' ? 'number' : pendingField === 'date' ? 'date' : pendingField === 'startTime' ? 'time' : 'text'}
                  step={pendingField === 'amount' ? '0.01' : undefined}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    pendingField === 'confirm' ? 'Use buttons above...'
                    : pendingField ? 'Type your answer...'
                    : 'Type or use buttons above...'
                  }
                  disabled={processing || pendingField === 'confirm'}
                  className="flex-1 px-3 py-2 text-sm bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || processing}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  aria-label="Send"
                >
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Bot Bubble ───────────────────────────────────────────────────────────────

function BotBubble({
  msg, onOptionClick, onConfirm, onCancel, onMainMenu, pendingField, selectedDays, toggleDay, confirmDays,
}: {
  msg: Message;
  onOptionClick: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onMainMenu: (v: string) => void;
  pendingField: string | null;
  selectedDays: number[];
  toggleDay: (d: number) => void;
  confirmDays: () => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-3 h-3 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {/* Text */}
        {msg.text && (
          <div className="rounded-2xl rounded-tl-md bg-white/[0.05] border border-white/[0.06] px-3 py-2.5 max-w-[90%]">
            <RichText text={msg.text} />
          </div>
        )}

        {/* Main menu */}
        {msg.componentType === 'main-menu' && msg.options && (
          <div className="grid grid-cols-2 gap-1.5" style={{ maxWidth: 300 }}>
            {msg.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onMainMenu(opt.value)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-purple-500/30 transition-all text-left group"
              >
                <div className="w-7 h-7 rounded-md bg-purple-500/15 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/25 transition shrink-0">
                  {opt.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">{opt.label}</p>
                  {opt.description && <p className="text-[9px] text-gray-500 truncate">{opt.description}</p>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Sub-menu (non-days) */}
        {msg.componentType === 'sub-menu' && msg.options && pendingField !== 'days' && (
          <div className="flex flex-wrap gap-1" style={{ maxWidth: 300 }}>
            {msg.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onOptionClick(opt.value)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 hover:bg-purple-500/15 hover:border-purple-500/30 hover:text-purple-300 transition-all text-[11px] text-gray-300"
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Day multi-select */}
        {msg.componentType === 'sub-menu' && pendingField === 'days' && msg.options && (
          <div className="space-y-1.5" style={{ maxWidth: 300 }}>
            <div className="flex flex-wrap gap-1">
              {DAY_NAMES.map((d, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
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
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 text-[11px] font-medium border border-purple-500/30 hover:bg-purple-500/30 transition"
              >
                <Check className="w-3 h-3" />
                {selectedDays.map((n) => DAY_NAMES[n]).join(', ')}
              </button>
            )}
          </div>
        )}

        {/* Confirmation card */}
        {msg.componentType === 'confirmation-card' && msg.draftPayload && (
          <ConfirmCard draft={msg.draftPayload} onConfirm={onConfirm} onCancel={onCancel} />
        )}
      </div>
    </div>
  );
}

// ── Confirmation Card ────────────────────────────────────────────────────────

function ConfirmCard({ draft, onConfirm, onCancel }: { draft: DraftPayload; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="rounded-xl bg-[#131127] border border-white/10 p-3 shadow-xl" style={{ maxWidth: 260 }}>
      <div className="flex items-center gap-1.5 mb-2">
        {draft.type === 'expense' && <DollarSign className="w-3 h-3 text-yellow-400" />}
        {draft.type === 'schedule' && <CalendarDays className="w-3 h-3 text-blue-400" />}
        {draft.type === 'task' && <CheckSquare className="w-3 h-3 text-green-400" />}
        {draft.type === 'study' && <BookOpen className="w-3 h-3 text-purple-400" />}
        <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
          {draft.type === 'expense' ? 'New Expense' : draft.type === 'schedule' ? 'New Schedule' : draft.type === 'task' ? 'New Task' : 'Study Task'}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
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
            <Field label="Start" value={draft.startTime} />
            <Field label="Duration" value={draft.durationHours ? `${draft.durationHours}h` : undefined} />
          </>
        )}
        {draft.type === 'task' && (
          <>
            <Field label="Task" value={draft.title} />
            <Field label="Due" value={draft.date} />
            <Field label="Priority" value={draft.importance ? ['', 'Low', 'Medium', 'High'][draft.importance] : undefined} />
          </>
        )}
        {draft.type === 'study' && (
          <>
            <Field label="Title" value={draft.title} />
            <Field label="Subject" value={draft.subject} />
            <Field label="Due" value={draft.date} />
            <Field label="Priority" value={draft.importance ? ['', 'Low', 'Medium', 'High'][draft.importance] : undefined} />
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-green-500/15 text-green-400 text-[11px] font-semibold border border-green-500/25 hover:bg-green-500/25 transition">
          <Check className="w-3 h-3" /> Confirm
        </button>
        <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 text-gray-400 text-[11px] font-semibold border border-white/10 hover:bg-white/10 transition">
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, highlight, color }: { label: string; value?: string; highlight?: boolean; color?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-500">{label}</span>
      <span className={`text-[11px] font-medium ${highlight ? 'text-green-400' : 'text-white'}`} style={color ? { color } : undefined}>{value}</span>
    </div>
  );
}

// ── Rich Text ────────────────────────────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="text-sm text-gray-300 leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-1" />;
        if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start gap-1.5 text-gray-400">
              <span className="text-purple-400 mt-0.5">·</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <span key={i} className="font-semibold text-white">{part.slice(2, -2)}</span>;
    if (part.startsWith('*') && part.endsWith('*')) return <span key={i} className="italic text-gray-400">{part.slice(1, -1)}</span>;
    return part;
  });
}
