import { useState, useRef, useCallback, useEffect } from 'react';
import { HoverTip } from '@/components/HoverTip';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  Link2,
  FileText,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Loader2,
  ChevronDown,
  Sparkles,
  BookOpen,
  Layers,
  HelpCircle,
  Target,
  Plus,
  Trash2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface StudyMaterial {
  id: string;
  subject: string;
  topic: string;
  rawContentUrl?: string;
  generatedNotes: string; // Markdown
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  masteryLevel: 'new' | 'learning' | 'mastered';
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // Length 4
  correctIndex: number;
  explanation: string;
}

// ── Data generated after upload ──────────────────────────────────────────────

const GENERATED_NOTES: StudyMaterial = {
  id: '1',
  subject: 'Calculus',
  topic: 'Limits & Continuity',
  generatedNotes: `## Limits & Continuity

### What is a Limit?
A **limit** describes the value that a function approaches as the input approaches some value. We write this as:

\`lim(x→a) f(x) = L\`

This means as *x* gets closer and closer to *a*, \`f(x)\` gets closer and closer to *L*.

### Key Properties
- **Sum Rule:** The limit of a sum equals the sum of the limits
- **Product Rule:** The limit of a product equals the product of the limits
- **Quotient Rule:** The limit of a quotient equals the quotient of the limits (if denominator ≠ 0)

### Continuity
A function *f* is **continuous** at point *a* if:
1. \`f(a)\` is defined
2. \`lim(x→a) f(x)\` exists
3. \`lim(x→a) f(x) = f(a)\`

### Types of Discontinuity
- **Removable** — a hole in the graph that can be "filled"
- **Jump** — the function jumps from one value to another
- **Infinite** — the function approaches ±∞ (vertical asymptote)

### Key Theorems
The **Intermediate Value Theorem** states that if *f* is continuous on [a, b] and *N* is between f(a) and f(b), then there exists at least one *c* in (a, b) such that f(c) = N.`,
};

const GENERATED_FLASHCARDS: Flashcard[] = [
  { id: '1', front: 'What is a limit in calculus?', back: 'A limit describes the value a function approaches as the input approaches some value. Written as lim(x→a) f(x) = L.', masteryLevel: 'new' },
  { id: '2', front: 'What are the 3 conditions for continuity?', back: '1) f(a) is defined\n2) lim(x→a) f(x) exists\n3) lim(x→a) f(x) = f(a)', masteryLevel: 'new' },
  { id: '3', front: 'What is a removable discontinuity?', back: 'A "hole" in the graph where the limit exists but the function value is either undefined or different from the limit. It can be "filled" by redefining f(a).', masteryLevel: 'new' },
  { id: '4', front: 'State the Intermediate Value Theorem', back: 'If f is continuous on [a, b] and N is between f(a) and f(b), then there exists at least one c in (a, b) such that f(c) = N.', masteryLevel: 'new' },
  { id: '5', front: 'What is the Sum Rule for limits?', back: 'The limit of a sum equals the sum of the limits: lim(x→a) [f(x) + g(x)] = lim(x→a) f(x) + lim(x→a) g(x).', masteryLevel: 'new' },
  { id: '6', front: 'What is an infinite discontinuity?', back: 'A discontinuity where the function approaches ±∞, creating a vertical asymptote in the graph.', masteryLevel: 'new' },
  { id: '7', front: 'What is a jump discontinuity?', back: 'A discontinuity where the left-hand limit and right-hand limit both exist but are not equal, causing the function to "jump" between values.', masteryLevel: 'new' },
  { id: '8', front: 'What is the Quotient Rule for limits?', back: 'lim(x→a) [f(x)/g(x)] = lim(x→a) f(x) / lim(x→a) g(x), provided the limit of the denominator is not zero.', masteryLevel: 'new' },
];

