import { useState, useCallback, useEffect, useRef } from 'react';
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
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
      if (mountedRef.current) setFlashcards(data || []);
    } catch (err: any) {

      if (mountedRef.current) setError(err.message || 'Failed to fetch flashcards');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [notebookId, session?.access_token]);

  useEffect(() => {
    let cancelled = false;
    if (!notebookId || !session?.access_token) return;

    setLoading(true);
    setError(null);
    Promise.resolve(
      supabase
        .from('flashcards')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: true })
    ).then(({ data, error: fetchErr }) => {
      if (cancelled) return;
      if (fetchErr) throw fetchErr;
      setFlashcards(data || []);
    }).catch((err: any) => {
      if (cancelled) return;
      setError(err.message || 'Failed to fetch flashcards');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [notebookId, session?.access_token]);

  const generateFlashcards = async () => {
    if (!notebookId || !session?.access_token) return;
    setGenerating(true);
    setError(null);
    try {
      const newFlashcards = await apiGenerateFlashcards(notebookId, session.access_token);
      if (mountedRef.current) setFlashcards(newFlashcards);
    } catch (err: any) {

      if (mountedRef.current) setError(err.message || 'Failed to generate flashcards');
    } finally {
      if (mountedRef.current) setGenerating(false);
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

      // Revert on failure
      if (mountedRef.current) fetchFlashcards();
    }
  };

  return { flashcards, loading, generating, error, generateFlashcards, updateMastery };
}
