import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, Loader2, Trash2, MessageSquare } from 'lucide-react';
import { useStudyHub } from '@/contexts/StudyHubContext';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { HoverTip } from '@/components/HoverTip';

export interface ChatPanelHandle {
  sendQuestion: (question: string, context?: string) => void;
}

export const ChatPanel = forwardRef<ChatPanelHandle>(function ChatPanel(_props, ref) {
  const { activeNotebookId } = useStudyHub();
  const { messages, loading, sending, sendMessage, clearMessages } = useChat(activeNotebookId);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    sendQuestion(question: string, context?: string) {
      if (!question.trim() || sending) return;
      sendMessage(question.trim(), context);
    },
  }), [sending, sendMessage]);

  // Auto-scroll to bottom on new messages — use scrollTop to avoid the
  // jump-to-top-then-smooth-scroll-down artifact that scrollIntoView causes.
  const prevMsgCountRef = useRef(messages.length);
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return;

    if (messages.length !== prevMsgCountRef.current) {
      // New message added — smooth scroll to bottom
      prevMsgCountRef.current = messages.length;
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [messages]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    sendMessage(input.trim());
    setInput('');
    // Re-focus the input
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  if (!activeNotebookId) {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-8 flex flex-col items-center justify-center text-center">
        <MessageSquare className="w-8 h-8 text-gray-600 mb-3" />
        <p className="text-sm text-gray-500">Select a notebook to start chatting</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#18162e] border border-white/10 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Chat with Sources</h3>
          <span className="text-[11px] text-gray-500">Gemini RAG</span>
        </div>
        {messages.length > 0 && (
          <HoverTip label="Clear chat history">
            <button
              onClick={clearMessages}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </HoverTip>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-sm text-gray-500 mb-1">Ask anything about your sources</p>
            <p className="text-xs text-gray-600">Answers are grounded in your uploaded documents with citations</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}

        {/* Sending indicator */}
        {sending && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-white/[0.06] shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your sources..."
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 resize-none transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
});
