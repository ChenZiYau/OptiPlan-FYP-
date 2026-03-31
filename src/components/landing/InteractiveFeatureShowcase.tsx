import { useState } from 'react';
import { Bot, FileText, Network, Calendar, Database, Target, Brain, Award } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import type { Message } from './ChatWindow';

// Helper for structured feature replies
function FeatureReply({ heading, points }: { heading: string; points: string[] }) {
  return (
    <div className="space-y-1.5">
      <p className="font-medium">{heading}</p>
      <ul className="space-y-1 pl-1">
        {points.map((pt) => (
          <li key={pt} className="flex items-start gap-1.5">
            <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
            <span className="text-zinc-300">{pt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Predefined AI flows based on codebase analysis
export const featureFlows: Record<string, { reply: React.ReactNode; icon: React.ReactNode }> = {
  "Study Hub": {
    reply: <FeatureReply heading="Your all-in-one study toolkit 🧠" points={[
      "Upload PDFs, DOCX & slides — AI extracts everything",
      "Auto-generates study notes & mind maps",
      "Create flashcards & quizzes from your sources",
      "Built-in Pomodoro timer to keep you focused",
      "Chat with your documents using AI-powered Q&A",
    ]} />,
    icon: <Database className="w-5 h-5" />
  },
  "Schedule Matcher": {
    reply: <FeatureReply heading="Find free time with friends instantly ✨" points={[
      "Import your class timetable in seconds",
      "Auto-compare schedules with friends",
      "See overlapping free slots at a glance",
      "No more back-and-forth texting to plan meetups",
    ]} />,
    icon: <Calendar className="w-5 h-5" />
  },
  "Collaboration Groups": {
    reply: <FeatureReply heading="Team up and get things done 🤝" points={[
      "Create project groups with your classmates",
      "Real-time group chat & file sharing",
      "Shared Kanban board for task management",
      "Group calendar with deadlines & milestones",
      "Resource vault for links, docs & uploads",
    ]} />,
    icon: <Network className="w-5 h-5" />
  },
  "GPA Tracker & Wrapped": {
    reply: <FeatureReply heading="Track your academic journey 📈" points={[
      "Log your grades and calculate your GPA",
      "Set target GPA goals and track progress",
      "Semester 'Wrapped' — a visual recap of your habits",
      "See stats on tasks completed, study hours & more",
    ]} />,
    icon: <Target className="w-5 h-5" />
  },
  "Tasks & Kanban": {
    reply: <FeatureReply heading="Stay organized, never miss a deadline ✅" points={[
      "Drag-and-drop Kanban board (To Do → In Progress → Done)",
      "Create tasks, study sessions & events",
      "Set priorities and due dates",
      "Filter and sort by status, date or importance",
      "AI assistant helps you create tasks via chat",
    ]} />,
    icon: <FileText className="w-5 h-5" />
  },
  "Finance Tracker": {
    reply: <FeatureReply heading="Student budget, under control 💸" points={[
      "Log daily expenses with categories",
      "Set monthly budgets with per-category limits",
      "Visual spending breakdown with pie charts",
      "Track trends and spot overspending early",
      "Currency toggle for international students",
    ]} />,
    icon: <Target className="w-5 h-5" />
  },
  "Wellness & Health": {
    reply: <FeatureReply heading="Take care of yourself too 🧘‍♀️" points={[
      "Daily mood logging & habit tracking",
      "Personalized wellness tips based on your patterns",
      "Break reminders during long study sessions",
      "Build healthy routines with streak tracking",
    ]} />,
    icon: <Brain className="w-5 h-5" />
  },
  "Achievements": {
    reply: <FeatureReply heading="Gamify your productivity 🏆" points={[
      "Earn XP for completing tasks & study sessions",
      "Level up and unlock badges & achievements",
      "Track streaks for daily consistency",
      "Compete with yourself — see your stats grow",
    ]} />,
    icon: <Award className="w-5 h-5" />
  }
};

// ── Greeting / conversational pattern matcher ──────────────────────────────

const GREETING_PATTERNS: { test: RegExp; response: string }[] = [
  {
    test: /^(hi|hello|hey|howdy|hola|sup|yo|hii+|helo+|what'?s? ?up)[\s!?.]*$/i,
    response: "Hi there! I'm the OptiPlan assistant. I can show you around our features, like the Study Hub or Schedule Matcher. What would you like to explore?"
  },
  {
    test: /^(how are you|how('?s| is) it going|how do you do|how('?re| are) things)[\s!?.]*$/i,
    response: "I'm doing great, thanks for asking! I'm here to help you learn about OptiPlan. Want to hear about our Study Hub, Task Manager, or something else?"
  },
  {
    test: /^(what is this|what('?s| is) optiplan|what does this do|what is this (app|site|website|platform))[\s!?.]*$/i,
    response: "OptiPlan is a free, all-in-one student productivity platform! It includes a Study Hub, Schedule Matcher, Budget Tracker, and more — all powered by AI. Want me to walk you through a feature?"
  },
  {
    test: /^(thanks?|thank you|thx|ty|cheers|appreciate it)[\s!?.]*$/i,
    response: "You're welcome! Let me know if there's anything else you'd like to know about OptiPlan."
  },
  {
    test: /^(bye|goodbye|see ya|cya|later|gtg|good ?bye)[\s!?.]*$/i,
    response: "See you around! If you want to give OptiPlan a try, just click \"Get OptiPlan\" at the top of the page. It's completely free!"
  },
  {
    test: /^(help|i need help|can you help)[\s!?.]*$/i,
    response: "Of course! I can tell you about any of OptiPlan's features — Study Hub, Schedule Matcher, Budget Tracker, Wellness tools, and more. Just ask or click a feature button!"
  },
];

export function getGreetingResponse(text: string): string | null {
  const trimmed = text.trim();
  for (const { test, response } of GREETING_PATTERNS) {
    if (test.test(trimmed)) return response;
  }
  return null;
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  sender: 'bot',
  text: "Hey there! I'm the OptiPlan AI. Click any of the features on the left to learn how we can supercharge your student life!"
};

export function InteractiveFeatureShowcase() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const handleFeatureClick = (featureName: string) => {
    if (isTyping || activeFeature === featureName) return;

    setActiveFeature(featureName);
    
    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: `Tell me about ${featureName}`
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Simulate AI thinking / typing delay (800ms)
    setTimeout(() => {
      const flowData = featureFlows[featureName];
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: flowData ? flowData.reply : "I'm still learning about that feature!"
      };
      
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      setActiveFeature(null);
    }, 800);
  };

  const handleSendMessage = async (text: string) => {
    if (isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    // Check for a matching feature flow (case-insensitive partial match)
    const lowerText = text.toLowerCase().trim();
    const matchedFeature = Object.keys(featureFlows).find(name =>
      lowerText.includes(name.toLowerCase())
    );

    if (matchedFeature) {
      setTimeout(() => {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: featureFlows[matchedFeature].reply
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
        setActiveFeature(null);
      }, 600);
      return;
    }

    // Check for basic greetings / conversational inputs
    const greeting = getGreetingResponse(lowerText);
    if (greeting) {
      setTimeout(() => {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: greeting
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
      }, 500);
      return;
    }

    // Otherwise, send to the real AI backend
    try {
      const history = updatedMessages
        .filter(m => m.sender === 'user' || (m.sender === 'bot' && typeof m.text === 'string'))
        .map(m => ({
          role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
          text: typeof m.text === 'string' ? m.text : '',
        }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/landing-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(0, -1) }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || `API ${response.status}`);
      }

      const data = await response.json();
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply || "Could you rephrase that? I want to make sure I help you properly!"
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("LLM Chat Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I'm having a little trouble connecting to my server right now, but feel free to click the feature buttons on the left to see what OptiPlan can do!"
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch my-16">
      {/* Left Column: Feature Buttons — defines the row height */}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-400" /> Let's Chat Features
        </h3>
        
        <div className="flex flex-col gap-3">
          {Object.entries(featureFlows).map(([name, { icon }]) => (
            <div
              key={name}
              onClick={() => handleFeatureClick(name)}
              className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 group
                ${activeFeature === name ? 'bg-indigo-600/20 border-indigo-500' : 'bg-zinc-900 border-white/10 hover:border-indigo-500/50 hover:bg-zinc-800'}
                ${isTyping && activeFeature !== name ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`p-2 rounded-lg transition-colors ${activeFeature === name ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-400 group-hover:text-indigo-400'}`}>
                {icon}
              </div>
              <div>
                <div className="font-semibold text-white">{name}</div>
                <div className="text-sm text-zinc-400">Ask the AI about this</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Chat Window — locked to left column height, scrolls internally */}
      <div className="relative h-[500px] lg:h-auto mt-8 lg:mt-0">
        <div className="lg:absolute lg:inset-0">
          <ChatWindow
            messages={messages}
            isTyping={isTyping}
            className="shadow-2xl shadow-black/50 h-full w-full"
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}
