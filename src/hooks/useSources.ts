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

  const fetchSources = useCallback(async () => {
    if (!notebookId) {
      setSources([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('sources')
      .select('*')
      .eq('notebook_id', notebookId)
      .order('created_at', { ascending: false });

    if (!error && data) setSources(data);
    setLoading(false);
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
    await supabase.from('chunks').delete().eq('source_id', id);
    await supabase.from('sources').delete().eq('id', id);
    await fetchSources();
  }, [fetchSources]);

  return { sources, loading, uploading, fetchSources, uploadSource, deleteSource };
}
