import express from 'express';
import multer from 'multer';
import cors from 'cors';
import Groq from 'groq-sdk';
import { OfficeParser } from 'officeparser';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// ── Load env ────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// ── Validate env on startup ─────────────────────────────────────────────────

if (!process.env.GROQ_API_KEY) {
  console.error('\n  ❌ GROQ_API_KEY is missing from .env file');
  console.error('  Create a .env file with: GROQ_API_KEY=gsk_your_key_here\n');
  process.exit(1);
}

// ── Express Setup ───────────────────────────────────────────────────────────

const app = express();
const PORT = 3001;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '20mb' }));

// Multer — in-memory storage, 15MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase().split('.').pop();
    const allowedExts = ['pdf', 'pptx', 'ppt', 'docx', 'doc'];
    if (allowedExts.includes(ext || '')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type ".${ext}". Accepted: PDF, PPTX, DOCX, PPT, DOC.`));
    }
  },
});

// ── Groq Client ─────────────────────────────────────────────────────────────

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an expert academic tutor and a master of aesthetic, highly-structured Markdown formatting. I will provide you with raw text extracted from a student's study material (which might be messy, unstructured PPTX slides or PDFs). 

Your task is to transform this raw text into beautiful, mathematically precise, engaging, and highly structured Markdown notes.

STRICT FORMATTING RULES:
1.  **Title & Introduction**: Start with a single \`# \` Header for the main topic, followed by a brief, engaging introductory paragraph.
2.  **Clean & Synthesize (CRITICAL)**: Slide extractions often repeat the slide title (e.g., "ISLAM ISLAM", "BUDDHISM BUDDHISM"). You MUST identify these repeated headers, remove the redundancy, and elegantly combine fragmented bullet points into cohesive paragraphs or structured lists under a single, unified section header.
3.  **Visual Hierarchy & Emojis**: Use \`## \` for main sections and \`### \` for subsections. Append relevant, aesthetic emojis to EVERY header (e.g., \`## Core Concepts 🧠\`, \`### Architecture 🏛️\`). Do NOT create repetitive headers of the same name.
4.  **Key-Value Pairs**: For structured data (like dates, founders, specific terms), use bulleted bolded key-value pairs (e.g., \`- **Founded:** 6th Century BCE\`).
5.  **Markdown Tables (CRITICAL)**: You MUST include at least 1-2 Markdown tables to compare entities, concepts, or summarize structured info (e.g. comparing religions, listing commandments). Make the tables detailed and neat.
6.  **Embedded Images**: You MUST include relevant, vibrant AI-generated images to break up the text and illustrate concepts. Use this precise image syntax:
    \`![Description](https://image.pollinations.ai/prompt/{URL_ENCODED_DETAILED_PROMPT}?width=800&height=400&nologo=true)\`
    (Replace {URL_ENCODED_DETAILED_PROMPT} with a detailed, URL-encoded English phrase describing the concept, e.g., 'beautiful%20ancient%20temple'). Include 2-4 images total throughout the notes.
7.  **Formatting**: Liberally use **bold** for keywords, > blockquotes for important quotes or critical insights, and \`code blocks\` if relevant. Ensure everything is neatly labelled.
8.  **Content**: Base your notes ONLY on the provided text. Do not hallucinate outside information. If the text is empty or unreadable, reply stating that no valid content was found.`;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Truncate text to fit within 8k token context window (rough: 1 token ≈ 4 chars) */
function truncateForContext(text: string, maxChars = 20000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[... content truncated to fit model context window ...]';
}

/** Extract text from a file buffer using officeparser (supports PDF, PPTX, DOCX, PPT, DOC, RTF) */
async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();
  const supported = ['pdf', 'pptx', 'docx', 'ppt', 'doc', 'rtf', 'odt', 'odp'];

  if (!supported.includes(ext || '')) {
    throw new Error(`Unsupported file extension: .${ext}`);
  }

  try {
    const ast = await OfficeParser.parseOffice(buffer);
    return ast.toText() || '';
  } catch (parseError: any) {
    throw new Error(`Failed to parse ${ext?.toUpperCase()} file: ${parseError.message}`);
  }
}

