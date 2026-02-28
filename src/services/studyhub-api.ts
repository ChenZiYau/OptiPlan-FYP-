// ── StudyHub API Service ─────────────────────────────────────────────────────
// Fetch wrappers for the Express backend endpoints (api/server.ts)

import type {
  Citation,
  FlashcardData,
  MindMapNode,
  MindMapEdge,
  QuizQuestionData,
} from '@/types/studyhub';
import { supabase } from '@/lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ── Ingest (upload file → Supabase Storage → API extracts & chunks) ─────────

export interface IngestResponse {
  source_id: string;
  chunk_count: number;
}

export async function ingestFile(
  file: File,
  notebookId: string,
  token: string,
): Promise<IngestResponse> {
  // 1. Get current user ID for storage path
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 2. Upload file to Supabase Storage (bypasses Vercel's 4.5MB payload limit)
  const storagePath = `${user.id}/${notebookId}/${Date.now()}_${file.name}`;
  const { error: uploadErr } = await supabase.storage
    .from('study-sources')
    .upload(storagePath, file);

  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  // 3. Call API with just the storage path (tiny JSON payload)
  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      notebook_id: notebookId,
      storage_path: storagePath,
      filename: file.name,
    }),
  });

  if (!res.ok) {
    // Clean up the uploaded file on failure
    await supabase.storage.from('study-sources').remove([storagePath]);
    throw new Error(await res.text());
  }
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
  context?: string,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notebook_id: notebookId, message, ...(context ? { context } : {}) }),
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
