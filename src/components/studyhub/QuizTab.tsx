import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, X, HelpCircle } from 'lucide-react';
import { useStudyHub } from '@/contexts/StudyHubContext';
import { useQuiz } from '@/hooks/useQuiz';
import { CitationBadge } from './CitationBadge';

export function QuizTab() {
  const { activeNotebookId } = useStudyHub();
  const { questions, loading, generating, error, generateQuiz } = useQuiz(activeNotebookId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!activeNotebookId) {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-gray-500">Select or create a notebook to get started</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center text-center">
        <HelpCircle className="w-12 h-12 text-purple-500/50 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Quizzes Yet</h3>
        <p className="text-sm text-gray-400 max-w-sm mb-8">
          Generate multiple-choice quizzes automatically from your uploaded notes and test your knowledge.
        </p>
        <button
          onClick={generateQuiz}
          disabled={generating}
          className="px-6 py-3 text-sm font-semibold rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
          {generating ? 'Generating Quiz...' : 'Generate New Quiz'}
        </button>
        {error && <p className="text-xs text-red-400 mt-4">{error}</p>}
      </div>
    );
  }

  const q = questions[currentIndex];
  const isCorrect = selected === q?.correct_index;
  const answered = selected !== null;

  function handleSelect(i: number) {
    if (answered) return;
    setSelected(i);
    if (i === q.correct_index) setScore((s) => s + 1);
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setSelected(null);
    setCurrentIndex((i) => i + 1);
  }

  function restart() {
    setCurrentIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-14 text-center max-w-2xl mx-auto mt-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
        
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/20">
            <span className="text-3xl font-bold text-white">{pct}%</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Quiz Complete!</h3>
          <p className="text-base text-gray-300 mb-2">
            You scored <span className="text-white font-semibold">{score}</span> out of{' '}
            <span className="text-white font-semibold">{questions.length}</span>
          </p>
          <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
            {pct >= 80 ? 'Excellent work! You really understand this material.' : pct >= 60 ? 'Good effort — review the tricky questions.' : "Keep studying — you'll get there!"}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={restart}
              className="px-6 py-3 text-sm font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                restart();
                generateQuiz();
              }}
              disabled={generating}
              className="px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Another Quiz'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {generating && (
        <div className="mb-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          <p className="text-sm text-purple-200">Generating new quiz questions...</p>
        </div>
      )}

      {/* Progress & Score */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-sm font-semibold text-purple-400">
          Score: {score}/{currentIndex + (answered ? 1 : 0)}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          animate={{ width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question Card */}
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-8 shadow-sm">
        <p className="text-lg sm:text-xl font-semibold text-white leading-relaxed">{q?.question}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {q?.options?.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          let borderColor = 'border-white/10 hover:border-purple-500/50';
          let bg = 'bg-[#18162e]';
          let icon = null;

          if (answered) {
            if (i === q.correct_index) {
              borderColor = 'border-green-500/50';
              bg = 'bg-green-500/10';
              icon = <Check className="w-5 h-5 text-green-400 shrink-0" />;
            } else if (i === selected) {
              borderColor = 'border-red-500/50';
              bg = 'bg-red-500/10';
              icon = <X className="w-5 h-5 text-red-400 shrink-0" />;
            } else {
              borderColor = 'border-white/5 opacity-50';
              bg = 'bg-black/20 opacity-50';
            }
          }

          return (
            <motion.button
              key={i}
              onClick={() => handleSelect(i)}
              whileTap={!answered ? { scale: 0.99 } : undefined}
              className={`${bg} border ${borderColor} rounded-xl p-4 text-left transition-all duration-200 ${
                answered ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    answered && i === q.correct_index
                      ? 'bg-green-500/20 text-green-400'
                      : answered && i === selected
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {letter}
                </span>
                <span
                  className={`text-sm font-medium ${
                    answered && i !== q.correct_index && i !== selected ? 'text-gray-500' : 'text-gray-200'
                  }`}
                >
                  {opt}
                </span>
                {icon && <span className="ml-auto">{icon}</span>}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation Panel */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5 mt-6"
          >
            <div
              className={`p-6 rounded-xl ${
                isCorrect ? 'bg-green-900/20 border border-green-500/20' : 'bg-red-900/10 border border-red-500/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {isCorrect ? <Check className="w-5 h-5 text-green-400" /> : <X className="w-5 h-5 text-red-400" />}
                <p className={`text-sm font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {isCorrect ? 'Correct!' : "Incorrect — here's why:"}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-gray-300 mb-4">{q?.explanation}</p>
              
              {q?.citation && (
                <div className="border-t border-white/10 pt-4 mt-4 flex items-start gap-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap pt-1 flex items-center gap-1">
                    Source Evidence:
                  </span>
                  <CitationBadge
                    citation={{
                      chunk_id: q.source_chunk_id || 'unknown',
                      source_filename: 'Course Material',
                      excerpt: q.citation,
                      page_or_paragraph: null,
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-8 py-3 text-sm font-semibold rounded-xl bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20 transition-all"
              >
                {currentIndex + 1 >= questions.length ? 'View Final Results' : 'Next Question'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