const GENERATED_QUIZ: QuizQuestion[] = [
  {
    id: '1',
    question: 'Which of the following is NOT a condition for a function to be continuous at a point a?',
    options: ['f(a) is defined', 'lim(x→a) f(x) exists', 'f\'(a) exists', 'lim(x→a) f(x) = f(a)'],
    correctIndex: 2,
    explanation: 'Continuity only requires that f(a) is defined, the limit exists, and they are equal. Differentiability (f\'(a) exists) is a stronger condition — a function can be continuous but not differentiable.',
  },
  {
    id: '2',
    question: 'What type of discontinuity can be "fixed" by redefining the function at a single point?',
    options: ['Jump discontinuity', 'Infinite discontinuity', 'Removable discontinuity', 'Essential discontinuity'],
    correctIndex: 2,
    explanation: 'A removable discontinuity is a "hole" in the graph. The limit exists at that point, so you can redefine f(a) = lim(x→a) f(x) to make the function continuous.',
  },
  {
    id: '3',
    question: 'According to the Intermediate Value Theorem, if f is continuous on [a, b], then:',
    options: [
      'f must have a maximum on [a, b]',
      'f takes every value between f(a) and f(b)',
      'f must be differentiable on (a, b)',
      'f must be bounded on [a, b]',
    ],
    correctIndex: 1,
    explanation: 'The IVT states that a continuous function on a closed interval takes on every value between f(a) and f(b). This is fundamental for proving the existence of roots.',
  },
  {
    id: '4',
    question: 'What does lim(x→a) f(x) = L mean?',
    options: [
      'f(a) = L',
      'f(x) equals L for all x near a',
      'f(x) can be made arbitrarily close to L by taking x sufficiently close to a',
      'f is continuous at a',
    ],
    correctIndex: 2,
    explanation: 'The formal (ε-δ) definition states that for every ε > 0, there exists a δ > 0 such that if 0 < |x − a| < δ, then |f(x) − L| < ε. In plain language: f(x) gets as close to L as we want when x is close enough to a.',
  },
  {
    id: '5',
    question: 'Which limit rule states: lim[f(x) · g(x)] = lim f(x) · lim g(x)?',
    options: ['Sum Rule', 'Product Rule', 'Chain Rule', 'Quotient Rule'],
    correctIndex: 1,
    explanation: 'The Product Rule for limits allows us to split the limit of a product into the product of the individual limits, provided both individual limits exist.',
  },
];

// ── Main Component ───────────────────────────────────────────────────────────

type Tab = 'notes' | 'flashcards' | 'quiz' | 'gpa';

export function StudyHubPage() {
  const [subject, setSubject] = useState('All Subjects');
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('notes');
  const [hasContent, setHasContent] = useState(false);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'notes', label: 'Notes & Import' },
    { key: 'flashcards', label: 'Flashcards' },
    { key: 'quiz', label: 'Practice Quiz' },
    { key: 'gpa', label: 'Grade Tracker' },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Study Hub</h1>
            <p className="text-sm text-gray-500 mt-1">AI-powered notes, flashcards & quizzes</p>
          </div>

          {/* Subject Dropdown */}
          <div className="relative">
            <HoverTip label="Filter by subject">
              <button
                onClick={() => setSubjectOpen(!subjectOpen)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
              >
                {subject}
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${subjectOpen ? 'rotate-180' : ''}`} />
              </button>
            </HoverTip>
            <AnimatePresence>
              {subjectOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute z-50 top-full left-0 mt-2 w-52 rounded-xl bg-[#1a1735] border border-white/10 py-1.5 shadow-2xl shadow-black/50"
                >
                  {['All Subjects', 'Calculus', 'Moral Education', 'Web Dev', 'Physics', 'Data Structures'].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSubject(s); setSubjectOpen(false); }}
                      className={`w-full text-left px-5 py-2.5 text-sm transition-colors ${
                        subject === s ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pomodoro Timer */}
        <PomodoroTimer />
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div className="flex rounded-xl bg-white/5 p-1.5 w-fit">
        {tabs.map((tab) => {
          const tipMap: Record<Tab, string> = { notes: 'AI-generated notes', flashcards: 'Review with flashcards', quiz: 'Test your knowledge', gpa: 'Track your GPA & grades' };
          return (
            <HoverTip key={tab.key} label={tipMap[tab.key]}>
              <button
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-6 py-2.5 text-sm font-medium rounded-lg capitalize transition-colors ${
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
                <span className="relative z-10">{tab.label}</span>
              </button>
            </HoverTip>
          );
        })}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'notes' && <NotesTab onContentGenerated={() => setHasContent(true)} />}
          {activeTab === 'flashcards' && (
            hasContent
              ? <FlashcardsTab />
              : <EmptyState
                  icon={Layers}
                  title="No flashcards yet"
                  description="Upload your study materials in the Notes & Import tab first. AI will generate flashcards from your content automatically."
                  actionLabel="Go to Notes & Import"
                  onAction={() => setActiveTab('notes')}
                />
          )}
          {activeTab === 'quiz' && (
            hasContent
              ? <QuizTab />
              : <EmptyState
                  icon={HelpCircle}
                  title="No quiz available"
                  description="Upload your study materials in the Notes & Import tab first. AI will generate practice questions from your content automatically."
                  actionLabel="Go to Notes & Import"
                  onAction={() => setActiveTab('notes')}
                />
          )}
          {activeTab === 'gpa' && <GpaTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-8">{description}</p>
      <button
        onClick={onAction}
        className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all"
      >
        <Upload className="w-4 h-4" />
        {actionLabel}
      </button>
    </div>
  );
}

