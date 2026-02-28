import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Brain, Loader2 } from 'lucide-react';
import { useStudyHub } from '@/contexts/StudyHubContext';
import { useFlashcards } from '@/hooks/useFlashcards';
import { HoverTip } from '@/components/HoverTip';
import { CitationBadge } from './CitationBadge';
import type { FlashcardData } from '@/types/studyhub';

export function FlashcardsTab() {
  const { activeNotebookId } = useStudyHub();
  const { flashcards, loading, generating, error, generateFlashcards, updateMastery } = useFlashcards(activeNotebookId);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showActions, setShowActions] = useState(false);

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

  if (flashcards.length === 0) {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center text-center">
        <Brain className="w-12 h-12 text-purple-500/50 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Flashcards Yet</h3>
        <p className="text-sm text-gray-400 max-w-sm mb-8">
          Generate AI-powered flashcards from your notebook sources using spaced repetition to maximize memory retention.
        </p>
        <button
          onClick={generateFlashcards}
          disabled={generating}
          className="px-6 py-3 text-sm font-semibold rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {generating ? 'Generating (Takes a moment)...' : 'Generate AI Flashcards'}
        </button>
        {error && <p className="text-xs text-red-400 mt-4">{error}</p>}
      </div>
    );
  }

  const card = flashcards[currentIndex];
  const masteredCount = flashcards.filter((c) => c.mastery_level === 'mastered').length;
  const progressPct = (masteredCount / flashcards.length) * 100;

  function handleFlip() {
    setFlipped(true);
    setShowActions(true);
  }

  function handleRate(level: FlashcardData['mastery_level']) {
    updateMastery(card.id, level);
    goNext();
  }

  function goNext() {
    setFlipped(false);
    setShowActions(false);
    setCurrentIndex((i) => (i + 1) % flashcards.length);
  }

  function goPrev() {
    setFlipped(false);
    setShowActions(false);
    setCurrentIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
  }

  return (
    <div className="space-y-8">
      {generating && (
        <div className="mb-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          <p className="text-sm text-purple-200">Generating new flashcards...</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Mastery Progress</span>
          <span className="text-sm font-semibold text-purple-400">{masteredCount}/{flashcards.length} cards mastered</span>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] text-gray-600 italic">
            AI-generated content may contain inaccuracies. Always verify with your original sources.
          </span>
          <button onClick={generateFlashcards} disabled={generating} className="text-xs text-gray-500 hover:text-white transition-colors underline decoration-white/20 underline-offset-2">
            Regenerate Flashcards
          </button>
        </div>
      </div>

      {/* 3D Flashcard */}
      <div className="flex flex-col items-center py-4">
        <div
          className="relative w-full max-w-2xl aspect-video cursor-pointer"
          style={{ perspective: '1200px' }}
          onClick={() => !flipped && handleFlip()}
        >
          <motion.div
            className="w-full h-full"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-2xl bg-[#18162e] border border-white/10 p-10 flex flex-col items-center justify-center text-center shadow-lg"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="absolute top-6 right-8 text-xs font-medium text-gray-500">
                Card {currentIndex + 1}/{flashcards.length}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-5">Question</span>
              <p className="text-xl sm:text-2xl font-semibold text-white leading-relaxed max-w-lg">{card?.front}</p>
              <p className="text-sm text-gray-600 mt-8">Click to reveal answer</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-2xl bg-[#18162e] border border-purple-500/20 p-10 flex flex-col shadow-lg"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-4 self-center">Answer</span>
              <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-center">
                <p className="text-base sm:text-lg text-gray-200 leading-relaxed max-w-xl text-center whitespace-pre-line mb-6">
                  {card?.back}
                </p>
                {card?.citation && (
                  <div className="mt-auto pt-4 flex justify-center w-full border-t border-white/5">
                    <CitationBadge
                      citation={{
                        chunk_id: card.source_chunk_id || 'unknown',
                        source_filename: 'Source Note',
                        excerpt: card.citation,
                        page_or_paragraph: null
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-5 mt-8 h-12">
          <HoverTip label="Previous card">
            <button
              onClick={goPrev}
              className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </HoverTip>

          <AnimatePresence mode="popLayout">
            {showActions ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={() => handleRate('new')}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  Need Review
                </button>
                <button
                  onClick={() => handleRate('learning')}
                  className="px-5 py-2.5 text-sm font-medium rounded-xl border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
                >
                  Almost
                </button>
                <button
                  onClick={() => handleRate('mastered')}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-green-500/80 hover:bg-green-500 text-white transition-colors"
                >
                  Got It
                </button>
              </motion.div>
            ) : (
              <motion.div key="empty" className="w-[300px]" />
            )}
          </AnimatePresence>

          <HoverTip label="Next card">
            <button
              onClick={goNext}
              className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </HoverTip>
        </div>

        {/* Current State Badge */}
        <div className="mt-8">
          <MasteryBadge level={card?.mastery_level || 'new'} />
        </div>
      </div>
    </div>
  );
}

function MasteryBadge({ level }: { level: FlashcardData['mastery_level'] }) {
  const config = {
    new: { label: 'New', color: 'text-gray-400 bg-white/5 border-white/10' },
    learning: { label: 'Learning', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
    mastered: { label: 'Mastered', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  }[level];
  return (
    <span className={`${config.color} px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full border`}>
      {config.label}
    </span>
  );
}
