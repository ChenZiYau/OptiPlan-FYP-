import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { generateMindMap } from '@/services/studyhub-api';
import type { MindMapNode, MindMapEdge } from '@/types/studyhub';

interface MindMapState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export function useMindMap(notebookId: string | null) {
  const { session } = useAuth();
  const [data, setData] = useState<MindMapState | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load existing mind map from Supabase
  const fetchMindMap = useCallback(async () => {
    if (!notebookId) {
      setData(null);
      return;
    }
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('mind_maps')
      .select('graph_json')
      .eq('notebook_id', notebookId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && rows && rows.length > 0) {
      const g = rows[0].graph_json;
      setData({ nodes: g.nodes, edges: g.edges });
    } else {
      setData(null);
    }
    setLoading(false);
  }, [notebookId]);

  useEffect(() => {
    fetchMindMap();
  }, [fetchMindMap]);

  const generate = useCallback(async () => {
    if (!notebookId || !session?.access_token) return;
    setGenerating(true);
    try {
      const result = await generateMindMap(notebookId, session.access_token);
      setData({ nodes: result.nodes, edges: result.edges });
    } finally {
      setGenerating(false);
    }
  }, [notebookId, session]);

  return { data, loading, generating, generate, refetch: fetchMindMap };
}
