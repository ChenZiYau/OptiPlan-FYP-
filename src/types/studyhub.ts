// ── StudyHub Types (NotebookLM-style) ────────────────────────────────────────

export interface Notebook {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  notebook_id: string;
  filename: string;
  file_type: string;
  raw_text: string;
  char_count: number;
  created_at: string;
}

export interface Chunk {
  id: string;
  source_id: string;
  notebook_id: string;
  content: string;
  chunk_index: number;
  page_or_paragraph: string | null;
  embedding: number[] | null; // vector(768)
}

export interface Citation {
  chunk_id: string;
  source_filename: string;
  excerpt: string;
  page_or_paragraph: string | null;
}

export interface ChatMessageData {
  id: string;
  notebook_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[] | null;
  created_at: string;
}

export interface FlashcardData {
  id: string;
  notebook_id: string;
  front: string;
  back: string;
  citation: string | null;
  source_chunk_id: string | null;
  mastery_level: 'new' | 'learning' | 'mastered';
  next_review_at: string | null;
  created_at: string;
}

export interface QuizQuestionData {
  id: string;
  notebook_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  citation: string | null;
  source_chunk_id: string | null;
  created_at: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  type: string;
}

export interface MindMapEdge {
  source: string;
  target: string;
  label: string;
}

export interface MindMapData {
  id: string;
  notebook_id: string;
  graph_json: {
    nodes: MindMapNode[];
    edges: MindMapEdge[];
  };
  created_at: string;
}

export interface GeneratedNote {
  id: string;
  notebook_id: string;
  content: string;
  model: string;
  created_at: string;
}
