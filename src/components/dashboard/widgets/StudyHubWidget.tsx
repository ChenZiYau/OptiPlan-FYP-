import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Layers, CheckCircle, FileText, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface StudyStats {
  notebooks: number;
  sources: number;
  flashcards: number;
  mastered: number;
  quizQuestions: number;
}

export function StudyHubWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudyStats>({ notebooks: 0, sources: 0, flashcards: 0, mastered: 0, quizQuestions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // Fetch user's notebook IDs first
        const { data: nbs } = await supabase
          .from('notebooks')
          .select('id')
          .eq('user_id', user.id);
        const nbIds = (nbs ?? []).map(n => n.id);

        if (nbIds.length === 0) {
          setStats({ notebooks: 0, sources: 0, flashcards: 0, mastered: 0, quizQuestions: 0 });
          setLoading(false);
          return;
        }

        // Parallel count queries
        const [srcRes, fcRes, masteredRes, qRes] = await Promise.all([
          supabase.from('sources').select('id', { count: 'exact', head: true }).in('notebook_id', nbIds),
          supabase.from('flashcards').select('id', { count: 'exact', head: true }).in('notebook_id', nbIds),
          supabase.from('flashcards').select('id', { count: 'exact', head: true }).in('notebook_id', nbIds).eq('mastery_level', 'mastered'),
          supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).in('notebook_id', nbIds),
        ]);

        setStats({
          notebooks: nbIds.length,
          sources: srcRes.count ?? 0,
          flashcards: fcRes.count ?? 0,
          mastered: masteredRes.count ?? 0,
          quizQuestions: qRes.count ?? 0,
        });
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const masteryPct = stats.flashcards > 0 ? Math.round((stats.mastered / stats.flashcards) * 100) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (masteryPct / 100) * circumference;

  return (
    <motion.div
      layout
      className="rounded-2xl bg-[#18162e] border border-white/10 p-5 hover:border-white/20 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Study Hub</h3>
        </div>
        <Link to="/dashboard/studyhub" className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors font-medium">
          Open →
        </Link>
      </div>

      {/* Mastery Ring + Stats */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-[88px] h-[88px] flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <motion.circle
              cx="44" cy="44" r={radius}
              fill="none"
              stroke="url(#mastery-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="mastery-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white">{loading ? '—' : `${masteryPct}%`}</span>
            <span className="text-[9px] text-gray-500">Mastery</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Layers className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-gray-300">
              <span className="font-semibold text-white">{loading ? '—' : stats.mastered}</span>
              <span className="text-gray-500">/{loading ? '—' : stats.flashcards}</span> cards mastered
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-3 h-3 text-green-400" />
            <span className="text-xs text-gray-300">
              <span className="font-semibold text-white">{loading ? '—' : stats.quizQuestions}</span> quiz questions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-gray-300">
              <span className="font-semibold text-white">{loading ? '—' : stats.sources}</span> sources in <span className="font-semibold text-white">{loading ? '—' : stats.notebooks}</span> notebooks
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/dashboard/studyhub"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" /> Flip Flashcards
        </Link>
        <Link
          to="/dashboard/studyhub"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-semibold hover:bg-green-500/20 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Practice Quiz
        </Link>
      </div>
    </motion.div>
  );
}
