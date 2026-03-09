import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage as DbChatMessage } from '@/types/supabase';

export interface HistoryMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  componentType: string;
  createdAt: string;
}

function toHistoryMessage(row: DbChatMessage): HistoryMessage {
  return {
    id: row.id,
    sender: row.sender as 'bot' | 'user',
    text: row.text,
    componentType: row.component_type,
    createdAt: row.created_at,
  };
}

export function useChatHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setHistory((data ?? []).map(toHistoryMessage));
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveMessage = useCallback(
    async (sender: 'bot' | 'user', text: string, componentType = 'text') => {
      if (!user) return;
      try {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          sender,
          text,
          component_type: componentType,
        });
      } catch (err) {
        console.error('Failed to save chat message:', err);
      }
    },
    [user],
  );

  const clearHistory = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear chat history:', err);
    }
  }, [user]);

  return { history, loading, loadHistory, saveMessage, clearHistory };
}
