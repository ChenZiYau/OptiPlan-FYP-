import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';

export interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string | React.ReactNode;
}

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  className?: string;
  onSendMessage?: (text: string) => void;
}

export function ChatWindow({ messages, isTyping, className = '', onSendMessage }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className={`flex flex-col h-full bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-zinc-900/50">
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">OptiPlan AI</h3>
          <p className="text-xs text-zinc-400">Ask about our features</p>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex items-start gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {message.sender === 'bot' ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl max-w-[85%] text-sm bg-zinc-800 text-zinc-100 rounded-tl-sm">
                    {message.text}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl max-w-[85%] text-sm bg-indigo-600 text-white rounded-tr-sm">
                    {message.text}
                  </div>
                </>
              )}
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-zinc-800 rounded-tl-sm flex items-center gap-1">
                <motion.div
                  className="w-1.5 h-1.5 md:w-2 md:h-2 bg-zinc-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 md:w-2 md:h-2 bg-zinc-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-1.5 h-1.5 md:w-2 md:h-2 bg-zinc-400 rounded-full"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      {onSendMessage && (
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValue.trim() && !isTyping) {
              onSendMessage(inputValue.trim());
              setInputValue('');
            }
          }}
          className="p-3 border-t border-white/10 bg-zinc-900/50 shrink-0 flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            placeholder="Ask AI something..."
            className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 text-sm rounded-xl px-4 py-2 outline-none border border-transparent focus:border-indigo-500/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
