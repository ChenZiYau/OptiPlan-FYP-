import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Notebook } from '@/types/studyhub';

export function useNotebooks() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotebooks = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const { data, error: fetchErr } = await supabase
      .from('notebooks')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (fetchErr) {
      setError(fetchErr.message);
    } else if (data) {
      setNotebooks(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  const createNotebook = useCallback(async (title: string) => {
    if (!user) return null;
    const { data, error: createErr } = await supabase
      .from('notebooks')
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (createErr) {
      setError(createErr.message);
      return null;
    }
    if (data) {
      await fetchNotebooks();
      return data as Notebook;
    }
    return null;
  }, [user, fetchNotebooks]);

  const deleteNotebook = useCallback(async (id: string) => {
    const { error: deleteErr } = await supabase.from('notebooks').delete().eq('id', id);
    if (deleteErr) {
      setError(deleteErr.message);
    } else {
      await fetchNotebooks();
    }
  }, [fetchNotebooks]);

  return { notebooks, loading, error, fetchNotebooks, createNotebook, deleteNotebook };
}
