import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, BarChart3, CheckSquare, CalendarDays,
  DollarSign, BookOpen, Users, MessageSquare, Trophy, Heart,
  ArrowLeft, UserPlus,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// ── Types ─────────────────────────────────────────────────────────────────────

type BubbleKind = 'text' | 'menu-grid' | 'quick-replies' | 'feature-detail';

interface QuickReply {
  label: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  color?: string; // gradient classes for menu-grid icons
}

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  kind: BubbleKind;
  replies?: QuickReply[];
  repliesLabel?: string; // header above the replies, e.g. "Explore features"
  disabled?: boolean;
}

interface FeatureEntry {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  shortDesc: string;
  keywords: string[];
  detail: string;
  followUps: QuickReply[];
}

// ── Knowledge Base ────────────────────────────────────────────────────────────

const FEATURES: FeatureEntry[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'from-purple-500 to-pink-500',
    shortDesc: 'Your day at a glance',
    keywords: ['dashboard', 'overview', 'home', 'widgets', 'bento', 'main'],
    detail: "Your entire day on one screen.\n\n📊 **Real-time stats** — tasks, XP, productivity, spending\n🧩 **Smart widgets** — calendar, finance, timetable & more\n⭐ **XP tracking** — level up by hitting daily goals",
    followUps: [
      { label: 'Tasks', value: 'tasks', icon: <CheckSquare className="w-3 h-3" /> },
      { label: 'Finance', value: 'finance', icon: <DollarSign className="w-3 h-3" /> },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: <CheckSquare className="w-4 h-4" />,
    color: 'from-green-500 to-emerald-500',
    shortDesc: 'Kanban & list views',
    keywords: ['task', 'todo', 'kanban', 'checklist', 'assign', 'drag', 'drop'],
    detail: "Organize everything with drag-and-drop.\n\n✅ **Two views** — Kanban board or list\n📋 **Smart filters** — by status, importance, or type\n🎯 **Rich tasks** — due dates, tags, descriptions",
    followUps: [
      { label: 'Schedule', value: 'schedule', icon: <CalendarDays className="w-3 h-3" /> },
      { label: 'AI Chatbot', value: 'chatbot', icon: <MessageSquare className="w-3 h-3" /> },
    ],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: <CalendarDays className="w-4 h-4" />,
    color: 'from-blue-500 to-cyan-500',
    shortDesc: 'Weekly timetable planner',
    keywords: ['schedule', 'timetable', 'class', 'lecture', 'calendar', 'weekly'],
    detail: "Plan your week visually.\n\n📅 **7 AM – 8 PM** weekly timetable\n🎨 **Color-coded** — 8 colors, multi-day select\n🔄 **Auto-syncs** with AI chatbot & Study Hub",
    followUps: [
      { label: 'Collaboration', value: 'collab', icon: <Users className="w-3 h-3" /> },
      { label: 'Study Hub', value: 'studyhub', icon: <BookOpen className="w-3 h-3" /> },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'from-yellow-500 to-orange-500',
    shortDesc: 'Budget & expense tracking',
    keywords: ['finance', 'expense', 'budget', 'money', 'spending', 'dollar', 'cost', 'track'],
    detail: "See where your money goes.\n\n💰 **At-a-glance** — daily, weekly & monthly totals\n🍩 **8 categories** with donut chart breakdown\n💡 **Budget alerts** — get warned before overspending\n\nTip: just tell the AI \"$15 on lunch\" to log it!",
    followUps: [
      { label: 'Dashboard', value: 'dashboard', icon: <BarChart3 className="w-3 h-3" /> },
      { label: 'AI Chatbot', value: 'chatbot', icon: <MessageSquare className="w-3 h-3" /> },
    ],
  },
  {
    id: 'studyhub',
    label: 'Study Hub',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'from-indigo-500 to-violet-500',
    shortDesc: 'Notes, quizzes & flashcards',
    keywords: ['study', 'notes', 'flashcard', 'quiz', 'pomodoro', 'gpa', 'grade', 'learn'],
    detail: "6 study tools in one place.\n\n📁 **Sources** — upload documents\n📝 **AI Notes** — auto-generated from your files\n🧠 **Mind Maps** — visual knowledge graphs\n🃏 **Flashcards** — spaced repetition\n❓ **Quizzes** — auto-generated tests\n🎓 **GPA Tracker** — monitor your grades\n\nPlus a built-in **Pomodoro Timer**!",
    followUps: [
      { label: 'Achievements', value: 'achievements', icon: <Trophy className="w-3 h-3" /> },
      { label: 'Collaboration', value: 'collab', icon: <Users className="w-3 h-3" /> },
    ],
  },
  {
    id: 'collab',
    label: 'Collaboration',
    icon: <Users className="w-4 h-4" />,
    color: 'from-pink-500 to-rose-500',
    shortDesc: 'Group projects & chat',
    keywords: ['collab', 'group', 'team', 'chat', 'share', 'friends', 'invite', 'project'],
    detail: "Work together in real time.\n\n💬 **Group Chat** — messages, unsend, history\n📋 **Shared Kanban** — team task board\n📂 **Resource Vault** — share files & links\n📅 **Schedule Matcher** — find free time together\n👥 **Invite codes** — admin & member roles",
    followUps: [
      { label: 'AI Chatbot', value: 'chatbot', icon: <MessageSquare className="w-3 h-3" /> },
      { label: 'Schedule', value: 'schedule', icon: <CalendarDays className="w-3 h-3" /> },
    ],
  },
  {
    id: 'chatbot',
    label: 'AI Chatbot',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'from-purple-500 to-fuchsia-500',
    shortDesc: 'Natural language assistant',
    keywords: ['ai', 'chatbot', 'nlp', 'natural language', 'assistant', 'wizard', 'bot'],
    detail: "Do everything by just typing.\n\n🤖 **Natural language** — \"$15 on lunch\" or \"Calc class Mon 2pm\"\n📝 **Creates anything** — tasks, schedules, expenses, study sessions\n✨ **Group support** — add items to shared boards via chat",
    followUps: [
      { label: 'Tasks', value: 'tasks', icon: <CheckSquare className="w-3 h-3" /> },
      { label: 'Finance', value: 'finance', icon: <DollarSign className="w-3 h-3" /> },
    ],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: <Heart className="w-4 h-4" />,
    color: 'from-red-500 to-pink-500',
    shortDesc: 'Mood, journals & habits',
    keywords: ['wellness', 'mood', 'journal', 'habit', 'mental', 'health', 'meditation', 'mindful'],
    detail: "Take care of your mind.\n\n😊 **Mood check-ins** — 5 emoji scale, daily\n📔 **Journal** — auto-saving, private reflections\n✅ **Habit tracker** — custom habits with streaks\n📈 **7-day trends** — mood & habit charts",
    followUps: [
      { label: 'Achievements', value: 'achievements', icon: <Trophy className="w-3 h-3" /> },
      { label: 'Dashboard', value: 'dashboard', icon: <BarChart3 className="w-3 h-3" /> },
    ],
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: <Trophy className="w-4 h-4" />,
    color: 'from-amber-500 to-yellow-500',
    shortDesc: 'XP, badges & streaks',
    keywords: ['achievement', 'xp', 'level', 'badge', 'streak', 'reward', 'gamif', 'points'],
    detail: "Gamify your productivity.\n\n🏆 **100 achievements** across 14 categories\n🎮 **Earn XP** for every action you take\n⭐ **Level up** — build streaks and unlock badges",
    followUps: [
      { label: 'Wellness', value: 'wellness', icon: <Heart className="w-3 h-3" /> },
      { label: 'Study Hub', value: 'studyhub', icon: <BookOpen className="w-3 h-3" /> },
    ],
  },
];

const META_ENTRIES: { id: string; keywords: string[]; detail: string }[] = [
  {
    id: 'pricing',
    keywords: ['free', 'price', 'cost', 'paid', 'subscription', 'plan', 'pricing'],
    detail: "**Completely free** during early access!\n\n🎉 All features included, no credit card\n🚀 Your feedback shapes what we build next",
  },
  {
    id: 'getstarted',
    keywords: ['start', 'sign up', 'signup', 'register', 'begin', 'account', 'join'],
    detail: "Super easy to get started:\n\n1️⃣ Click **Sign Up Free**\n2️⃣ Create your account\n3️⃣ Start planning with AI\n\nNo credit card needed!",
  },
];

const GREETINGS = ['hi', 'hello', 'hey', 'sup', 'yo', 'howdy', 'hola', 'greetings', 'good morning', 'good afternoon', 'good evening'];
const FAREWELLS = ['bye', 'goodbye', 'see you', 'later', 'cya', 'gotta go', 'take care', 'peace', 'night', 'good night'];
const THANKS = ['thanks', 'thank you', 'thx', 'ty', 'appreciate', 'cheers'];
const HOW_ARE_YOU = ['how are you', 'how r u', "how's it going", 'whats up', "what's up", 'how do you do', 'how you doing'];
const WHAT_IS = ['what is optiplan', 'what does optiplan do', 'tell me about optiplan', 'what is this', 'about optiplan'];

const GREETING_RESPONSES = [
  "Hey there! 👋 Great to see you! What can I help you with today?",
  "Hi! 😊 Welcome to OptiPlan. Ask me anything or explore our features below!",
  "Hello! 👋 I'm here to help you learn about OptiPlan. What interests you?",
];

const FAREWELL_RESPONSES = [
  "Goodbye! 👋 Hope to see you on OptiPlan soon. Have a great day!",
  "See you later! 🚀 Sign up anytime to start organizing your life with AI.",
  "Take care! ✨ Feel free to come back anytime you have questions.",
];

const THANKS_RESPONSES = [
  "You're welcome! 😊 Let me know if there's anything else you'd like to know.",
  "Happy to help! 🙌 Want to explore more features?",
  "Anytime! ✨ Anything else I can tell you about?",
];

const HOW_ARE_YOU_RESPONSES = [
  "I'm doing great, thanks for asking! 😄 I'm always ready to chat about OptiPlan. What would you like to know?",
  "Running at full speed! ⚡ How can I help you today?",
  "Wonderful! 🌟 Always excited to help someone discover OptiPlan. What interests you?",
];

const ABOUT_RESPONSE = "**OptiPlan** — AI-powered student productivity.\n\n📋 **Tasks & Schedules** — organize your week\n💰 **Finance** — track spending with AI\n📚 **Study Hub** — notes, quizzes, flashcards\n🤝 **Collaboration** — group projects made easy\n🧘 **Wellness** — mood, habits & journaling\n🏆 **Gamification** — XP, levels & achievements\n\nAll connected through a smart AI chatbot! 🎓";

const FALLBACKS = [
  "Hmm, I'm not sure about that one! But I'd love to show you what OptiPlan can do:",
  "I might not have the answer to that, but here's what I can help with:",
  "That's outside my expertise, but let me show you OptiPlan's awesome features:",
];

const MAIN_MENU_REPLIES: QuickReply[] = FEATURES.map(f => ({
  label: f.label,
  value: f.id,
  icon: f.icon,
  description: f.shortDesc,
  color: f.color,
}));

let msgId = 0;
function mid() { return `lc-${msgId++}`; }

// ── Keyword Matcher ───────────────────────────────────────────────────────────

function matchInput(input: string): { detail: string; followUps?: QuickReply[] } | null {
  const lower = input.toLowerCase();

  // Check meta entries first (pricing, getting started)
  for (const entry of META_ENTRIES) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return {
        detail: entry.detail,
        followUps: [
          { label: 'Sign up free', value: 'signup', icon: <UserPlus className="w-3 h-3" /> },
          { label: 'Back to menu', value: 'main-menu', icon: <ArrowLeft className="w-3 h-3" /> },
        ],
      };
    }
  }

  // Score features by keyword matches
  let best: FeatureEntry | null = null;
  let bestScore = 0;
  for (const entry of FEATURES) {
    const score = entry.keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = entry; }
  }

  if (best) return { detail: best.detail, followUps: best.followUps };
  return null;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="text-sm text-gray-300 leading-relaxed space-y-1">
      {lines.map((line, li) => {
        if (!line.trim()) return <br key={li} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/);
        return (
          <p key={li}>
            {parts.map((part, pi) => {
              if (part.startsWith('**') && part.endsWith('**'))
                return <span key={pi} className="font-semibold text-white">{part.slice(2, -2)}</span>;
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
      </div>
      <div className="rounded-2xl rounded-tl-md bg-white/[0.05] border border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

function BotBubble({ msg, onReply }: { msg: Message; onReply: (value: string, label: string) => void }) {
  const isGrid = msg.kind === 'menu-grid';
  const isDetail = msg.kind === 'feature-detail';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-start gap-2.5"
    >
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0 space-y-2.5">
        {/* Text bubble */}
        <div className="rounded-2xl rounded-tl-md bg-white/[0.05] border border-white/[0.06] px-3.5 py-2.5 max-w-[85%]">
          <RichText text={msg.text} />
        </div>

        {/* Menu Grid — structured 2-col buttons with icons, labels, descriptions */}
        {isGrid && msg.replies && msg.replies.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="space-y-2"
          >
            {msg.repliesLabel && (
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider pl-1">{msg.repliesLabel}</p>
            )}
            <div className="grid grid-cols-2 gap-1.5 max-w-[300px]">
              {msg.replies.map((r) => (
                <motion.button
                  key={r.value}
                  variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
                  onClick={() => !msg.disabled && onReply(r.value, r.label)}
                  disabled={msg.disabled}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left group transition-all ${
                    msg.disabled
                      ? 'bg-white/[0.02] border border-white/[0.04] cursor-default opacity-50'
                      : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-purple-500/30'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${r.color || 'from-purple-500/20 to-pink-500/20'} flex items-center justify-center text-white shrink-0 ${
                    msg.disabled ? 'opacity-50' : 'group-hover:scale-105'
                  } transition`}>
                    {r.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white leading-tight">{r.label}</p>
                    {r.description && <p className="text-[9px] text-gray-500 truncate leading-tight">{r.description}</p>}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Feature detail follow-ups — pill chips with label */}
        {isDetail && msg.replies && msg.replies.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="space-y-1.5"
          >
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider pl-1">Explore more</p>
            <div className="flex flex-wrap gap-1.5">
              {msg.replies.map((r) => (
                <motion.button
                  key={r.value}
                  variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                  onClick={() => !msg.disabled && onReply(r.value, r.label)}
                  disabled={msg.disabled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                    msg.disabled
                      ? 'bg-white/[0.02] border-white/[0.05] text-gray-600 cursor-default'
                      : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-purple-500/15 hover:border-purple-500/30 hover:text-purple-300'
                  }`}
                >
                  {r.icon}
                  {r.label}
                </motion.button>
              ))}
              {/* Always show "Back to menu" on feature details */}
              <motion.button
                variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                onClick={() => !msg.disabled && onReply('main-menu', 'All features')}
                disabled={msg.disabled}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                  msg.disabled
                    ? 'bg-white/[0.02] border-white/[0.05] text-gray-600 cursor-default'
                    : 'bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                <ArrowLeft className="w-3 h-3" />
                All features
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Generic quick-replies (fallback pills) */}
        {msg.kind === 'quick-replies' && msg.replies && msg.replies.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
            className="flex flex-wrap gap-1.5"
          >
            {msg.replies.map((r) => (
              <motion.button
                key={r.value}
                variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                onClick={() => !msg.disabled && onReply(r.value, r.label)}
                disabled={msg.disabled}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                  msg.disabled
                    ? 'bg-white/[0.02] border-white/[0.05] text-gray-600 cursor-default'
                    : 'bg-white/[0.04] border-white/10 text-gray-300 hover:bg-purple-500/15 hover:border-purple-500/30 hover:text-purple-300'
                }`}
              >
                {r.icon}
                {r.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex justify-end"
    >
      <div className="rounded-2xl rounded-tr-md bg-purple-600/20 border border-purple-500/20 px-3.5 py-2.5 max-w-[75%]">
        <p className="text-sm text-white">{text}</p>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LandingChatbox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Auto-scroll on new messages / typing
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [messages, typing]);

  // Preview tooltip after 5s
  useEffect(() => {
    const t = setTimeout(() => { if (!hasOpened) setShowPreview(true); }, 5000);
    return () => clearTimeout(t);
  }, [hasOpened]);

  // Body scroll lock on mobile
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open, isMobile]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const pushBot = useCallback((text: string, kind: BubbleKind = 'text', replies?: QuickReply[], repliesLabel?: string) => {
    setMessages(prev => [...prev, { id: mid(), role: 'bot', text, kind, replies, repliesLabel }]);
  }, []);

  const pushUser = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: mid(), role: 'user', text, kind: 'text' }]);
  }, []);

  const disableLastReplies = useCallback(() => {
    setMessages(prev => prev.map((m, i) => {
      if (i === prev.length - 1 || (m.role === 'bot' && m.replies?.length)) {
        return { ...m, disabled: true };
      }
      return m;
    }));
  }, []);

  const showMainMenu = useCallback((introText?: string) => {
    pushBot(
      introText || "What would you like to know about? Pick a feature or just type a question!",
      'menu-grid',
      MAIN_MENU_REPLIES,
      'Choose a feature',
    );
  }, [pushBot]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setShowPreview(false);
    if (!hasOpened) {
      setHasOpened(true);
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushBot("Hi! 👋 I'm OptiPlan's assistant. I can tell you about all our features.");
        setTimeout(() => showMainMenu(), 300);
      }, 600);
    }
  }, [hasOpened, pushBot, showMainMenu]);

  const handleReply = useCallback((value: string, label: string) => {
    disableLastReplies();
    pushUser(label);

    if (value === 'main-menu') {
      setTyping(true);
      setTimeout(() => { setTyping(false); showMainMenu(); }, 500);
      return;
    }

    if (value === 'signup') {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushBot("Great choice! 🚀 Click the button below to create your free account.", 'text');
        setTimeout(() => { window.location.href = '/signup'; }, 1500);
      }, 500);
      return;
    }

    const feature = FEATURES.find(f => f.id === value);
    if (feature) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushBot(feature.detail, 'feature-detail', feature.followUps);
      }, 600 + Math.random() * 400);
    }
  }, [disableLastReplies, pushUser, pushBot, showMainMenu]);

  const handleSend = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput('');
    disableLastReplies();
    pushUser(trimmed);

    const lower = trimmed.toLowerCase();
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const matchAny = (patterns: string[]) => patterns.some(p => lower.includes(p) || lower === p);

    setTyping(true);
    const delay = 600 + Math.random() * 400;

    setTimeout(() => {
      setTyping(false);

      // Greetings
      if (matchAny(GREETINGS)) {
        pushBot(pick(GREETING_RESPONSES));
        setTimeout(() => showMainMenu(), 300);
        return;
      }

      // Farewells
      if (matchAny(FAREWELLS)) {
        pushBot(pick(FAREWELL_RESPONSES), 'quick-replies', [
          { label: 'Sign up free', value: 'signup', icon: <UserPlus className="w-3 h-3" /> },
        ]);
        return;
      }

      // Thank you
      if (matchAny(THANKS)) {
        pushBot(pick(THANKS_RESPONSES));
        setTimeout(() => showMainMenu(), 300);
        return;
      }

      // How are you
      if (matchAny(HOW_ARE_YOU)) {
        pushBot(pick(HOW_ARE_YOU_RESPONSES));
        setTimeout(() => showMainMenu(), 300);
        return;
      }

      // What is OptiPlan
      if (matchAny(WHAT_IS)) {
        pushBot(ABOUT_RESPONSE, 'feature-detail', [
          { label: 'Sign up free', value: 'signup', icon: <UserPlus className="w-3 h-3" /> },
        ]);
        return;
      }

      // Feature / keyword match
      const match = matchInput(trimmed);
      if (match) {
        pushBot(match.detail, 'feature-detail', match.followUps);
      } else {
        const fallback = pick(FALLBACKS);
        showMainMenu(fallback);
      }
    }, delay);
  }, [input, disableLastReplies, pushUser, pushBot, showMainMenu]);

  return (
    <>
      {/* Preview Tooltip */}
      <AnimatePresence>
        {showPreview && !open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[5.5rem] right-6 z-[61] max-w-[260px]"
          >
            <div className="relative rounded-xl bg-[#1a1625] border border-white/10 px-4 py-3 shadow-xl shadow-purple-900/20">
              <button
                onClick={() => setShowPreview(false)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#2d2640] border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
              <p className="text-sm text-[#F6F3FB]">Curious about OptiPlan? Ask me anything! 💬</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className={
              isMobile
                ? 'fixed inset-0 z-[60] flex flex-col bg-[#0d0b1e]'
                : 'fixed bottom-24 right-6 z-[60] w-[380px] h-[540px] flex flex-col rounded-2xl bg-[#0d0b1e]/90 border border-white/10 shadow-2xl shadow-purple-900/20 backdrop-blur-xl overflow-hidden'
            }
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">OptiPlan Assistant</h3>
                <p className="text-[11px] text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Online
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.2) transparent' }}
            >
              <AnimatePresence initial={false}>
                {messages.map(msg =>
                  msg.role === 'user'
                    ? <UserBubble key={msg.id} text={msg.text} />
                    : <BotBubble key={msg.id} msg={msg} onReply={handleReply} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {typing && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <TypingDots />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Bar */}
            <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.01] shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about any feature..."
                  className="flex-1 px-4 py-2.5 text-sm bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex items-center justify-center transition-all disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        aria-label="Chat with OptiPlan"
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-900/40 transition-all hover:scale-105 active:scale-95"
      >
        {!open && !hasOpened && (
          <span className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </>
  );
}
