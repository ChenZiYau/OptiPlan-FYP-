import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HoverTip } from '@/components/HoverTip';
import {
  FileText,
  Network,
  Layers,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { StudyHubProvider } from '@/contexts/StudyHubContext';
import { NotebookSelector } from '@/components/studyhub/NotebookSelector';
import { PomodoroTimer } from '@/components/studyhub/PomodoroTimer';
import { SourcesTab } from '@/components/studyhub/SourcesTab';
import { MindMapTab } from '@/components/studyhub/MindMapTab';
import { FlashcardsTab } from '@/components/studyhub/FlashcardsTab';
import { QuizTab } from '@/components/studyhub/QuizTab';
import { NotesTab } from '@/components/studyhub/NotesTab';

// ── Tab Types ────────────────────────────────────────────────────────────────

type Tab = 'sources' | 'notes' | 'mindmap' | 'flashcards' | 'quiz';

const TABS: { key: Tab; label: string; icon: typeof FileText; tip: string }[] = [
  { key: 'sources', label: 'Sources', icon: FileText, tip: 'Upload & view source documents' },
  { key: 'notes', label: 'Notes', icon: BookOpen, tip: 'AI-generated study notes' },
  { key: 'mindmap', label: 'Mind Map', icon: Network, tip: 'Knowledge graph visualization' },
  { key: 'flashcards', label: 'Flashcards', icon: Layers, tip: 'Review with flashcards' },
  { key: 'quiz', label: 'Quiz', icon: HelpCircle, tip: 'Test your knowledge' },
];

// ── Main Export ──────────────────────────────────────────────────────────────

export function StudyHubPage() {
  return (
    <StudyHubProvider>
      <StudyHubInner />
    </StudyHubProvider>
  );
}

function StudyHubInner() {
  const [activeTab, setActiveTab] = useState<Tab>(() => (localStorage.getItem('studyhub-tab') as Tab) || 'sources');

  useEffect(() => {
    localStorage.setItem('studyhub-tab', activeTab);
  }, [activeTab]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <NotebookSelector />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#1F1F1F] flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Study Hub</h1>
            <p className="text-xs text-zinc-500 mt-0.5">AI-powered notes, flashcards & quizzes</p>
          </div>
          <PomodoroTimer />
        </div>

        {/* Tab navigation */}
        <div className="px-4 sm:px-6 pt-4 pb-2 shrink-0">
          <div className="flex overflow-x-auto whitespace-nowrap rounded-lg bg-[#111111] p-1 w-fit">
            {TABS.map((tab) => (
              <HoverTip key={tab.key} label={tab.tip}>
                <button
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    activeTab === tab.key ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="studyTab"
                      className="absolute inset-0 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon className="relative z-10 w-4 h-4" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              </HoverTip>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'sources' && <SourcesTab />}
              {activeTab === 'notes' && <NotesTab />}
              {activeTab === 'mindmap' && <MindMapTab />}
              {activeTab === 'flashcards' && <FlashcardsTab />}
              {activeTab === 'quiz' && <QuizTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