// ── Supabase (service role) ─────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zgxmzpzuedqclfvphuqy.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneG16cHp1ZWRxY2xmdnBodXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODQ1NjAsImV4cCI6MjA4NzI2MDU2MH0.KN75oa81l0uSZEXcBT3INLqaSEi0nZmG2kzgevIdPLs';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.includes('your_supabase') ? ANON_KEY : (process.env.SUPABASE_SERVICE_ROLE_KEY || ANON_KEY);

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

function getSupabaseClient(req: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : undefined;
  
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  });
}

// ── Gemini Models ──────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// ── Chunking & Embedding Helpers ───────────────────────────────────────────

function chunkText(text: string, maxLen = 500): string[] {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];

  for (const para of paragraphs) {
    if (para.length <= maxLen) {
      chunks.push(para.trim());
      continue;
    }
    // Split long paragraphs on sentence boundaries
    const sentences = para.split(/(?<=[.?!])\s+/);
    let current = '';
    for (const sentence of sentences) {
      if (current.length + sentence.length + 1 > maxLen && current.length > 0) {
        chunks.push(current.trim());
        current = '';
      }
      current += (current ? ' ' : '') + sentence;
    }
    if (current.trim()) {
      // Hard-split if a single sentence is still too long
      if (current.length > maxLen) {
        for (let i = 0; i < current.length; i += maxLen) {
          chunks.push(current.slice(i, i + maxLen).trim());
        }
      } else {
        chunks.push(current.trim());
      }
    }
  }

  return chunks.filter(c => c.length > 0);
}

async function embedChunks(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const chunk of chunks) {
    const result = await embeddingModel.embedContent(chunk);
    // Force 768 dimensions to match DB schema since gemini-embedding-001 returns 3072
    embeddings.push(result.embedding.values.slice(0, 768));
  }
  return embeddings;
}

// ── Health check ────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Route: POST /api/generate-notes ─────────────────────────────────────────

app.post('/api/generate-notes', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'File is too large. Maximum size is 15MB.',
          details: err.message,
        });
      }
      return res.status(400).json({
        error: err.message || 'File upload failed.',
        details: err.message,
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    // 1. Validate file exists
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please attach a PDF, PPTX, or DOCX file.',
        details: 'req.file is undefined',
      });
    }

    const { originalname, size } = req.file;
    console.log(`[api] 📄 Received: ${originalname} (${(size / 1024).toFixed(1)}KB)`);

    // 2. Extract text from document
    let rawText: string;
    try {
      rawText = await extractText(req.file.buffer, originalname);
    } catch (parseErr: any) {
      console.error(`[api] ❌ Parse error: ${parseErr.message}`);
      return res.status(422).json({
        error: `Failed to extract text from "${originalname}". The file may be corrupted, password-protected, or contain only images.`,
        details: parseErr.message,
      });
    }

    // 3. Validate extracted text has enough content
    const cleanText = rawText.replace(/\s+/g, ' ').trim();
    if (!cleanText || cleanText.length < 30) {
      return res.status(422).json({
        error: 'The uploaded file contains too little readable text. It may be image-based or empty.',
        details: `Extracted only ${cleanText.length} characters`,
      });
    }

    console.log(`[api] 📝 Extracted ${cleanText.length} chars from ${originalname}`);

    // 4. Truncate for context window
    const truncated = truncateForContext(cleanText);

    // 5. Call Groq API
    console.log(`[api] 🤖 Calling Groq (llama3-8b-8192)...`);

    let chatCompletion;
    try {
      chatCompletion = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Here is the raw text extracted from my study material "${originalname}":\n\n---\n${truncated}\n---\n\nPlease generate structured Markdown study notes from this content.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });
    } catch (groqErr: any) {
      console.error(`[api] ❌ Groq API error:`, groqErr.message);

      if (groqErr.status === 401) {
        return res.status(500).json({
          error: 'Invalid Groq API key. Please check your .env file.',
          details: 'Groq returned 401 Unauthorized',
        });
      }
      if (groqErr.status === 429) {
        return res.status(429).json({
          error: 'Groq rate limit reached. Please wait a moment and try again.',
          details: groqErr.message,
        });
      }
      if (groqErr.status === 413 || groqErr.message?.includes('too long')) {
        return res.status(422).json({
          error: 'Document text is too long for the model. Try a shorter document.',
          details: groqErr.message,
        });
      }

      return res.status(502).json({
        error: 'Groq AI service is temporarily unavailable. Please try again in a moment.',
        details: groqErr.message || 'Unknown Groq error',
      });
    }

    // 6. Validate Groq response
    const notes = chatCompletion.choices?.[0]?.message?.content;
    if (!notes || notes.trim().length === 0) {
      return res.status(502).json({
        error: 'Groq returned an empty response. Please try again.',
        details: 'choices[0].message.content was empty',
      });
    }

    console.log(`[api] ✅ Groq returned ${notes.length} chars of notes`);

    // 7. Return notes
    return res.json({
      notes,
      metadata: {
        filename: originalname,
        extractedChars: cleanText.length,
        truncated: cleanText.length > 20000,
        model: 'llama3-8b-8192',
      },
    });

  } catch (err: any) {
    // Catch-all: something completely unexpected
    console.error('[api] 💥 Unexpected error:', err);
    return res.status(500).json({
      error: 'An unexpected server error occurred. Please try again.',
      details: err.message || String(err),
    });
  }
});

