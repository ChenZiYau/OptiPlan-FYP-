import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Notebook } from '@/types/studyhub';

export function useNotebooks() {
  const { user } = useAuth();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotebooks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notebooks')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) setNotebooks(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  const createNotebook = useCallback(async (title: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('notebooks')
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (!error && data) {
      await fetchNotebooks();
      return data as Notebook;
    }
    return null;
  }, [user, fetchNotebooks]);

  const deleteNotebook = useCallback(async (id: string) => {
    const { error } = await supabase.from('notebooks').delete().eq('id', id);
    if (!error) await fetchNotebooks();
  }, [fetchNotebooks]);

  return { notebooks, loading, fetchNotebooks, createNotebook, deleteNotebook };
}