// ── Pomodoro Timer ───────────────────────────────────────────────────────────

function PomodoroTimer() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, seconds]);

  useEffect(() => {
    if (seconds <= 0) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [seconds]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  function reset() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(25 * 60);
  }

  return (
    <div
      className={`flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-300 ${
        running
          ? 'bg-purple-900/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <span className="text-xl font-mono font-semibold text-white tabular-nums tracking-wider">
        {mins}:{secs}
      </span>
      <HoverTip label={running ? 'Pause timer' : 'Start timer'}>
        <button
          onClick={() => setRunning(!running)}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
          aria-label={running ? 'Pause' : 'Play'}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
      </HoverTip>
      <HoverTip label="Reset timer">
        <button
          onClick={reset}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </HoverTip>
    </div>
  );
}

// ── Tab 1: Notes & Import ────────────────────────────────────────────────────

function NotesTab({ onContentGenerated }: { onContentGenerated: () => void }) {
  const [stage, setStage] = useState<'upload' | 'processing' | 'done' | 'error'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [notesMetadata, setNotesMetadata] = useState<{ filename: string; extractedChars: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const lastFileRef = useRef<File | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    lastFileRef.current = file;
    setStage('processing');
    setErrorMessage('');

    // 60-second timeout to prevent indefinite hang
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/generate-notes', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Try to parse JSON response (even error responses have JSON bodies)
      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Server returned invalid response (status ${response.status})`);
      }

      if (!response.ok) {
        // Server returned an error with a proper JSON body
        throw new Error(data.error || data.details || `Server error (${response.status})`);
      }

      setGeneratedNotes(data.notes);
      setNotesMetadata(data.metadata);
      setStage('done');
      onContentGenerated();
      toast.success('Notes generated!', { description: `From ${data.metadata?.filename} via Groq ${data.metadata?.model ?? 'Llama 3'}` });
    } catch (err: any) {
      clearTimeout(timeout);
      console.error('[StudyHub] Upload error:', err);

      let msg: string;
      if (err.name === 'AbortError') {
        msg = 'Request timed out after 60 seconds. The file may be too large or the AI is under heavy load. Please try again.';
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        // Network-level failure: server not reachable
        msg = 'Cannot connect to the API server. Please make sure both Vite and the API server are running (npm run dev).';
      } else {
        msg = err.message || 'Failed to generate notes. Please try again.';
      }

      setErrorMessage(msg);
      setStage('error');
      toast.error('Note generation failed', { description: msg });
    }
  }, [onContentGenerated]);

  const handleRegenerate = useCallback(() => {
    if (lastFileRef.current) {
      handleUpload(lastFileRef.current);
    }
  }, [handleUpload]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  if (stage === 'processing') {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          <Loader2 className="absolute -top-1 -right-1 w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-base font-semibold text-white">Extracting text & generating notes via Groq...</p>
          <p className="text-sm text-gray-500">Using Llama 3 to synthesize structured study notes</p>
        </div>
        <div className="w-56 h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '90%' }}
            transition={{ duration: 15, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="rounded-xl bg-[#18162e] border border-red-500/20 p-16 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-red-900/20 border border-red-500/30 flex items-center justify-center">
          <X className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-base font-semibold text-white">Something went wrong</p>
          <p className="text-sm text-gray-500 max-w-md">{errorMessage}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStage('upload')}
            className="px-6 py-3 text-sm font-medium rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
          >
            Try Different File
          </button>
          {lastFileRef.current && (
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'done') {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-8">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-base font-semibold text-white">{notesMetadata?.filename ?? 'Generated Notes'}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {notesMetadata ? `${notesMetadata.extractedChars.toLocaleString()} characters extracted` : 'AI-generated from your upload'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast('PDF export coming soon!', { description: 'This feature is under development.' })}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Regenerate
            </button>
            <button
              onClick={() => { setStage('upload'); setGeneratedNotes(''); setNotesMetadata(null); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Upload className="w-4 h-4" /> New Upload
            </button>
          </div>
        </div>

        {/* Success banner */}
        <div className="bg-green-900/15 border border-green-500/20 rounded-xl p-4 mb-8 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400 shrink-0" />
          <p className="text-sm text-green-300">
            Notes generated via <span className="font-semibold text-green-400">Groq Llama 3</span>! <span className="text-green-400/70">Flashcards and Practice Quiz are now available in their tabs.</span>
          </p>
        </div>

        {/* Notes content — rendered with react-markdown */}
        <div className="prose prose-invert prose-base max-w-none prose-headings:text-white prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-400 prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-white prose-li:text-gray-400 prose-li:mb-1.5 prose-code:text-purple-300 prose-code:bg-purple-900/20 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-em:text-gray-300">
          <ReactMarkdown>{generatedNotes}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // Upload stage
  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-14 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-purple-500 bg-purple-500/5'
            : 'border-white/20 hover:border-purple-500/50 bg-[#18162e]'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.pptx,.ppt,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="w-16 h-16 rounded-2xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-5">
          <Upload className="w-8 h-8 text-purple-400" />
        </div>
        <p className="text-base font-semibold text-white mb-2">
          Drop your study materials here
        </p>
        <p className="text-sm text-gray-500 mb-1">
          PDF, PPTX, DOC — or click to browse
        </p>
        <p className="text-xs text-gray-600">
          Groq AI will generate structured notes from your content
        </p>
      </div>

      {/* URL input */}
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-6">
        <label className="text-sm text-gray-400 mb-3 block">
          Or paste a YouTube URL / Article Link
        </label>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full pl-11 pr-4 py-3 text-sm bg-[#0B0A1A] border border-white/10 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition"
            />
          </div>
          <button
            onClick={() => toast('URL import coming soon!', { description: 'File upload is available now.' })}
            disabled={!urlInput.trim()}
            className="px-6 py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}



// ── Tab 2: Flashcards ────────────────────────────────────────────────────────

function FlashcardsTab() {
  const [cards, setCards] = useState<Flashcard[]>(GENERATED_FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const card = cards[currentIndex];
  const mastered = cards.filter((c) => c.masteryLevel === 'mastered').length;

  function handleFlip() {
    setFlipped(true);
    setShowActions(true);
  }

  function handleRate(level: Flashcard['masteryLevel']) {
    setCards((prev) =>
      prev.map((c, i) => (i === currentIndex ? { ...c, masteryLevel: level } : c)),
    );
    goNext();
  }

  function goNext() {
    setFlipped(false);
    setShowActions(false);
    setCurrentIndex((i) => (i + 1) % cards.length);
  }

  function goPrev() {
    setFlipped(false);
    setShowActions(false);
    setCurrentIndex((i) => (i - 1 + cards.length) % cards.length);
  }

  const progressPct = cards.length > 0 ? (mastered / cards.length) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Mastery Progress</span>
          <span className="text-sm font-semibold text-purple-400">
            {mastered}/{cards.length} cards mastered
          </span>
        </div>
        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-green-500 rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Card */}
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
              className="absolute inset-0 rounded-2xl bg-[#18162e] border border-white/10 p-10 sm:p-12 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-5">
                Question · Card {currentIndex + 1}/{cards.length}
              </span>
              <p className="text-xl sm:text-2xl font-semibold text-white leading-relaxed max-w-lg">
                {card.front}
              </p>
              <p className="text-sm text-gray-600 mt-8">Click to reveal answer</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-2xl bg-[#18162e] border border-purple-500/20 p-10 sm:p-12 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-5">
                Answer
              </span>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-lg whitespace-pre-line">
                {card.back}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Navigation & SRS actions */}
        <div className="flex items-center gap-5 mt-8">
          <HoverTip label="Previous card">
            <button
              onClick={goPrev}
              className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Previous card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </HoverTip>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center gap-4"
              >
                <HoverTip label="Mark as needs review">
                  <button
                    onClick={() => handleRate('new')}
                    className="px-5 py-3 text-sm font-medium rounded-xl border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    Need Review
                  </button>
                </HoverTip>
                <HoverTip label="Mark as still learning">
                  <button
                    onClick={() => handleRate('learning')}
                    className="px-5 py-3 text-sm font-medium rounded-xl border border-yellow-500/30 text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
                  >
                    Almost
                  </button>
                </HoverTip>
                <HoverTip label="Mark as mastered">
                  <button
                    onClick={() => handleRate('mastered')}
                    className="px-5 py-3 text-sm font-semibold rounded-xl bg-green-500/80 hover:bg-green-500 text-white transition-colors"
                  >
                    Got It
                  </button>
                </HoverTip>
              </motion.div>
            )}
          </AnimatePresence>

          <HoverTip label="Next card">
            <button
              onClick={goNext}
              className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Next card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </HoverTip>
        </div>

        {/* Mastery indicator */}
        <div className="mt-5">
          <MasteryBadge level={card.masteryLevel} />
        </div>
      </div>
    </div>
  );
}

function MasteryBadge({ level }: { level: Flashcard['masteryLevel'] }) {
  const config = {
    new: { label: 'New', color: 'text-gray-400 bg-white/5 border-white/10' },
    learning: { label: 'Learning', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
    mastered: { label: 'Mastered', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  }[level];

  return (
    <span className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full border ${config.color}`}>
      {config.label}
    </span>
  );
}

// ── Tab 3: Practice Quiz ─────────────────────────────────────────────────────

function QuizTab() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = GENERATED_QUIZ[currentIndex];
  const isCorrect = selected === q.correctIndex;
  const answered = selected !== null;

  function handleSelect(i: number) {
    if (answered) return;
    setSelected(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  }

  function handleNext() {
    if (currentIndex + 1 >= GENERATED_QUIZ.length) {
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
    const pct = Math.round((score / GENERATED_QUIZ.length) * 100);
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-14 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-white">{pct}%</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">Quiz Complete!</h3>
          <p className="text-base text-gray-400 mb-2">
            You scored <span className="text-white font-semibold">{score}</span> out of{' '}
            <span className="text-white font-semibold">{GENERATED_QUIZ.length}</span>
          </p>
          <p className="text-sm text-gray-500 mb-8">
            {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort — review the tricky ones.' : 'Keep studying — you\'ll get there!'}
          </p>
          <button
            onClick={restart}
            className="px-8 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Question {currentIndex + 1} of {GENERATED_QUIZ.length}
        </span>
        <span className="text-sm font-semibold text-purple-400">
          Score: {score}/{currentIndex + (answered ? 1 : 0)}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          animate={{ width: `${((currentIndex + (answered ? 1 : 0)) / GENERATED_QUIZ.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-8">
        <p className="text-lg sm:text-xl font-semibold text-white leading-relaxed">
          {q.question}
        </p>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {q.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          let borderColor = 'border-white/10 hover:border-purple-500/50';
          let bg = 'bg-[#18162e]';
          let icon = null;

          if (answered) {
            if (i === q.correctIndex) {
              borderColor = 'border-green-500';
              bg = 'bg-green-500/10';
              icon = <Check className="w-5 h-5 text-green-400 shrink-0" />;
            } else if (i === selected) {
              borderColor = 'border-red-500';
              bg = 'bg-red-500/10';
              icon = <X className="w-5 h-5 text-red-400 shrink-0" />;
            } else {
              borderColor = 'border-white/5';
            }
          }

          return (
            <motion.button
              key={i}
              onClick={() => handleSelect(i)}
              whileTap={!answered ? { scale: 0.98 } : undefined}
              className={`${bg} border ${borderColor} rounded-xl p-5 text-left transition-all duration-200 ${
                answered ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    answered && i === q.correctIndex
                      ? 'bg-green-500/20 text-green-400'
                      : answered && i === selected
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-white/5 text-gray-500'
                  }`}
                >
                  {letter}
                </span>
                <span className={`text-sm leading-relaxed pt-1 ${answered && i !== q.correctIndex && i !== selected ? 'text-gray-600' : 'text-gray-300'}`}>
                  {opt}
                </span>
                {icon && <span className="ml-auto mt-1">{icon}</span>}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation + Next */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className={`p-6 rounded-xl ${isCorrect ? 'bg-green-900/20 border border-green-500/20' : 'bg-purple-900/20 border border-purple-500/20'}`}>
              <p className={`text-sm font-semibold mb-2 ${isCorrect ? 'text-green-400' : 'text-purple-400'}`}>
                {isCorrect ? 'Correct!' : 'Not quite — here\'s why:'}
              </p>
              <p className={`text-sm leading-relaxed ${isCorrect ? 'text-green-200/80' : 'text-purple-200/80'}`}>
                {q.explanation}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all"
              >
                {currentIndex + 1 >= GENERATED_QUIZ.length ? 'See Results' : 'Next Question'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── GPA & Grade Tracker ─────────────────────────────────────────────────────

/*
  Supabase TypeScript interfaces (for persistent storage):

  interface DbSubject {
    id: string;             // uuid, primary key
    user_id: string;        // references auth.users(id)
    name: string;
    target_grade: number;   // e.g. 90 for an A
    credit_hours: number;
    created_at: string;     // timestamptz
  }

  interface DbAssessment {
    id: string;             // uuid, primary key
    subject_id: string;     // references subjects(id) on delete cascade
    name: string;           // e.g. "Midterm"
    weight: number;         // percentage weight, e.g. 20
    score: number | null;   // percentage scored, null if upcoming
    created_at: string;     // timestamptz
  }
*/

interface GpaAssessment {
  id: string;
  name: string;
  weight: number;
  score: number;
}

interface GpaSubject {
  id: string;
  name: string;
  creditHours: number;
  targetGrade: number;
  assessments: GpaAssessment[];
}

// ── Grade math utility ──────────────────────────────────────────────────────

function calculateRequiredScore(assessments: GpaAssessment[], targetGrade: number) {
  const completedWeight = assessments.reduce((s, a) => s + a.weight, 0);
  const earnedPoints = assessments.reduce((s, a) => s + (a.score * a.weight) / 100, 0);
  const remainingWeight = 100 - completedWeight;

  if (remainingWeight <= 0) {
    const currentGrade = earnedPoints;
    return { currentGrade, remainingWeight: 0, requiredScore: null, impossible: currentGrade < targetGrade };
  }

  const pointsNeeded = targetGrade - earnedPoints;
  const requiredScore = (pointsNeeded / remainingWeight) * 100;
  const currentGrade = completedWeight > 0 ? (earnedPoints / completedWeight) * 100 : 0;

  return { currentGrade, remainingWeight, requiredScore, impossible: requiredScore > 100 };
}

function gradeFromPct(pct: number): string {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  return 'F';
}

function pctToGpa(pct: number): number {
  if (pct >= 93) return 4.0;
  if (pct >= 90) return 3.7;
  if (pct >= 87) return 3.3;
  if (pct >= 83) return 3.0;
  if (pct >= 80) return 2.7;
  if (pct >= 77) return 2.3;
  if (pct >= 73) return 2.0;
  if (pct >= 70) return 1.7;
  if (pct >= 67) return 1.3;
  if (pct >= 60) return 1.0;
  return 0.0;
}

const INITIAL_SUBJECTS: GpaSubject[] = [];

function GpaTab() {
  const [subjects, setSubjects] = useState<GpaSubject[]>(INITIAL_SUBJECTS);
  const [targetGpa, setTargetGpa] = useState('3.50');
  const [addingAssessmentFor, setAddingAssessmentFor] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [newScore, setNewScore] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCredits, setNewSubCredits] = useState('3');
  const [newSubTarget, setNewSubTarget] = useState('90');

  const totalCredits = subjects.reduce((s, sub) => s + sub.creditHours, 0);
  const weightedSum = subjects.reduce((s, sub) => {
    const calc = calculateRequiredScore(sub.assessments, sub.targetGrade);
    return s + pctToGpa(calc.currentGrade) * sub.creditHours;
  }, 0);
  const currentGpa = totalCredits > 0 ? weightedSum / totalCredits : 0;

  function addAssessment(subjectId: string) {
    const name = newName.trim();
    const weight = parseFloat(newWeight);
    const score = parseFloat(newScore);
    if (!name || isNaN(weight) || isNaN(score) || weight <= 0 || weight > 100 || score < 0 || score > 100) return;
    setSubjects(prev => prev.map(sub => {
      if (sub.id !== subjectId) return sub;
      return { ...sub, assessments: [...sub.assessments, { id: `a${Date.now()}`, name, weight, score }] };
    }));
    setAddingAssessmentFor(null);
    setNewName('');
    setNewWeight('');
    setNewScore('');
  }

  function removeAssessment(subjectId: string, assessmentId: string) {
    setSubjects(prev => prev.map(sub => {
      if (sub.id !== subjectId) return sub;
      return { ...sub, assessments: sub.assessments.filter(a => a.id !== assessmentId) };
    }));
  }

  function updateTargetGrade(subjectId: string, value: string) {
    const v = parseFloat(value);
    if (isNaN(v)) return;
    setSubjects(prev => prev.map(sub =>
      sub.id === subjectId ? { ...sub, targetGrade: Math.min(100, Math.max(0, v)) } : sub
    ));
  }

  function addSubject() {
    const name = newSubName.trim();
    if (!name) return;
    setSubjects(prev => [...prev, {
      id: `s${Date.now()}`,
      name,
      creditHours: parseInt(newSubCredits) || 3,
      targetGrade: parseInt(newSubTarget) || 90,
      assessments: [],
    }]);
    setNewSubName('');
    setNewSubCredits('3');
    setNewSubTarget('90');
    setShowAddSubject(false);
  }

  return (
    <div className="space-y-6">
      {/* Header with GPA overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{currentGpa.toFixed(2)}</span>
              <span className="text-sm text-gray-500">Current GPA</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{subjects.length} subjects &middot; {totalCredits} credit hours</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {subjects.length > 0 && (
            <HoverTip label="Add a new subject">
              <button onClick={() => setShowAddSubject(true)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 hover:bg-purple-500/30 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </button>
            </HoverTip>
          )}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Target GPA</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4"
              value={targetGpa}
              onChange={e => setTargetGpa(e.target.value)}
              className="w-16 bg-transparent text-white text-sm font-bold text-right outline-none border-b border-white/20 focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* GPA Progress Bar */}
      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>0.00</span>
          <span>GPA Progress</span>
          <span>4.00</span>
        </div>
        <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${(currentGpa / 4) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400"
            style={{ left: `${(parseFloat(targetGpa || '0') / 4) * 100}%` }}
            title={`Target: ${targetGpa}`}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px]">
          <span className="text-purple-400 font-semibold">Current: {currentGpa.toFixed(2)}</span>
          <span className={`font-semibold ${currentGpa >= parseFloat(targetGpa || '0') ? 'text-green-400' : 'text-amber-400'}`}>
            {currentGpa >= parseFloat(targetGpa || '0') ? 'On track!' : `Need +${(parseFloat(targetGpa || '0') - currentGpa).toFixed(2)} to reach target`}
          </span>
        </div>
      </div>

      {/* Subject Cards Grid */}
      {subjects.length === 0 ? (
        <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-center mb-5">
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No subjects added yet</h3>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-8">Start tracking your grades by adding your first subject!</p>
          <button
            onClick={() => setShowAddSubject(true)}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {subjects.map(sub => {
          const calc = calculateRequiredScore(sub.assessments, sub.targetGrade);
          const completedWeight = sub.assessments.reduce((s, a) => s + a.weight, 0);

          return (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{sub.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{sub.creditHours} credits &middot; {completedWeight}% graded</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{calc.currentGrade.toFixed(1)}%</div>
                  <div className="text-[11px] text-gray-500">{gradeFromPct(calc.currentGrade)}</div>
                </div>
              </div>

              {/* Weight Progress */}
              <div className="px-5 pt-3">
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${completedWeight}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1">{completedWeight}% of coursework completed</p>
              </div>

              {/* Assessments */}
              <div className="px-5 py-3 space-y-1.5">
                {sub.assessments.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 group">
                    <span className="text-xs text-gray-300">
                      {a.name} <span className="text-gray-600">({a.weight}%)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${a.score >= 90 ? 'text-green-400' : a.score >= 70 ? 'text-white' : 'text-amber-400'}`}>
                        {a.score}%
                      </span>
                      <HoverTip label="Delete assessment">
                        <button
                          onClick={() => removeAssessment(sub.id, a.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </HoverTip>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Assessment */}
              <div className="px-5 pb-3">
                <AnimatePresence>
                  {addingAssessmentFor === sub.id ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Assessment name"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <input
                          value={newWeight}
                          onChange={e => setNewWeight(e.target.value)}
                          placeholder="Weight %"
                          type="number"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                        />
                        <input
                          value={newScore}
                          onChange={e => setNewScore(e.target.value)}
                          placeholder="Score %"
                          type="number"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addAssessment(sub.id)}
                          className="flex-1 py-2 text-xs font-semibold rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingAssessmentFor(null)}
                          className="flex-1 py-2 text-xs rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <HoverTip label="Add a new assessment">
                      <button
                        onClick={() => setAddingAssessmentFor(sub.id)}
                        className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Assessment
                      </button>
                    </HoverTip>
                  )}
                </AnimatePresence>
              </div>

              {/* Target Grade */}
              <div className="px-5 pb-3 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[11px] text-gray-500">Class target:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={sub.targetGrade}
                  onChange={e => updateTargetGrade(sub.id, e.target.value)}
                  className="w-14 bg-transparent text-xs text-white font-semibold text-center outline-none border-b border-white/20 focus:border-purple-500 transition-colors"
                />
                <span className="text-[11px] text-gray-600">%</span>
              </div>

              {/* "What Do I Need?" Indicator */}
              <div className={`px-5 py-3 border-t ${calc.impossible ? 'border-red-500/20 bg-red-500/5' : 'border-purple-500/20 bg-purple-500/5'}`}>
                {calc.remainingWeight <= 0 ? (
                  <p className={`text-xs font-semibold ${calc.currentGrade >= sub.targetGrade ? 'text-green-400' : 'text-amber-400'}`}>
                    {calc.currentGrade >= sub.targetGrade
                      ? `All graded! Final grade: ${calc.currentGrade.toFixed(1)}% (${gradeFromPct(calc.currentGrade)}) — Target met!`
                      : `All graded. Final grade: ${calc.currentGrade.toFixed(1)}% (${gradeFromPct(calc.currentGrade)}) — Below target of ${sub.targetGrade}%.`}
                  </p>
                ) : calc.impossible ? (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">
                      <span className="font-semibold">Heads up:</span> Reaching {sub.targetGrade}% ({gradeFromPct(sub.targetGrade)}) would require{' '}
                      <span className="font-bold text-red-400">{calc.requiredScore!.toFixed(1)}%</span> on your remaining {calc.remainingWeight}% of coursework,
                      which exceeds 100%. Consider adjusting your target — you're still doing great!
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-purple-300">
                    To get {gradeFromPct(sub.targetGrade)} ({sub.targetGrade}%) in this class, you need at least{' '}
                    <span className="font-bold text-white">{calc.requiredScore!.toFixed(1)}%</span> on your remaining{' '}
                    <span className="font-semibold text-purple-200">{calc.remainingWeight}%</span> of coursework.
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      )}

      <AnimatePresence>
        {showAddSubject && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-xl bg-[#18162e] border border-white/10 p-5 space-y-3 overflow-hidden">
            <h4 className="text-sm font-semibold text-white">Add New Subject</h4>
            <input value={newSubName} onChange={e => setNewSubName(e.target.value)} placeholder="Subject name" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50" autoFocus />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Credit Hours</label>
                <input type="number" value={newSubCredits} onChange={e => setNewSubCredits(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Target Grade %</label>
                <input type="number" value={newSubTarget} onChange={e => setNewSubTarget(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addSubject} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors">Add</button>
              <button onClick={() => setShowAddSubject(false)} className="flex-1 py-2 text-sm rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