// ── Route: POST /api/ingest ─────────────────────────────────────────────────

app.post('/api/ingest', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File is too large. Maximum size is 15MB.' });
      }
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const notebookId = req.body.notebook_id;
    if (!notebookId) {
      return res.status(400).json({ error: 'notebook_id is required.' });
    }

    const { originalname, size } = req.file;
    const ext = originalname.toLowerCase().split('.').pop() || '';
    console.log(`[ingest] Received: ${originalname} (${(size / 1024).toFixed(1)}KB)`);

    // 1. Extract text
    let rawText: string;
    try {
      rawText = await extractText(req.file.buffer, originalname);
    } catch (parseErr: any) {
      return res.status(422).json({ error: `Failed to parse file: ${parseErr.message}` });
    }

    const cleanText = rawText.replace(/\s+/g, ' ').trim();
    if (!cleanText || cleanText.length < 30) {
      return res.status(422).json({ error: 'File contains too little readable text.' });
    }

    console.log(`[ingest] Extracted ${cleanText.length} chars`);

    // 2. Chunk
    const chunks = chunkText(rawText);
    console.log(`[ingest] Split into ${chunks.length} chunks`);

    // 3. Embed
    let embeddings: number[][];
    try {
      embeddings = await embedChunks(chunks);
      console.log(`[ingest] Generated ${embeddings.length} embeddings`);
    } catch (embedErr: any) {
      console.error(`[ingest] Embedding error:`, embedErr.message);
      return res.status(502).json({ error: `Embedding failed: ${embedErr.message}` });
    }

    // 4. Insert source row
    const { data: source, error: sourceErr } = await getSupabaseClient(req)
      .from('sources')
      .insert({
        notebook_id: notebookId,
        filename: originalname,
        file_type: ext,
        raw_text: cleanText,
        char_count: cleanText.length,
      })
      .select('id')
      .single();

    if (sourceErr || !source) {
      console.error(`[ingest] Source insert error:`, sourceErr);
      return res.status(500).json({ error: `Failed to save source: ${sourceErr?.message}` });
    }

    // 5. Insert chunk rows
    const chunkRows = chunks.map((content, i) => ({
      source_id: source.id,
      notebook_id: notebookId,
      content,
      chunk_index: i,
      embedding: `[${embeddings[i].join(',')}]`,
    }));

    const { error: chunkErr } = await getSupabaseClient(req)
      .from('chunks')
      .insert(chunkRows);

    if (chunkErr) {
      console.error(`[ingest] Chunk insert error:`, chunkErr);
      return res.status(500).json({ error: `Failed to save chunks: ${chunkErr.message}` });
    }

    console.log(`[ingest] Stored source ${source.id} with ${chunks.length} chunks`);

    return res.json({ source_id: source.id, chunk_count: chunks.length });

  } catch (err: any) {
    console.error('[ingest] Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
});

