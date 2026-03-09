import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { chatWithNotebook } from '@/services/studyhub-api';
import type { ChatMessageData } from '@/types/studyhub';

export function useChat(notebookId: string | null) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing messages from Supabase
  const fetchMessages = useCallback(async () => {
    if (!notebookId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('notebook_chat_messages')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: true });

      if (fetchErr) throw fetchErr;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Failed to fetch chat messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Send a message and get AI response
  const sendMessage = useCallback(async (content: string, context?: string) => {
    if (!notebookId || !session?.access_token || !content.trim()) return;

    // Optimistically add user message
    const userMsg: ChatMessageData = {
      id: `temp-${Date.now()}`,
      notebook_id: notebookId,
      role: 'user',
      content: content.trim(),
      citations: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const response = await chatWithNotebook(notebookId, content.trim(), session.access_token, context);

      // Add assistant message
      const assistantMsg: ChatMessageData = {
        id: `temp-${Date.now() + 1}`,
        notebook_id: notebookId,
        role: 'assistant',
        content: response.reply,
        citations: response.citations,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Refetch to get real IDs from DB
      await fetchMessages();
    } catch (err: any) {
      // Add error message
      const errorMsg: ChatMessageData = {
        id: `error-${Date.now()}`,
        notebook_id: notebookId,
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to get response. Please try again.'}`,
        citations: null,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  }, [notebookId, session, fetchMessages]);

  const clearMessages = useCallback(async () => {
    if (!notebookId) return;
    try {
      const { error: deleteErr } = await supabase
        .from('notebook_chat_messages')
        .delete()
        .eq('notebook_id', notebookId);
      if (deleteErr) throw deleteErr;
      setMessages([]);
    } catch (err: any) {
      console.error('Failed to clear messages:', err);
      setError(err.message || 'Failed to clear messages');
    }
  }, [notebookId]);

  return { messages, loading, sending, error, sendMessage, clearMessages };
}
