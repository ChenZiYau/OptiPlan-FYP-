// ── StudyHub API Service ─────────────────────────────────────────────────────
// Fetch wrappers for the Express backend endpoints (api/server.ts)

import type {
  Citation,
  FlashcardData,
  MindMapNode,
  MindMapEdge,
  QuizQuestionData,
} from '@/types/studyhub';

const API_BASE = 'http://localhost:3001/api';

// ── Ingest (upload file → chunk → embed → store) ────────────────────────────

export interface IngestResponse {
  source_id: string;
  chunk_count: number;
}

export async function ingestFile(
  file: File,
  notebookId: string,
  token: string,
): Promise<IngestResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('notebook_id', notebookId);

  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── RAG Chat ─────────────────────────────────────────────────────────────────

export interface ChatResponse {
  reply: string;
  citations: Citation[];
}

export async function chatWithNotebook(
  notebookId: string,
  message: string,
  token: string,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notebook_id: notebookId, message }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Mind Map ─────────────────────────────────────────────────────────────────

export interface MindMapResponse {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export async function generateMindMap(
  notebookId: string,
  token: string,
): Promise<MindMapResponse> {
  const res = await fetch(`${API_BASE}/generate-mindmap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notebook_id: notebookId }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Flashcards ───────────────────────────────────────────────────────────────

export async function generateFlashcards(
  notebookId: string,
  token: string,
): Promise<FlashcardData[]> {
  const res = await fetch(`${API_BASE}/generate-flashcards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notebook_id: notebookId }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Notes ────────────────────────────────────────────────────────────────────

export interface GenerateNotesResponse {
  notes: string;
  metadata: { model: string; chunk_count: number };
}

export async function generateNotes(
  notebookId: string,
  token: string,
): Promise<GenerateNotesResponse> {
  const res = await fetch(`${API_BASE}/generate-notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notebook_id: notebookId }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

export async function generateQuiz(
  notebookId: string,
  token: string,
): Promise<QuizQuestionData[]> {
  const res = await fetch(`${API_BASE}/generate-quiz`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notebook_id: notebookId }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
