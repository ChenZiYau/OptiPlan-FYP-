import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Sparkles, CheckSquare, CalendarDays, DollarSign, BookOpen,
  Users, Trophy, Heart, Settings, BarChart3, MessageSquare,
  ChevronRight, RotateCcw, Zap, Brain, FileText, Gamepad2,
} from 'lucide-react';

// ── Types ──

interface ChatBubble {
  id: string;
  role: 'bot' | 'user';
  text: string;
  delay: number; // ms before showing
}

interface FeatureDemo {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bubbles: ChatBubble[];
}

// ── Feature Demos ──

let bubbleId = 0;
function b(role: 'bot' | 'user', text: string, delay = 0): ChatBubble {
  return { id: `b-${bubbleId++}`, role, text, delay };
}

const FEATURES: FeatureDemo[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'from-purple-500 to-pink-500',
    bubbles: [
      b('bot', "Welcome to your Dashboard! Here's your day at a glance.", 0),
      b('bot', "📊 Your bento-grid overview shows: Items Today, XP Level, Productivity %, and Today's Spending — all in real-time.", 800),
      b('bot', '🧩 Expandable widgets for Calendar, Finance, Tasks, Timetable, Study Hub, and Wellness — all on one screen.', 1600),
      b('user', 'What about my progress?', 2400),
      b('bot', '⭐ Your XP widget tracks your level, streak, and daily goals. Hit your targets to level up!', 800),
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: <CheckSquare className="w-4 h-4" />,
    color: 'from-green-500 to-emerald-500',
    bubbles: [
      b('bot', '✅ Your Task Manager supports both Kanban Board and List views.', 0),
      b('user', 'How do I organize tasks?', 800),
      b('bot', '📋 Filter by status (Todo, In Progress, Done), importance level, or type (Task, Event, Study). Full-text search included!', 800),
      b('bot', '🎯 Create tasks with title, description, due date, importance, and tags. Track everything in one place.', 800),
      b('user', 'Can I drag and drop?', 800),
      b('bot', 'Absolutely! Drag tasks between columns in Kanban view, or use quick-action buttons to update status instantly.', 800),
    ],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: <CalendarDays className="w-4 h-4" />,
    color: 'from-blue-500 to-cyan-500',
    bubbles: [
      b('bot', '📅 Your Interactive Weekly Timetable shows classes from 7 AM to 8 PM.', 0),
      b('user', 'How do I add a class?', 800),
      b('bot', '🎨 Enter subject name, pick days (multi-select), set start time & duration, and choose from 8 colors. Done!', 800),
      b('bot', '📌 Hover any time slot to see subject details, time, and duration at a glance.', 800),
      b('user', 'Does it sync?', 800),
      b('bot', '🔄 Your schedule syncs across all features — the AI chatbot and Study Hub both reference it automatically.', 800),
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'from-yellow-500 to-orange-500',
    bubbles: [
      b('bot', "💰 Track every dollar with OptiPlan's Finance Tracker.", 0),
      b('bot', "📊 See Today's Spending, This Week, This Month, and Total Balance — all at a glance.", 800),
      b('user', 'What kind of charts?', 800),
      b('bot', '🍩 Category breakdown donut chart (8 categories: Food, Transport, Shopping, Entertainment, Education, Health, Bills, Other) plus spending trends over time.', 800),
      b('bot', '💡 Set budgets per category with progress bars, and get alerts when approaching limits.', 800),
      b('user', 'How do I add expenses?', 800),
      b('bot', 'Quick-add via modal or just tell the AI chatbot: "$15 on lunch" — it handles the rest!', 800),
    ],
  },
  {
    id: 'studyhub',
    label: 'Study Hub',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'from-indigo-500 to-violet-500',
    bubbles: [
      b('bot', '📚 Your all-in-one Study Hub has 6 powerful tabs.', 0),
      b('user', 'What tabs?', 800),
      b('bot', '📁 Sources — Upload & manage study documents\n📝 Notes — AI-generated study notes\n🧠 Mind Map — Visual knowledge graphs', 800),
      b('bot', '🃏 Flashcards — Spaced repetition learning\n❓ Quiz — Auto-generated tests\n🎓 GPA — Grade tracking & performance', 800),
      b('bot', "⏱️ Plus a built-in Pomodoro Timer to keep you focused during study sessions!", 2800),
    ],
  },
  {
    id: 'collab',
    label: 'Collaboration',
    icon: <Users className="w-4 h-4" />,
    color: 'from-pink-500 to-rose-500',
    bubbles: [
      b('bot', '🤝 Real-time collaboration for group projects!', 0),
      b('user', 'What can we do together?', 800),
      b('bot', '💬 Group Chat with message history & unsend\n📋 Shared Kanban Board for tasks\n📂 Resource Vault for files & links\n📅 Schedule Matcher to find free time', 800),
      b('bot', '👥 Add friends, set nicknames & notes, manage groups with invite codes. Roles include admin & member.', 800),
      b('user', 'File sharing?', 800),
      b('bot', '📎 Upload PDFs, Word docs, and PowerPoint files directly to your group vault. Share links too!', 800),
    ],
  },
  {
    id: 'chatbot',
    label: 'AI Chatbot',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'from-purple-500 to-fuchsia-500',
    bubbles: [
      b('bot', '🤖 Your AI Wizard handles tasks through natural conversation!', 0),
      b('user', 'What can it do?', 800),
      b('bot', '📝 Create tasks, schedule classes, log expenses, and set up study sessions — all through guided chat flows.', 800),
      b('bot', '🧠 Smart NLP understands natural language: try "$15 on lunch" or "Calculus class on Monday at 2pm".', 800),
      b('user', 'Does it work with groups?', 800),
      b('bot', "✨ Yes! Add schedule tasks and share resources to your collaboration groups — just pick the group and the AI guides you through it.", 3000),
    ],
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: <Trophy className="w-4 h-4" />,
    color: 'from-amber-500 to-yellow-500',
    bubbles: [
      b('bot', '🏆 100 achievements across 14 categories to unlock!', 0),
      b('user', 'What categories?', 800),
      b('bot', '✅ Task Completion · 📝 Task Creation · ⚡ Speed · 🔥 Streaks · 📂 Organization · ⭐ XP & Leveling · 📚 Study · 📅 Events', 800),
      b('bot', '💰 Finance · 🧘 Wellness · 🤝 Collaboration · 📓 Notes · 💎 Advanced · 👑 Master Class', 800),
      b('bot', '🎮 Every action earns XP. Level up, build streaks, and track your progress on the achievements page!', 2800),
    ],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: <Heart className="w-4 h-4" />,
    color: 'from-red-500 to-pink-500',
    bubbles: [
      b('bot', '🧘 Take care of your mind with the Wellness tracker.', 0),
      b('user', 'What does it track?', 800),
      b('bot', '😊 Daily mood check-in with 5 emoji options (Awful to Great)\n📔 Journaling with auto-save\n✅ Custom habit tracking with streaks', 800),
      b('bot', '📈 View your 7-day mood history chart, habit completion rates, and streak records.', 800),
      b('user', 'I like journaling!', 800),
      b('bot', '✏️ Your journal auto-saves as you type. Reflect on your day, track patterns, and build mindful habits!', 3000),
    ],
  },
  {
    id: 'wrapped',
    label: 'Wrapped',
    icon: <Gamepad2 className="w-4 h-4" />,
    color: 'from-emerald-500 to-teal-500',
    bubbles: [
      b('bot', "🎬 OptiPlan Wrapped — your semester in review, Spotify-style!", 0),
      b('user', 'What does it show?', 800),
      b('bot', '📊 Animated slides with: Tasks completed, Money saved, Flashcards mastered, Focus hours, Top subject, Streak days, and your percentile ranking.', 800),
      b('bot', '📱 Beautiful carousel navigation with download-as-image and social sharing!', 800),
      b('user', 'That sounds fun!', 800),
      b('bot', '🎉 It is! Complete more tasks and activities to make your Wrapped even more impressive at the end of the semester.', 3000),
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
    color: 'from-gray-500 to-slate-500',
    bubbles: [
      b('bot', '⚙️ Customize OptiPlan to fit your needs.', 0),
      b('user', 'What can I customize?', 800),
      b('bot', '👤 Account: Update profile, avatar, and manage your session.\n🎨 Appearance: Dark/Light/System mode, 5+ themes, adjustable text scale.', 800),
      b('bot', '♿ Accessibility: High contrast, dyslexia-friendly fonts, reduced motion, and screen reader support.', 800),
      b('user', 'Nice, very inclusive!', 800),
      b('bot', '🌟 We believe productivity tools should work for everyone. Pick what suits you best!', 3000),
    ],
  },
];

// ── Component ──

export function InteractiveDemo() {
  const [activeFeature, setActiveFeature] = useState<string>('dashboard');
  const [visibleBubbles, setVisibleBubbles] = useState<ChatBubble[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const feature = FEATURES.find((f) => f.id === activeFeature)!;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Start the chat flow for the active feature
  useEffect(() => {
    clearTimers();
    setVisibleBubbles([]);
    setIsTyping(false);

    const allBubbles = feature.bubbles;
    let cumulativeDelay = 300; // initial delay

    allBubbles.forEach((bubble, i) => {
      const delay = i === 0 ? cumulativeDelay : cumulativeDelay + bubble.delay;
      cumulativeDelay = delay;

      // Show typing indicator before bot messages
      if (bubble.role === 'bot') {
        const typingTimer = setTimeout(() => setIsTyping(true), delay - 200);
        timersRef.current.push(typingTimer);
      }

      const showTimer = setTimeout(() => {
        setIsTyping(false);
        setVisibleBubbles((prev) => [...prev, bubble]);
      }, delay + (bubble.role === 'bot' ? 500 : 0));
      timersRef.current.push(showTimer);
    });

    return clearTimers;
  }, [activeFeature, feature.bubbles, clearTimers]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [visibleBubbles, isTyping]);

  function selectFeature(id: string) {
    if (id === activeFeature) return;
    setActiveFeature(id);
  }

  function restart() {
    const current = activeFeature;
    setActiveFeature('');
    setTimeout(() => setActiveFeature(current), 50);
  }

  return (
    <section id="interactive-demo" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6"
          >
            <Zap className="w-3.5 h-3.5" />
            Interactive Tour
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            Explore <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">every feature</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto"
          >
            Click any feature below and watch the AI walk you through it — just like the real app.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center"
        >
          {/* Feature Selector — Left Side */}
          <div className="w-full lg:w-[340px] shrink-0 order-2 lg:order-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => selectFeature(f.id)}
                  className={`relative flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 group ${
                    activeFeature === f.id
                      ? 'bg-white/[0.08] border border-white/20 shadow-lg shadow-purple-500/5'
                      : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/10'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      activeFeature === f.id
                        ? `bg-gradient-to-br ${f.color} text-white shadow-md`
                        : 'bg-white/[0.06] text-gray-400 group-hover:text-gray-300'
                    }`}
                  >
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${activeFeature === f.id ? 'text-white' : 'text-gray-300'}`}>
                      {f.label}
                    </p>
                  </div>
                  {activeFeature === f.id && (
                    <motion.div
                      layoutId="feature-indicator"
                      className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-purple-400"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Feature Count */}
            <div className="mt-4 flex items-center justify-between px-1">
              <p className="text-[11px] text-gray-500">
                <span className="text-purple-400 font-semibold">{FEATURES.length}</span> features to explore
              </p>
              <button
                onClick={restart}
                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-purple-400 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Replay
              </button>
            </div>
          </div>

          {/* Chat Window — Right Side */}
          <div className="w-full lg:flex-1 max-w-xl order-1 lg:order-2 mx-auto lg:mx-0">
            <div className="rounded-2xl bg-[#0d0b1e]/90 border border-white/10 shadow-2xl shadow-purple-900/20 overflow-hidden backdrop-blur-xl">
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                  <Bot className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">OptiPlan AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-400/80">
                      Showing: {feature.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Brain className="w-4 h-4 text-purple-400/50" />
                  <FileText className="w-4 h-4 text-purple-400/50" />
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="h-[380px] sm:h-[420px] overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(139,92,246,0.2) transparent',
                }}
              >
                <AnimatePresence initial={false}>
                  {visibleBubbles.map((bubble) => (
                    <motion.div
                      key={bubble.id}
                      initial={{ opacity: 0, y: 12, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      {bubble.role === 'bot' ? (
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          </div>
                          <div className="rounded-2xl rounded-tl-md bg-white/[0.05] border border-white/[0.06] px-3.5 py-2.5 max-w-[85%]">
                            <BubbleText text={bubble.text} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <div className="rounded-2xl rounded-tr-md bg-purple-600/20 border border-purple-500/20 px-3.5 py-2.5 max-w-[75%]">
                            <p className="text-sm text-white">{bubble.text}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2.5"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom bar */}
              <div className="px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3.5 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-gray-600 select-none">
                    Click a feature to explore...
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-purple-300/50" />
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle note */}
            <p className="text-center text-[10px] text-gray-600 mt-3">
              This is a preview — sign up to experience the full app
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Rich text renderer (emoji-safe, handles \n) ──

function BubbleText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="text-sm text-gray-300 leading-relaxed space-y-0.5">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-0.5" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}
