import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ingestFile } from '@/services/studyhub-api';
import type { Source } from '@/types/studyhub';

export function useSources(notebookId: string | null) {
  const { session } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setSources(data || []);
    } catch (err: any) {
      console.error('Failed to fetch sources:', err);
      setError(err.message || 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const uploadSource = useCallback(async (file: File) => {
    if (!notebookId || !session?.access_token) return null;
    setUploading(true);
    try {
      const result = await ingestFile(file, notebookId, session.access_token);
      await fetchSources();
      return result;
    } finally {
      setUploading(false);
    }
  }, [notebookId, session, fetchSources]);

  const deleteSource = useCallback(async (id: string) => {
    try {
      const { error: chunkErr } = await supabase.from('chunks').delete().eq('source_id', id);
      if (chunkErr) throw chunkErr;
      const { error: sourceErr } = await supabase.from('sources').delete().eq('id', id);
      if (sourceErr) throw sourceErr;
      await fetchSources();
    } catch (err: any) {
      console.error('Failed to delete source:', err);
      setError(err.message || 'Failed to delete source');
      await fetchSources(); // re-sync UI with actual DB state
    }
  }, [fetchSources]);

  return { sources, loading, uploading, error, fetchSources, uploadSource, deleteSource };
}
