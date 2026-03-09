import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { generateNotes as generateNotesApi } from '@/services/studyhub-api';

export interface Note {
  id: string;
  notebook_id: string;
  content: string;
  model: string;
  created_at: string;
}

export function useNotes(notebookId: string | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!notebookId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('generated_notes')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setNotes(data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const generateNotes = useCallback(
    async () => {
      if (!notebookId) return;
      setGenerating(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');
        await generateNotesApi(notebookId, session.access_token);
        await fetchNotes();
      } catch (e: any) {
        setError(e.message);
      } finally {
        setGenerating(false);
      }
    },
    [notebookId, fetchNotes],
  );

  return { notes, loading, generating, error, generateNotes, refetch: fetchNotes };
}
