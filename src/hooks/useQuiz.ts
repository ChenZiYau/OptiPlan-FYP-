import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { generateQuiz as apiGenerateQuiz } from '@/services/studyhub-api';
import type { QuizQuestionData } from '@/types/studyhub';

export function useQuiz(notebookId: string | null) {
  const { session } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!notebookId || !session?.access_token) return;

    setLoading(true);
    setError(null);
    Promise.resolve(
      supabase
        .from('quiz_questions')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: true })
    ).then(({ data, error: fetchErr }) => {
      if (cancelled) return;
      if (fetchErr) throw fetchErr;
      setQuestions(data || []);
    }).catch((err: any) => {
      if (cancelled) return;
      setError(err.message || 'Failed to fetch quiz');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [notebookId, session?.access_token]);

  const generateQuiz = async () => {
    if (!notebookId || !session?.access_token) return;
    setGenerating(true);
    setError(null);
    try {
      const newQuiz = await apiGenerateQuiz(notebookId, session.access_token);
      if (mountedRef.current) setQuestions(newQuiz);
    } catch (err: any) {

      if (mountedRef.current) setError(err.message || 'Failed to generate quiz');
    } finally {
      if (mountedRef.current) setGenerating(false);
    }
  };

  return { questions, loading, generating, error, generateQuiz };
}
