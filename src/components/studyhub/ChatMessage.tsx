import ReactMarkdown from 'react-markdown';
import { User, Bot } from 'lucide-react';
import { CitationBadge } from './CitationBadge';
import type { ChatMessageData } from '@/types/studyhub';

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-purple-500/20 text-purple-400'
          : 'bg-white/5 text-gray-400'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
        isUser
          ? 'bg-purple-500/15 border border-purple-500/20'
          : 'bg-white/[0.03] border border-white/10'
      }`}>
        {isUser ? (
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-2 prose-strong:text-white prose-li:text-gray-300 prose-code:text-purple-300 prose-code:bg-purple-900/20 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-headings:text-white prose-h2:text-base prose-h3:text-sm">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-2 border-t border-white/[0.06] flex flex-wrap gap-1.5">
            {/* Deduplicate by chunk_id */}
            {Array.from(
              new Map(message.citations.map(c => [c.chunk_id, c])).values()
            ).slice(0, 5).map((citation) => (
              <CitationBadge key={citation.chunk_id} citation={citation} />
            ))}
            {message.citations.length > 5 && (
              <span className="text-[11px] text-gray-500 self-center ml-1">
                +{message.citations.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
