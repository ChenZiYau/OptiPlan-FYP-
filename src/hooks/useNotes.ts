import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { generateNotes as generateNotesApi } from '@/services/studyhub-api';
import { useRateLimit } from '@/hooks/useRateLimit';

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
  const mountedRef = useRef(true);
  const { rateLimitSeconds, isRateLimited, triggerRateLimit } = useRateLimit();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
      if (mountedRef.current) setNotes(data ?? []);
    } catch (e: any) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    let cancelled = false;
    if (!notebookId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.resolve(
      supabase
        .from('generated_notes')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false })
    ).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) throw err;
      setNotes(data ?? []);
    }).catch((e: any) => {
      if (!cancelled) setError(e.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [notebookId]);

  const generateNotes = useCallback(
    async () => {
      if (!notebookId) return;
      setGenerating(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');
        await generateNotesApi(notebookId, session.access_token);
        if (mountedRef.current) await fetchNotes();
      } catch (e: any) {
        if (mountedRef.current) {
          if (!triggerRateLimit(e)) {
            setError(e.message);
          }
        }
      } finally {
        if (mountedRef.current) setGenerating(false);
      }
    },
    [notebookId, fetchNotes, triggerRateLimit],
  );

  return { notes, loading, generating, error, generateNotes, refetch: fetchNotes, rateLimitSeconds, isRateLimited };
}
