import { useState } from 'react';
import { Bot, FileText, Network, Calendar, Database, Target, Brain, Award } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import type { Message } from './ChatWindow';

// Predefined AI flows based on codebase analysis
export const featureFlows: Record<string, { reply: string; icon: React.ReactNode }> = {
  "Study Hub": {
    reply: "Upload your source documents and our AI instantly generates study notes, mind maps, flashcards, and quizzes for you! 🧠 We even included a built-in Pomodoro timer.",
    icon: <Database className="w-5 h-5" />
  },
  "Schedule Matcher": {
    reply: "No more back-and-forth texting! We automatically compare your timetable with your friends' to find the perfect common free time. ✨",
    icon: <Calendar className="w-5 h-5" />
  },
  "Collaboration Groups": {
    reply: "Create dedicated spaces for your project teams. Share files, chat in real-time, and manage collective deadlines without breaking a sweat. 🤝",
    icon: <Network className="w-5 h-5" />
  },
  "GPA Tracker & Wrapped": {
    reply: "Keep your academic goals in focus with our GPA tracker, and get a cool 'Wrapped' summary of your study habits at the end of every semester! 📈",
    icon: <Target className="w-5 h-5" />
  },
  "Tasks & Kanban": {
    reply: "Stay on top of assignments with an interactive, drag-and-drop Kanban board. Breaking down large projects has never been easier. ✅",
    icon: <FileText className="w-5 h-5" />
  },
  "Finance Tracker": {
    reply: "Keep your student budget in check! Track your daily expenses and categorize your spending so you always know where your money goes. 💸",
    icon: <Target className="w-5 h-5" />
  },
  "Wellness & Health": {
    reply: "Burnout is real. Log your mood, get personalized wellness tips, and remember to take mindful breaks during those intense study sessions. 🧘‍♀️",
    icon: <Brain className="w-5 h-5" />
  },
  "Achievements": {
    reply: "Gamify your studying! Earn badges and level up as you complete tasks, ace quizzes, and stick to your schedule. 🏆",
    icon: <Award className="w-5 h-5" />
  }
};

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

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // 2. Call Groq API
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY || '';
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192', 
          messages: [
            { role: 'system', content: 'You are a helpful, very brief and witty assistant for exactly the OptiPlan student productivity app. Do not output markdown, just plain text.' },
            { role: 'user', content: text }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content || "I'm having trouble thinking right now!";

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botReply
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("LLM Chat Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Oops, my AI brain seems to be disconnected right now. Can I help you with the features on the left instead?"
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch my-16">
      {/* Left Column: Feature Buttons */}
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

      {/* Right Column: Chat Window */}
      <div className="h-full w-full flex flex-col mt-8 lg:mt-0 relative">
        {/* Decorative background glow behind chat */}
        <div className="absolute inset-x-0 -top-40 -bottom-40 overflow-hidden -z-10 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex-1 min-h-[500px] lg:min-h-0 h-full w-full">
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