// ── Route: POST /api/chat (RAG) ─────────────────────────────────────────────

const RAG_SYSTEM_PROMPT = `You are a strict research assistant. Answer ONLY using the provided document context. If the answer is not in the text, say "I cannot answer this based on the provided documents."

CITATION RULES:
- After every claim or fact, append a citation in the format [Source: filename, p.X] where X is the page/paragraph info if available, otherwise just [Source: filename].
- Use the exact filenames provided in the context chunks.
- Do NOT invent information beyond what the chunks contain.
- Use Markdown formatting for readability.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { notebook_id, message } = req.body;
    if (!notebook_id || !message) {
      return res.status(400).json({ error: 'notebook_id and message are required.' });
    }

    console.log(`[chat] Query for notebook ${notebook_id}: "${message.slice(0, 80)}..."`);

    // 1. Embed user query
    let queryEmbedding: number[];
    try {
      const result = await embeddingModel.embedContent(message);
      // Force 768 dimensions to match DB schema since gemini-embedding-001 returns 3072
      queryEmbedding = result.embedding.values.slice(0, 768);
    } catch (embedErr: any) {
      console.error(`[chat] Embedding error:`, embedErr.message);
      return res.status(502).json({ error: `Failed to embed query: ${embedErr.message}` });
    }

    // 2. Retrieve top 8 similar chunks via match_chunks RPC
    const { data: matchedChunks, error: matchErr } = await getSupabaseClient(req).rpc('match_chunks', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_notebook_id: notebook_id,
      match_count: 8,
    });

    if (matchErr) {
      console.error(`[chat] match_chunks error:`, matchErr);
      return res.status(500).json({ error: `Retrieval failed: ${matchErr.message}` });
    }

    if (!matchedChunks || matchedChunks.length === 0) {
      // No chunks found — store messages and return a helpful response
      const noDocsReply = 'I cannot answer this based on the provided documents. No relevant content was found in your uploaded sources. Please upload documents first.';

      await getSupabaseClient(req).from('notebook_chat_messages').insert([
        { notebook_id, role: 'user', content: message, citations: null },
        { notebook_id, role: 'assistant', content: noDocsReply, citations: null },
      ]);

      return res.json({ reply: noDocsReply, citations: [] });
    }

    console.log(`[chat] Retrieved ${matchedChunks.length} chunks`);

    // 3. Look up source filenames for the matched chunks
    const sourceIds = [...new Set(matchedChunks.map((c: any) => c.source_id))];
    const { data: sources } = await getSupabaseClient(req)
      .from('sources')
      .select('id, filename')
      .in('id', sourceIds);

    const sourceMap = new Map((sources || []).map((s: any) => [s.id, s.filename]));

    // 4. Build context string for the prompt
    const contextBlocks = matchedChunks.map((chunk: any, i: number) => {
      const filename = sourceMap.get(chunk.source_id) || 'unknown';
      const pageInfo = chunk.page_or_paragraph ? `, p.${chunk.page_or_paragraph}` : '';
      return `[Chunk ${i + 1} | Source: ${filename}${pageInfo}]\n${chunk.content}`;
    }).join('\n\n---\n\n');

    const userPrompt = `DOCUMENT CONTEXT:\n\n${contextBlocks}\n\n---\n\nUSER QUESTION: ${message}`;

    // 5. Call Gemini for answer generation
    let aiReply: string;
    try {
      const result = await chatModel.generateContent({
        contents: [
          { role: 'user', parts: [{ text: RAG_SYSTEM_PROMPT + '\n\n' + userPrompt }] },
        ],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      });
      aiReply = result.response.text();
    } catch (genErr: any) {
      console.error(`[chat] Gemini generation error:`, genErr.message);
      return res.status(502).json({ error: `AI generation failed: ${genErr.message}` });
    }

    if (!aiReply || aiReply.trim().length === 0) {
      return res.status(502).json({ error: 'Gemini returned an empty response.' });
    }

    console.log(`[chat] Gemini returned ${aiReply.length} chars`);

    // 6. Build citations array from matched chunks
    const citations = matchedChunks.map((chunk: any) => ({
      chunk_id: chunk.id,
      source_filename: sourceMap.get(chunk.source_id) || 'unknown',
      excerpt: chunk.content.slice(0, 200),
      page_or_paragraph: chunk.page_or_paragraph || null,
    }));

    // 7. Store messages in notebook_chat_messages
    await getSupabaseClient(req).from('notebook_chat_messages').insert([
      { notebook_id, role: 'user', content: message, citations: null },
      { notebook_id, role: 'assistant', content: aiReply, citations },
    ]);

    return res.json({ reply: aiReply, citations });

  } catch (err: any) {
    console.error('[chat] Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
});

// ── Route: POST /api/generate-mindmap ────────────────────────────────────────

const MINDMAP_PROMPT = `You are a knowledge graph extractor. Given the following document chunks, extract the key entities (concepts, terms, people, processes) and the relationships between them.

