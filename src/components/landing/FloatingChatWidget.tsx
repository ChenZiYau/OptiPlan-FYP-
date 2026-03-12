import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import type { Message } from './ChatWindow';
import { featureFlows } from './InteractiveFeatureShowcase';

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'bot',
    text: "Hi there! 👋 I'm your OptiPlan assistant."
  },
  {
    id: '2',
    sender: 'bot',
    text: "What would you like to know about our platform?"
  }
];

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);

  // Take the first 4 features as quick replies to keep the UI clean
  const quickReplies = Object.keys(featureFlows).slice(0, 4);

  const handleQuickReply = (featureName: string) => {
    if (isTyping) return;

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: `Tell me about ${featureName}`
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 2. Simulate AI delay
    setTimeout(() => {
      const flowData = featureFlows[featureName];
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: flowData ? flowData.reply : "Here is more info about that feature!"
      };
      
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
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
      // Note: In Vite, env variables usually need the VITE_ prefix to be exposed to the client.
      // Assuming a simple fetch to Groq's completions endpoint.
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.GROQ_API_KEY || '';
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192', // or any lightweight fast model
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
        text: "Oops, my AI brain seems to be disconnected right now. Can I help you with the quick replies below instead?"
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
      
      {/* Expanding Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[90vw] sm:w-[380px] h-[500px] max-h-[70vh] flex flex-col pointer-events-auto bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/20"
          >
            {/* Custom Header for the widget with Close Button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/80 shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-white">OptiPlan Support</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Chat Flow container */}
            <div className="flex-1 relative overflow-hidden bg-zinc-900/50">
               <ChatWindow 
                  messages={messages} 
                  isTyping={isTyping}
                  className="!border-none !rounded-none" 
                  onSendMessage={handleSendMessage}
               />
            </div>

            {/* Quick Replies section at bottom */}
            <div className="p-3 bg-zinc-900 border-t border-white/10 shrink-0 flex flex-wrap gap-2">
              {quickReplies.map((featureName) => (
                <button
                  key={featureName}
                  onClick={() => handleQuickReply(featureName)}
                  disabled={isTyping}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  {featureName}
                </button>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-colors pointer-events-auto"
        aria-label="Toggle Chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Bot className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
