import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { generateFlashcards as apiGenerateFlashcards } from '@/services/studyhub-api';
import type { FlashcardData } from '@/types/studyhub';

export function useFlashcards(notebookId: string | null) {
  const { session } = useAuth();
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlashcards = useCallback(async () => {
    if (!notebookId || !session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('flashcards')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: true });

      if (fetchErr) throw fetchErr;
      setFlashcards(data || []);
    } catch (err: any) {
      console.error('Failed to fetch flashcards:', err);
      setError(err.message || 'Failed to fetch flashcards');
    } finally {
      setLoading(false);
    }
  }, [notebookId, session?.access_token]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const generateFlashcards = async () => {
    if (!notebookId || !session?.access_token) return;
    setGenerating(true);
    setError(null);
    try {
      const newFlashcards = await apiGenerateFlashcards(notebookId, session.access_token);
      setFlashcards(newFlashcards);
    } catch (err: any) {
      console.error('Failed to generate flashcards:', err);
      setError(err.message || 'Failed to generate flashcards');
    } finally {
      setGenerating(false);
    }
  };

  const updateMastery = async (flashcardId: string, level: FlashcardData['mastery_level']) => {
    // Optimistic UI update
    setFlashcards((prev) =>
      prev.map((c) => (c.id === flashcardId ? { ...c, mastery_level: level } : c))
    );

    try {
      const { error: updateErr } = await supabase
        .from('flashcards')
        .update({ mastery_level: level })
        .eq('id', flashcardId);

      if (updateErr) throw updateErr;
    } catch (err: any) {
      console.error('Failed to update mastery:', err);
      // Revert on failure
      fetchFlashcards();
    }
  };

  return { flashcards, loading, generating, error, generateFlashcards, updateMastery };
}