Return ONLY strict JSON with no markdown fencing, in this exact format:
{"nodes":[{"id":"n1","label":"Entity Name","type":"concept"}],"edges":[{"source":"n1","target":"n2","label":"relates to"}]}

RULES:
- Each node must have a unique id (n1, n2, ...), a short label, and a type (one of: concept, term, person, process, example)
- Each edge must reference existing node ids and have a descriptive label
- Aim for 8-20 nodes and meaningful connections
- Base ONLY on the provided text`;

app.post('/api/generate-mindmap', async (req, res) => {
  try {
    const { notebook_id } = req.body;
    if (!notebook_id) {
      return res.status(400).json({ error: 'notebook_id is required.' });
    }

    console.log(`[mindmap] Generating for notebook ${notebook_id}`);

    // 1. Retrieve top 20 chunks from this notebook
    const { data: chunks, error: chunkErr } = await getSupabaseClient(req)
      .from('chunks')
      .select('content, source_id')
      .eq('notebook_id', notebook_id)
      .order('chunk_index', { ascending: true })
      .limit(20);

    if (chunkErr) {
      return res.status(500).json({ error: `Failed to retrieve chunks: ${chunkErr.message}` });
    }

    if (!chunks || chunks.length === 0) {
      return res.status(400).json({ error: 'No sources found in this notebook. Upload documents first.' });
    }

    // 2. Build context from chunks
    const contextText = chunks.map((c: any, i: number) => `[Chunk ${i + 1}]\n${c.content}`).join('\n\n');

    // 3. Call Gemini to extract entities and relationships
    let graphJson: { nodes: any[]; edges: any[] };
    try {
      const result = await chatModel.generateContent({
        contents: [
          { role: 'user', parts: [{ text: MINDMAP_PROMPT + '\n\nDOCUMENT CHUNKS:\n\n' + contextText }] },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
      });

      const raw = result.response.text().trim();
      // Strip markdown code fences if present
      const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      graphJson = JSON.parse(jsonStr);

      if (!Array.isArray(graphJson.nodes) || !Array.isArray(graphJson.edges)) {
        throw new Error('Invalid graph structure: missing nodes or edges array');
      }
    } catch (genErr: any) {
      console.error(`[mindmap] Generation error:`, genErr.message);
      return res.status(502).json({ error: `Mind map generation failed: ${genErr.message}` });
    }

    console.log(`[mindmap] Generated ${graphJson.nodes.length} nodes, ${graphJson.edges.length} edges`);

    // 4. Store in mind_maps table (upsert — one mind map per notebook for now)
    // Delete existing mind map for this notebook first
    await getSupabaseClient(req).from('mind_maps').delete().eq('notebook_id', notebook_id);

    const { data: mindMap, error: insertErr } = await getSupabaseClient(req)
      .from('mind_maps')
      .insert({ notebook_id, graph_json: graphJson })
      .select('id, graph_json, created_at')
      .single();

    if (insertErr) {
      console.error(`[mindmap] Insert error:`, insertErr);
      return res.status(500).json({ error: `Failed to save mind map: ${insertErr.message}` });
    }

    return res.json({ id: mindMap.id, nodes: graphJson.nodes, edges: graphJson.edges });

  } catch (err: any) {
    console.error('[mindmap] Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
});

// ── Route: POST /api/generate-flashcards ──────────────────────────────────────

const FLASHCARDS_PROMPT = `You are an expert educator. Generate flashcards from the provided document chunks.

