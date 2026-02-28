import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HoverTip } from '@/components/HoverTip';
import {
  FileText,
  Network,
  Layers,
  HelpCircle,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { StudyHubProvider } from '@/contexts/StudyHubContext';
import { NotebookSelector } from '@/components/studyhub/NotebookSelector';
import { PomodoroTimer } from '@/components/studyhub/PomodoroTimer';
import { SourcesTab } from '@/components/studyhub/SourcesTab';
import { MindMapTab } from '@/components/studyhub/MindMapTab';
import { GpaTab } from '@/components/studyhub/GpaTab';
import { FlashcardsTab } from '@/components/studyhub/FlashcardsTab';
import { QuizTab } from '@/components/studyhub/QuizTab';
import { NotesTab } from '@/components/studyhub/NotesTab';

// ── Tab Types ────────────────────────────────────────────────────────────────

type Tab = 'sources' | 'notes' | 'mindmap' | 'flashcards' | 'quiz' | 'gpa';

const TABS: { key: Tab; label: string; icon: typeof FileText; tip: string }[] = [
  { key: 'sources', label: 'Sources', icon: FileText, tip: 'Upload & view source documents' },
  { key: 'notes', label: 'Notes', icon: BookOpen, tip: 'AI-generated study notes' },
  { key: 'mindmap', label: 'Mind Map', icon: Network, tip: 'Knowledge graph visualization' },
  { key: 'flashcards', label: 'Flashcards', icon: Layers, tip: 'Review with flashcards' },
  { key: 'quiz', label: 'Quiz', icon: HelpCircle, tip: 'Test your knowledge' },
  { key: 'gpa', label: 'GPA', icon: TrendingUp, tip: 'Track your grades' },
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
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white">Study Hub</h1>
            <p className="text-xs text-gray-500 mt-0.5">AI-powered notes, flashcards & quizzes</p>
          </div>
          <PomodoroTimer />
        </div>

        {/* Tab navigation */}
        <div className="px-6 pt-4 shrink-0">
          <div className="flex overflow-x-auto whitespace-nowrap rounded-xl bg-white/5 p-1.5 w-fit">
            {TABS.map((tab) => (
              <HoverTip key={tab.key} label={tab.tip}>
                <button
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.key ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="studyTab"
                      className="absolute inset-0 bg-purple-500/20 border border-purple-500/30 rounded-lg"
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
        <div className="flex-1 overflow-y-auto px-6 py-6">
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
              {activeTab === 'gpa' && <GpaTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
