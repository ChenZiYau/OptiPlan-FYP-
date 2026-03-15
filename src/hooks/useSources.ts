import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ingestFile } from '@/services/studyhub-api';
import { toast } from 'sonner';
import type { Source } from '@/types/studyhub';

export function useSources(notebookId: string | null) {
  const { session } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchSources = useCallback(async () => {
    if (!notebookId) {
      setSources([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('sources')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      if (mountedRef.current) setSources(data || []);
    } catch (err: any) {

      if (mountedRef.current) setError(err.message || 'Failed to load sources');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    let cancelled = false;
    if (!notebookId) {
      setSources([]);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.resolve(
      supabase
        .from('sources')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false })
    ).then(({ data, error: fetchErr }) => {
      if (cancelled) return;
      if (fetchErr) throw fetchErr;
      setSources(data || []);
    }).catch((err: any) => {
      if (cancelled) return;
      setError(err.message || 'Failed to load sources');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [notebookId]);

  const uploadSource = useCallback(async (file: File) => {
    if (!notebookId || !session?.access_token) return null;
    setUploading(true);
    try {
      const result = await ingestFile(file, notebookId, session.access_token);
      if (mountedRef.current) await fetchSources();
      return result;
    } finally {
      if (mountedRef.current) setUploading(false);
    }
  }, [notebookId, session, fetchSources]);

  const deleteSource = useCallback(async (id: string) => {
    try {
      const { error: chunkErr } = await supabase.from('chunks').delete().eq('source_id', id);
      if (chunkErr) throw chunkErr;
      const { error: sourceErr } = await supabase.from('sources').delete().eq('id', id);
      if (sourceErr) throw sourceErr;
      if (mountedRef.current) await fetchSources();
    } catch (err: any) {

      if (mountedRef.current) {
        toast.error(err.message || 'Failed to delete source');
        await fetchSources(); // re-sync UI with actual DB state
      }
    }
  }, [fetchSources]);

  return { sources, loading, uploading, error, fetchSources, uploadSource, deleteSource };
}
