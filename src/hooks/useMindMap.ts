import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { generateMindMap } from '@/services/studyhub-api';
import { useRateLimit } from '@/hooks/useRateLimit';
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
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const { rateLimitSeconds, isRateLimited, triggerRateLimit } = useRateLimit();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load existing mind map from Supabase
  const fetchMindMap = useCallback(async () => {
    if (!notebookId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: fetchErr } = await supabase
        .from('mind_maps')
        .select('graph_json')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchErr) throw fetchErr;
      if (!mountedRef.current) return;
      if (rows && rows.length > 0) {
        const g = rows[0].graph_json;
        setData({ nodes: g.nodes, edges: g.edges });
      } else {
        setData(null);
      }
    } catch (err: any) {

      if (mountedRef.current) {
        setError(err.message || 'Failed to load mind map');
        setData(null);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    let cancelled = false;
    if (!notebookId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.resolve(
      supabase
        .from('mind_maps')
        .select('graph_json')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: false })
        .limit(1)
    ).then(({ data: rows, error: fetchErr }) => {
      if (cancelled) return;
      if (fetchErr) throw fetchErr;
      if (rows && rows.length > 0) {
        const g = rows[0].graph_json;
        setData({ nodes: g.nodes, edges: g.edges });
      } else {
        setData(null);
      }
    }).catch((err: any) => {
      if (cancelled) return;
      setError(err.message || 'Failed to load mind map');
      setData(null);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [notebookId]);

  const generate = useCallback(async () => {
    if (!notebookId || !session?.access_token) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await generateMindMap(notebookId, session.access_token);
      if (mountedRef.current) setData({ nodes: result.nodes, edges: result.edges });
    } catch (err: any) {
      if (mountedRef.current) {
        if (!triggerRateLimit(err)) {
          setError(err.message || 'Failed to generate mind map');
        }
      }
    } finally {
      if (mountedRef.current) setGenerating(false);
    }
  }, [notebookId, session?.access_token, triggerRateLimit]);

  return { data, loading, generating, error, generate, refetch: fetchMindMap, rateLimitSeconds, isRateLimited };
}