Return ONLY strict JSON with no markdown fencing, in this exact format:
{"flashcards": [{"front": "Question or concept?", "back": "Answer or definition.", "citation": "Short text excerpt proving the answer.", "source_chunk_id": "The Chunk ID provided in the text"}]}

RULES:
- Include 10-15 high-quality flashcards.
- Base questions ONLY on the provided document chunks.
- "source_chunk_id" MUST be the exact Chunk ID string provided above each chunk.
- Do NOT wrap in \`\`\`json blocks. Return raw JSON.`;

app.post('/api/generate-flashcards', async (req, res) => {
  try {
    const { notebook_id } = req.body;
    if (!notebook_id) {
      return res.status(400).json({ error: 'notebook_id is required.' });
    }

    console.log(`[flashcards] Generating for notebook ${notebook_id}`);

    const { data: chunks, error: chunkErr } = await getSupabaseClient(req)
      .from('chunks')
      .select('id, content')
      .eq('notebook_id', notebook_id)
      .order('chunk_index', { ascending: true })
      .limit(30);

    if (chunkErr) {
      return res.status(500).json({ error: `Failed to retrieve chunks: ${chunkErr.message}` });
    }
    if (!chunks || chunks.length === 0) {
      return res.status(400).json({ error: 'No sources found in this notebook. Upload documents first.' });
    }

    const contextText = chunks.map((c: any) => `[Chunk ID: ${c.id}]\n${c.content}`).join('\n\n');

    let parsedJson: { flashcards: any[] };
    try {
      const chatCompletion = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: FLASHCARDS_PROMPT },
          { role: 'user', content: `DOCUMENT CHUNKS:\n\n${contextText}` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const raw = chatCompletion.choices?.[0]?.message?.content || '{}';
      parsedJson = JSON.parse(raw);

      if (!Array.isArray(parsedJson.flashcards)) {
        throw new Error('Invalid JSON structure: missing flashcards array');
      }
    } catch (genErr: any) {
      console.error(`[flashcards] Generation error:`, genErr.message);
      return res.status(502).json({ error: `Flashcards generation failed: \${genErr.message}` });
    }

    console.log(`[flashcards] Generated \${parsedJson.flashcards.length} flashcards`);

    // Delete existing flashcards for this notebook (simplifies sync for this phase)
    await getSupabaseClient(req).from('flashcards').delete().eq('notebook_id', notebook_id);

    const flashcardRows = parsedJson.flashcards.map((f: any) => ({
      notebook_id,
      front: f.front || 'Unknown Question',
      back: f.back || 'Unknown Answer',
      citation: f.citation || null,
      source_chunk_id: chunks.find((c: any) => c.id === f.source_chunk_id) ? f.source_chunk_id : null,
      mastery_level: 'new',
    }));

    if (flashcardRows.length > 0) {
      const { error: insertErr } = await getSupabaseClient(req).from('flashcards').insert(flashcardRows);
      if (insertErr) {
        console.error(`[flashcards] Insert error:`, insertErr);
        return res.status(500).json({ error: `Failed to save flashcards: \${insertErr.message}` });
      }
    }

    const { data: savedCards } = await getSupabaseClient(req).from('flashcards').select('*').eq('notebook_id', notebook_id).order('created_at', { ascending: true });
    return res.json(savedCards || []);

  } catch (err: any) {
    console.error('[flashcards] Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
});

// ── Route: POST /api/generate-quiz ──────────────────────────────────────────

const QUIZ_PROMPT = `You are an expert educator. Generate a multiple-choice quiz from the provided document chunks.

Return ONLY strict JSON with no markdown fencing, in this exact format:
{"questions": [{"question": "Question text?", "options": ["Opt A", "Opt B", "Opt C", "Opt D"], "correct_index": 0, "explanation": "Why this is correct.", "citation": "Short text excerpt proving the answer.", "source_chunk_id": "The Chunk ID provided in the text"}]}

RULES:
- Include 5-10 high-quality questions.
- "options" MUST be an array of exactly 4 strings.
- "correct_index" MUST be an integer between 0 and 3.
- Base questions ONLY on the provided document chunks.
- "source_chunk_id" MUST be the exact Chunk ID string provided above each chunk.
- Do NOT wrap in \`\`\`json blocks. Return raw JSON.`;

app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { notebook_id } = req.body;
    if (!notebook_id) {
      return res.status(400).json({ error: 'notebook_id is required.' });
    }

    console.log(`[quiz] Generating for notebook ${notebook_id}`);

    const { data: chunks, error: chunkErr } = await getSupabaseClient(req)
      .from('chunks')
      .select('id, content')
      .eq('notebook_id', notebook_id)
      .order('chunk_index', { ascending: true })
      .limit(30);

    if (chunkErr) {
      return res.status(500).json({ error: `Failed to retrieve chunks: ${chunkErr.message}` });
    }
    if (!chunks || chunks.length === 0) {
      return res.status(400).json({ error: 'No sources found in this notebook. Upload documents first.' });
    }

    const contextText = chunks.map((c: any) => `[Chunk ID: ${c.id}]\n${c.content}`).join('\n\n');

    let parsedJson: { questions: any[] };
    try {
      const chatCompletion = await groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: QUIZ_PROMPT },
          { role: 'user', content: `DOCUMENT CHUNKS:\n\n${contextText}` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const raw = chatCompletion.choices?.[0]?.message?.content || '{}';
      parsedJson = JSON.parse(raw);

      if (!Array.isArray(parsedJson.questions)) {
        throw new Error('Invalid JSON structure: missing questions array');
      }
    } catch (genErr: any) {
      console.error(`[quiz] Generation error:`, genErr.message);
      return res.status(502).json({ error: `Quiz generation failed: \${genErr.message}` });
    }

    console.log(`[quiz] Generated \${parsedJson.questions.length} questions`);

    // Delete existing quiz for this notebook (simplifies sync for this phase)
    await getSupabaseClient(req).from('quiz_questions').delete().eq('notebook_id', notebook_id);

    const quizRows = parsedJson.questions.map((q: any) => ({
      notebook_id,
      question: q.question || 'Unknown Question',
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
      correct_index: typeof q.correct_index === 'number' && q.correct_index >= 0 && q.correct_index <= 3 ? q.correct_index : 0,
      explanation: q.explanation || null,
      citation: q.citation || null,
      source_chunk_id: chunks.find((c: any) => c.id === q.source_chunk_id) ? q.source_chunk_id : null,
    }));

    if (quizRows.length > 0) {
      const { error: insertErr } = await getSupabaseClient(req).from('quiz_questions').insert(quizRows);
      if (insertErr) {
        console.error(`[quiz] Insert error:`, insertErr);
        return res.status(500).json({ error: `Failed to save quiz: \${insertErr.message}` });
      }
    }

    const { data: savedQuiz } = await getSupabaseClient(req).from('quiz_questions').select('*').eq('notebook_id', notebook_id).order('created_at', { ascending: true });
    return res.json(savedQuiz || []);

  } catch (err: any) {
    console.error('[quiz] Unexpected error:', err);
    return res.status(500).json({ error: err.message || 'Unexpected server error.' });
  }
});

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\\n  🚀 Study Hub API running on http://localhost:\${PORT}`);
  console.log(`  📄 POST /api/generate-notes — Upload PDF/PPTX/DOCX → AI notes`);
  console.log(`  📥 POST /api/ingest        — Upload → chunk → embed → store`);
  console.log(`  💬 POST /api/chat          — RAG chat with citations`);
  console.log(`  🧠 POST /api/generate-mindmap — Knowledge graph from sources`);
  console.log(`  📇 POST /api/generate-flashcards — AI Flashcards from sources`);
  console.log(`  ❓ POST /api/generate-quiz — AI Quiz from sources`);
  console.log(`  ❤️  GET  /api/health — Health check\\n`);
});

