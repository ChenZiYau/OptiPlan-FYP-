import { useState, useCallback, useEffect } from 'react';
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

  const fetchQuiz = useCallback(async () => {
    if (!notebookId || !session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('notebook_id', notebookId)
        .order('created_at', { ascending: true });

      if (fetchErr) throw fetchErr;
      setQuestions(data || []);
    } catch (err: any) {
      console.error('Failed to fetch quiz:', err);
      setError(err.message || 'Failed to fetch quiz');
    } finally {
      setLoading(false);
    }
  }, [notebookId, session?.access_token]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const generateQuiz = async () => {
    if (!notebookId || !session?.access_token) return;
    setGenerating(true);
    setError(null);
    try {
      const newQuiz = await apiGenerateQuiz(notebookId, session.access_token);
      setQuestions(newQuiz);
    } catch (err: any) {
      console.error('Failed to generate quiz:', err);
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  return { questions, loading, generating, error, generateQuiz };
}
