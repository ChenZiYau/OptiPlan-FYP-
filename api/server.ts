console.log("[server] Module init: starting imports...");
import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";
console.log("[server] Module init: all imports loaded OK");

// NOTE: officeparser and @langchain/textsplitters are lazy-imported inside
// their respective functions to avoid crashing Vercel on module init.

// ── Load env (local dev only; Vercel injects env vars automatically) ──────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", ".env") });
config({ path: join(__dirname, "..", ".env.local"), override: true });

// ── Validate env on startup ─────────────────────────────────────────────────

if (!process.env.GROQ_API_KEY) {
  console.error(
    "GROQ_API_KEY is missing. Set it in .env (local) or Vercel environment variables.",
  );
  if (!process.env.VERCEL) process.exit(1);
}

// ── Express Setup ───────────────────────────────────────────────────────────

const app = express();
const PORT = 3001;

const isVercel = !!process.env.VERCEL;

app.use(cors({ origin: true }));
app.use(express.json({ limit: isVercel ? "4.5mb" : "100mb" }));

// ── Groq Client ─────────────────────────────────────────────────────────────

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Groq request timeout: 50s on Vercel (leaves 10s buffer within 60s maxDuration), 120s local
const GROQ_TIMEOUT = isVercel ? 50_000 : 120_000;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Extract text from a file buffer using officeparser v4 (supports PDF, PPTX, DOCX, PPT, DOC, RTF, ODT, ODP) */
async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop();
  const supported = ["pdf", "pptx", "docx", "ppt", "doc", "rtf", "odt", "odp"];

  if (!supported.includes(ext || "")) {
    throw new Error(`Unsupported file extension: .${ext}`);
  }

  try {
    console.log(`[extractText] Lazy-importing officeparser...`);
    const { parseOfficeAsync } = await import("officeparser");
    console.log(`[extractText] officeparser loaded, parsing ${ext}...`);

    // officeparser v4: parseOfficeAsync returns Promise<string>
    // tempFilesLocation needed on Vercel (read-only FS except /tmp)
    const text = await parseOfficeAsync(buffer, {
      tempFilesLocation: isVercel ? "/tmp" : undefined,
    });
    console.log(`[extractText] Parse complete, ${text.length} chars`);
    return text;
  } catch (parseError: any) {
    throw new Error(
      `Failed to parse ${ext?.toUpperCase()} file: ${parseError.message}`,
    );
  }
}

// ── Supabase (service role) ─────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://zgxmzpzuedqclfvphuqy.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneG16cHp1ZWRxY2xmdnBodXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2ODQ1NjAsImV4cCI6MjA4NzI2MDU2MH0.KN75oa81l0uSZEXcBT3INLqaSEi0nZmG2kzgevIdPLs";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.includes(
  "your_supabase",
)
  ? ANON_KEY
  : process.env.SUPABASE_SERVICE_ROLE_KEY || ANON_KEY;

function getSupabaseClient(req: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : undefined;

  return createClient(SUPABASE_URL, SERVICE_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  });
}

// ── Chunking Helper ────────────────────────────────────────────────────────

async function chunkText(text: string): Promise<string[]> {
  console.log(`[chunkText] Lazy-importing @langchain/textsplitters...`);
  const { RecursiveCharacterTextSplitter } = await import("@langchain/textsplitters");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await splitter.createDocuments([text]);
  return docs.map((d) => d.pageContent).filter((c) => c.length > 0);
}

// ── Health check ────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Route: POST /api/generate-notes ─────────────────────────────────────────

app.post("/api/generate-notes", async (req, res) => {
  try {
    const { notebook_id } = req.body;
    if (!notebook_id) {
      return res.status(400).json({ error: "notebook_id is required." });
    }

    console.log(`[notes] Generating for notebook ${notebook_id}`);

    // 1. Fetch all chunks for this notebook
    const { data: chunks, error: chunkErr } = await getSupabaseClient(req)
      .from("chunks")
      .select("content")
      .eq("notebook_id", notebook_id)
      .order("chunk_index", { ascending: true });

    if (chunkErr) {
      return res
        .status(500)
        .json({ error: `Failed to retrieve chunks: ${chunkErr.message}` });
    }

    if (!chunks || chunks.length === 0) {
      return res
        .status(400)
        .json({
          error:
            "No sources found in this notebook. Upload documents in the Sources tab first.",
        });
    }

    console.log(`[notes] Found ${chunks.length} chunks`);

    // 2. Build context from chunks
    const contextText = chunks
      .map((c: any, i: number) => `[Chunk ${i + 1}]\n${c.content}`)
      .join("\n\n---\n\n");

    // 3. Call Groq/Llama to generate notes
    // Truncate context to fit within 8k token window (~20k chars)
    const truncatedContext =
      contextText.length > 20000
        ? contextText.slice(0, 20000) +
          "\n\n[... remaining chunks truncated to fit context window ...]"
        : contextText;

    const notesPrompt = `You are an expert academic tutor and a master of aesthetic, highly-structured Markdown formatting. I will provide you with raw text chunks extracted from a student's study material (which might be messy, unstructured PPTX slides or PDFs).

Your task is to TRANSFORM and SYNTHESIZE this raw text into beautiful, engaging, and highly structured Markdown study notes. Do NOT simply repeat or echo the chunks — you must reorganize, deduplicate, and rewrite them into polished notes.

STRICT FORMATTING RULES:
1. **Title & Introduction**: Start with a single \`# \` Header for the main topic, followed by a brief, engaging introductory paragraph.
2. **Clean & Synthesize (CRITICAL)**: Slide extractions often repeat the slide title (e.g., "ISLAM ISLAM", "BUDDHISM BUDDHISM"). You MUST identify these repeated headers, remove the redundancy, and elegantly combine fragmented bullet points into cohesive paragraphs or structured lists under a single, unified section header.
3. **Visual Hierarchy**: Use \`## \` for main sections and \`### \` for subsections. Do NOT create repetitive headers of the same name.
4. **Key-Value Pairs**: For structured data (like dates, founders, specific terms), use bulleted bolded key-value pairs (e.g., \`- **Founded:** 6th Century BCE\`).
5. **Markdown Tables (CRITICAL)**: You MUST include at least 1-2 Markdown tables to compare entities, concepts, or summarize structured info. Make the tables detailed and neat.
6. **Formatting**: Liberally use **bold** for keywords, > blockquotes for important quotes or critical insights, and bullet points for lists. Ensure everything is neatly labelled.
7. **Content**: Base your notes ONLY on the provided text. Do not hallucinate outside information. If the text is empty or unreadable, reply stating that no valid content was found.`;

    let notes: string;
    try {
      const chatCompletion = await groq.chat.completions.create(
        {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: notesPrompt },
            {
              role: "user",
              content: `DOCUMENT CHUNKS:\n\n${truncatedContext}\n\nNow generate the structured Markdown study notes. Remember: SYNTHESIZE and RESTRUCTURE — do NOT just repeat the raw text.`,
            },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        },
        { timeout: GROQ_TIMEOUT },
      );
      notes = chatCompletion.choices?.[0]?.message?.content || "";
    } catch (groqErr: any) {
      console.error(`[notes] Groq error:`, groqErr.message);
      if (groqErr.status === 429) {
        return res
          .status(429)
          .json({
            error: "Rate limit reached. Please wait a moment and try again.",
          });
      }
      if (
        groqErr.name === "APIConnectionTimeoutError" ||
        groqErr.code === "ETIMEDOUT"
      ) {
        return res
          .status(504)
          .json({
            error:
              "AI generation timed out. Try uploading a smaller document or try again later.",
          });
      }
      return res
        .status(502)
        .json({ error: `Notes generation failed: ${groqErr.message}` });
    }

    if (!notes || notes.trim().length === 0) {
      return res
        .status(502)
        .json({ error: "AI returned an empty response. Please try again." });
    }

    console.log(`[notes] Generated ${notes.length} chars`);

    // 4. Persist to generated_notes
    const { error: insertErr } = await getSupabaseClient(req)
      .from("generated_notes")
      .insert({ notebook_id, content: notes, model: "llama-3.1-8b-instant" });

    if (insertErr) {
      console.error("[notes] Insert error:", insertErr.message);
    }

    // 5. Return
    return res.json({
      notes,
      metadata: { model: "llama-3.1-8b-instant", chunk_count: chunks.length },
    });
  } catch (err: any) {
    console.error("[notes] Unexpected error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Unexpected server error." });
  }
});

// ── Route: POST /api/ingest ─────────────────────────────────────────────────
// Frontend uploads file to Supabase Storage first, then calls this with the
// storage path. This bypasses Vercel's 4.5MB request body limit.

app.post("/api/ingest", async (req, res) => {
  const t0 = Date.now();
  try {
    const { notebook_id: notebookId, storage_path: storagePath, filename } = req.body;

    if (!notebookId) {
      return res.status(400).json({ error: "notebook_id is required." });
    }
    if (!storagePath || !filename) {
      return res.status(400).json({ error: "storage_path and filename are required." });
    }

    console.log(`[ingest] ① Request received: ${filename} (path: ${storagePath})`);

    // 1. Download file from Supabase Storage
    const supabaseClient = getSupabaseClient(req);
    const { data: fileData, error: downloadErr } = await supabaseClient
      .storage
      .from("study-sources")
      .download(storagePath);

    if (downloadErr || !fileData) {
      console.error(`[ingest] Storage download error:`, downloadErr);
      return res.status(404).json({
        error: `Failed to download file from storage: ${downloadErr?.message || "File not found"}`,
      });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const ext = filename.toLowerCase().split(".").pop() || "";
    console.log(`[ingest] ② File downloaded from storage: ${(buffer.length / 1024).toFixed(1)}KB (+${Date.now() - t0}ms)`);

    // 2. Extract text
    let rawText: string;
    try {
      console.log(`[ingest] ③ Starting text extraction...`);
      rawText = await extractText(buffer, filename);
    } catch (parseErr: any) {
      console.error(`[ingest] ③ Parse failed (+${Date.now() - t0}ms):`, parseErr.message);
      return res.status(422).json({ error: `Failed to parse file: ${parseErr.message}` });
    }

    const cleanText = rawText.replace(/\s+/g, " ").trim();
    if (!cleanText || cleanText.length < 30) {
      return res.status(422).json({ error: "File contains too little readable text." });
    }

    console.log(`[ingest] ④ Text extracted: ${cleanText.length} chars (+${Date.now() - t0}ms)`);

    // 3. Chunk
    const chunks = await chunkText(cleanText);
    console.log(`[ingest] ⑤ Chunked: ${chunks.length} chunks (+${Date.now() - t0}ms)`);

    // 4. Insert source row
    const { data: source, error: sourceErr } = await supabaseClient
      .from("sources")
      .insert({
        notebook_id: notebookId,
        filename,
        file_type: ext,
        raw_text: cleanText,
        char_count: cleanText.length,
      })
      .select("id")
      .single();

    if (sourceErr || !source) {
      console.error(`[ingest] ⑥ Source insert error:`, sourceErr);
      return res.status(500).json({ error: `Failed to save source: ${sourceErr?.message}` });
    }

    console.log(`[ingest] ⑥ Source row inserted: ${source.id} (+${Date.now() - t0}ms)`);

    // 5. Insert chunk rows (fts column auto-populated by DB trigger)
    const chunkRows = chunks.map((content, i) => ({
      source_id: source.id,
      notebook_id: notebookId,
      content,
      chunk_index: i,
    }));

    const { error: chunkErr } = await supabaseClient
      .from("chunks")
      .insert(chunkRows);

    if (chunkErr) {
      console.error(`[ingest] ⑦ Chunk insert error:`, chunkErr);
      return res.status(500).json({ error: `Failed to save chunks: ${chunkErr.message}` });
    }

    console.log(`[ingest] ⑦ ${chunks.length} chunks inserted (+${Date.now() - t0}ms)`);

    // 6. Clean up the storage file (text is extracted, no longer needed)
    await supabaseClient.storage.from("study-sources").remove([storagePath]);

    console.log(`[ingest] ⑧ Done! Total: ${Date.now() - t0}ms`);
    return res.json({ source_id: source.id, chunk_count: chunks.length });
  } catch (err: any) {
    console.error(`[ingest] FATAL (+${Date.now() - t0}ms):`, err);
    return res.status(500).json({ error: err.message || "Unexpected server error." });
  }
});

// ── Route: POST /api/chat (RAG) ─────────────────────────────────────────────

const RAG_SYSTEM_PROMPT = `You are a strict research assistant. Answer ONLY using the provided document context. If the answer is not in the text, say "I cannot answer this based on the provided documents."

CITATION RULES:
- After every claim or fact, append a citation in the format [Source: filename, p.X] where X is the page/paragraph info if available, otherwise just [Source: filename].
- Use the exact filenames provided in the context chunks.
- Do NOT invent information beyond what the chunks contain.
- Use Markdown formatting for readability.`;

const EXPLAIN_SYSTEM_PROMPT = `You are a knowledgeable academic tutor helping a student understand concepts from their study materials.

You are given:
1. A CONCEPT CONTEXT from the student's mind map (a brief summary of the topic).
2. DOCUMENT CHUNKS from the student's uploaded study materials for grounding.
3. A question from the student.

YOUR TASK:
- Use the concept context as a starting point to understand what the student is asking about.
- Ground your explanation in the document chunks where possible, citing sources as [Source: filename].
- If the document chunks don't fully cover the topic, you MAY supplement with your general knowledge to give a complete, helpful explanation — but clearly indicate when you're going beyond the documents.
- Be thorough but clear. Use examples, analogies, and structured formatting.
- Use Markdown formatting for readability (headers, bold, bullet points, etc.).`;

app.post("/api/chat", async (req, res) => {
  try {
    const { notebook_id, message, context } = req.body;
    if (!notebook_id || !message) {
      return res
        .status(400)
        .json({ error: "notebook_id and message are required." });
    }

    const hasNodeContext =
      typeof context === "string" && context.trim().length > 0;
    console.log(
      `[chat] Query for notebook ${notebook_id}${hasNodeContext ? " (with node context)" : ""}: "${message.slice(0, 80)}..."`,
    );

    // 1. Build full-text search query from user message
    const searchTerms = message
      .replace(/[^\w\s]/g, "") // strip punctuation
      .split(/\s+/) // split on whitespace
      .filter((w: string) => w.length > 2) // drop short words
      .slice(0, 12) // limit terms
      .join(" | "); // OR-based tsquery

    // 2. Retrieve top 8 chunks via full-text search
    let matchedChunks: any[] | null = null;
    let matchErr: any = null;

    if (searchTerms) {
      const result = await getSupabaseClient(req)
        .from("chunks")
        .select("id, content, source_id, chunk_index")
        .eq("notebook_id", notebook_id)
        .textSearch("fts", searchTerms, { type: "plain", config: "english" })
        .limit(8);
      matchedChunks = result.data;
      matchErr = result.error;
    }

    // Fallback: if FTS returns nothing, grab the first 8 chunks in order
    if (!matchedChunks || matchedChunks.length === 0) {
      const fallback = await getSupabaseClient(req)
        .from("chunks")
        .select("id, content, source_id, chunk_index")
        .eq("notebook_id", notebook_id)
        .order("chunk_index", { ascending: true })
        .limit(8);
      matchedChunks = fallback.data;
      matchErr = fallback.error;
    }

    if (matchErr) {
      console.error(`[chat] search error:`, matchErr);
      return res
        .status(500)
        .json({ error: `Retrieval failed: ${matchErr.message}` });
    }

    if (!matchedChunks || matchedChunks.length === 0) {
      // No chunks found — store messages and return a helpful response
      const noDocsReply =
        "I cannot answer this based on the provided documents. No relevant content was found in your uploaded sources. Please upload documents first.";

      await getSupabaseClient(req)
        .from("notebook_chat_messages")
        .insert([
          { notebook_id, role: "user", content: message, citations: null },
          {
            notebook_id,
            role: "assistant",
            content: noDocsReply,
            citations: null,
          },
        ]);

      return res.json({ reply: noDocsReply, citations: [] });
    }

    console.log(`[chat] Retrieved ${matchedChunks.length} chunks`);

    // 3. Look up source filenames for the matched chunks
    const sourceIds = [...new Set(matchedChunks.map((c: any) => c.source_id))];
    const { data: sources } = await getSupabaseClient(req)
      .from("sources")
      .select("id, filename")
      .in("id", sourceIds);

    const sourceMap = new Map(
      (sources || []).map((s: any) => [s.id, s.filename]),
    );

    // 4. Build context string for the prompt
    const contextBlocks = matchedChunks
      .map((chunk: any, i: number) => {
        const filename = sourceMap.get(chunk.source_id) || "unknown";
        const pageInfo = chunk.page_or_paragraph
          ? `, p.${chunk.page_or_paragraph}`
          : "";
        return `[Chunk ${i + 1} | Source: ${filename}${pageInfo}]\n${chunk.content}`;
      })
      .join("\n\n---\n\n");

    // 5. Build prompt — use explain prompt when node context is provided
    const systemPrompt = hasNodeContext
      ? EXPLAIN_SYSTEM_PROMPT
      : RAG_SYSTEM_PROMPT;
    const userPrompt = hasNodeContext
      ? `CONCEPT CONTEXT (from mind map):\n${context}\n\n---\n\nDOCUMENT CHUNKS:\n\n${contextBlocks}\n\n---\n\nSTUDENT QUESTION: ${message}`
      : `DOCUMENT CONTEXT:\n\n${contextBlocks}\n\n---\n\nUSER QUESTION: ${message}`;

    // 6. Call Groq for answer generation
    let aiReply: string;
    try {
      const chatCompletion = await groq.chat.completions.create(
        {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        },
        { timeout: GROQ_TIMEOUT },
      );
      aiReply = chatCompletion.choices?.[0]?.message?.content || "";
    } catch (groqErr: any) {
      console.error(`[chat] Groq error:`, groqErr.message);
      if (
        groqErr.name === "APIConnectionTimeoutError" ||
        groqErr.code === "ETIMEDOUT"
      ) {
        return res
          .status(504)
          .json({ error: "AI response timed out. Please try again." });
      }
      return res
        .status(502)
        .json({ error: `AI generation failed: ${groqErr.message}` });
    }

    if (!aiReply || aiReply.trim().length === 0) {
      return res.status(502).json({ error: "AI returned an empty response." });
    }

    console.log(`[chat] Groq returned ${aiReply.length} chars`);

    // 7. Build citations array from matched chunks
    const citations = matchedChunks.map((chunk: any) => ({
      chunk_id: chunk.id,
      source_filename: sourceMap.get(chunk.source_id) || "unknown",
      excerpt: chunk.content.slice(0, 200),
      page_or_paragraph: chunk.page_or_paragraph || null,
    }));

    // 8. Store messages in notebook_chat_messages
    await getSupabaseClient(req)
      .from("notebook_chat_messages")
      .insert([
        { notebook_id, role: "user", content: message, citations: null },
        { notebook_id, role: "assistant", content: aiReply, citations },
      ]);

    return res.json({ reply: aiReply, citations });
  } catch (err: any) {
    console.error("[chat] Unexpected error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Unexpected server error." });
  }
});

// ── Route: POST /api/generate-mindmap ────────────────────────────────────────

const MINDMAP_PROMPT = `You are an expert study-material analyst. You deeply READ and UNDERSTAND the full content of the document chunks, then produce a hierarchical mind map that serves as a COMPLETE STUDY TOOL — a student should be able to learn the entire subject just by reading your mind map nodes.

YOUR OUTPUT MUST EXACTLY match the structure, depth, and detail quality shown in the GOLD-STANDARD EXAMPLE below. Study it carefully before generating.

━━━ GOLD-STANDARD EXAMPLE (for a Moral Education document) ━━━
{
  "nodes": [
    {"id":"n1","label":"Moral Education","details":"A comprehensive study of ethical principles, moral reasoning frameworks, and character development that guide human behavior in society.","type":"root"},
    {"id":"n2","label":"Foundations of Morality","details":"Explores the origin and basis of moral values — where our sense of right and wrong comes from and how it is shaped by culture, religion, and philosophy.","type":"section"},
    {"id":"n3","label":"Moral Development Stages","details":"Lawrence Kohlberg's 3 levels: Pre-conventional (obedience & self-interest), Conventional (social conformity & law), Post-conventional (universal ethical principles). Each has 2 sub-stages.","type":"topic"},
    {"id":"n4","label":"Kohlberg Stage Examples","details":"Pre-conventional: a child avoids stealing only to avoid punishment. Conventional: a teenager follows rules to be seen as good. Post-conventional: an adult breaks an unjust law based on conscience.","type":"detail"},
    {"id":"n5","label":"Ethics vs Morals","details":"Ethics = systematic philosophical rules governing a profession or society. Morals = personal principles of right/wrong shaped by upbringing. Ethics are external standards; morals are internal beliefs.","type":"topic"},
    {"id":"n6","label":"Ethical Theories","details":"The major frameworks philosophers use to evaluate whether an action is right or wrong — consequentialism, deontology, and virtue ethics.","type":"section"},
    {"id":"n7","label":"Utilitarianism","details":"Actions are right if they produce the greatest happiness for the greatest number. Founded by Jeremy Bentham & John Stuart Mill. Judges actions solely by their outcomes/consequences.","type":"topic"},
    {"id":"n8","label":"Trolley Problem","details":"Classic dilemma: pull a lever to divert a trolley, killing 1 person to save 5. Utilitarians say pull it (net lives saved); deontologists may say killing is always wrong regardless of outcome.","type":"detail"},
    {"id":"n9","label":"Kantian Deontology","details":"Immanuel Kant's duty-based ethics: act only according to rules you could will to be universal laws. Never treat people merely as means to an end. Intentions matter more than outcomes.","type":"topic"},
    {"id":"n10","label":"Virtue Ethics","details":"Aristotle's approach: focus on developing good character traits (virtues) like courage, honesty, compassion. A moral person habitually acts virtuously, not just follows rules.","type":"topic"},
    {"id":"n11","label":"Character & Values","details":"How personal values, integrity, and character traits are formed and why they matter for ethical decision-making in daily life.","type":"section"},
    {"id":"n12","label":"Core Moral Values","details":"Honesty, responsibility, respect, fairness, compassion, and integrity. These universal values appear across cultures and religions as foundations of good character.","type":"topic"},
    {"id":"n13","label":"Integrity in Practice","details":"Integrity means consistency between beliefs and actions — doing the right thing even when nobody is watching. It is considered the cornerstone of trustworthy character.","type":"detail"}
  ],
  "edges": [
    {"source":"n1","target":"n2","label":""},
    {"source":"n1","target":"n6","label":""},
    {"source":"n1","target":"n11","label":""},
    {"source":"n2","target":"n3","label":""},
    {"source":"n2","target":"n5","label":""},
    {"source":"n3","target":"n4","label":""},
    {"source":"n6","target":"n7","label":""},
    {"source":"n6","target":"n9","label":""},
    {"source":"n6","target":"n10","label":""},
    {"source":"n7","target":"n8","label":""},
    {"source":"n11","target":"n12","label":""},
    {"source":"n12","target":"n13","label":""}
  ]
}
━━━ END EXAMPLE ━━━

STRUCTURE — strict parent→child tree, NO cross-links:
- Level 0 (exactly 1 node): Document's overall subject. type = "root"
- Level 1 (3-8 nodes): Major themes or sections. type = "section"
- Level 2 (2-5 per section): Key concepts within each section. type = "topic"
- Level 3 (0-3 per topic): Supporting details, examples, applications. type = "detail"

FIELD QUALITY REQUIREMENTS:
- "label": 2-6 word title. Concise but specific (e.g. "Kantian Deontology" not "Theory 2").
- "details": 1-3 sentences of REAL, information-dense study content:
  - Root: one-sentence overview of the entire document's scope.
  - Section: what this section covers and why it matters.
  - Topic: the ACTUAL definition, principle, formula, or explanation. Include names, dates, equations where relevant. A student reading only this field should understand the concept.
  - Detail: concrete examples, applications, comparisons, or mnemonics.
- "details" must NEVER be empty, vague, or generic. Every node must teach something specific.

RULES:
- Node IDs: unique (n1, n2, n3 ...)
- Every edge label must be ""
- Every node except root has exactly ONE parent (pure tree, no cycles)
- type must be one of: root, section, topic, detail
- Aim for 20-40 nodes — cover the FULL document, not just the first few chunks
- Base ONLY on the provided text — do not hallucinate
- If the document covers multiple distinct subjects, create a section for EACH one
- Match the tone, depth, and specificity of the example above

Respond with valid JSON only — no markdown, no explanation.`;

app.post("/api/generate-mindmap", async (req, res) => {
  try {
    const { notebook_id } = req.body;
    if (!notebook_id) {
      return res.status(400).json({ error: "notebook_id is required." });
    }

    console.log(`[mindmap] Generating for notebook ${notebook_id}`);

    // 1. Retrieve ALL chunks from this notebook (up to 60 for large docs)
    const { data: chunks, error: chunkErr } = await getSupabaseClient(req)
      .from("chunks")
      .select("content, source_id")
      .eq("notebook_id", notebook_id)
      .order("chunk_index", { ascending: true })
      .limit(60);

    if (chunkErr) {
      return res
        .status(500)
        .json({ error: `Failed to retrieve chunks: ${chunkErr.message}` });
    }

    if (!chunks || chunks.length === 0) {
      return res
        .status(400)
        .json({
          error: "No sources found in this notebook. Upload documents first.",
        });
    }

    // 2. Fetch source filenames so the model knows the document title
    const sourceIds = [...new Set(chunks.map((c: any) => c.source_id))];
    const { data: sources } = await getSupabaseClient(req)
      .from("sources")
      .select("id, filename")
      .in("id", sourceIds);
    const sourceMap = new Map(
      (sources || []).map((s: any) => [s.id, s.filename]),
    );
    const filenames = [...new Set(sourceMap.values())];

    // 3. Build context — include filenames and all chunks
    const headerInfo = `SOURCE FILES: ${filenames.join(", ")}`;
    const chunksText = chunks
      .map((c: any, i: number) => {
        const fname = sourceMap.get(c.source_id) || "unknown";
        return `[Chunk ${i + 1} | ${fname}]\n${c.content}`;
      })
      .join("\n\n");

    // Truncate to ~28k chars to stay within context window
    const contextText =
      chunksText.length > 28000
        ? chunksText.slice(0, 28000) +
          "\n\n[... remaining content truncated ...]"
        : chunksText;

    console.log(
      `[mindmap] Sending ${chunks.length} chunks (${contextText.length} chars) from: ${filenames.join(", ")}`,
    );

    // 4. Call Groq to build mind map tree
    // 70B model produces best results but is slow (~15-30s). On Vercel Hobby (10s limit)
    // this WILL timeout — Vercel Pro (60s limit) is required for mind map generation.
    const mindmapModel = isVercel
      ? "llama-3.1-8b-instant"
      : "llama-3.3-70b-versatile";
    let graphJson: { nodes: any[]; edges: any[] };
    try {
      const chatCompletion = await groq.chat.completions.create(
        {
          model: mindmapModel,
          messages: [
            { role: "system", content: MINDMAP_PROMPT },
            {
              role: "user",
              content: `${headerInfo}\n\nDOCUMENT CHUNKS:\n\n${contextText}`,
            },
          ],
          temperature: 0.2,
          max_tokens: isVercel ? 4096 : 8192,
          response_format: { type: "json_object" },
        },
        { timeout: GROQ_TIMEOUT },
      );

      const raw = chatCompletion.choices?.[0]?.message?.content || "{}";
      graphJson = JSON.parse(raw);

      if (!Array.isArray(graphJson.nodes) || !Array.isArray(graphJson.edges)) {
        throw new Error(
          "Invalid graph structure: missing nodes or edges array",
        );
      }

      // Normalize: ensure every node has a details field
      graphJson.nodes = graphJson.nodes.map((n: any) => ({
        id: n.id,
        label: n.label || "Untitled",
        details: n.details || "",
        type: n.type || "topic",
      }));
    } catch (genErr: any) {
      console.error(`[mindmap] Generation error:`, genErr.message);
      if (
        genErr.name === "APIConnectionTimeoutError" ||
        genErr.code === "ETIMEDOUT"
      ) {
        return res
          .status(504)
          .json({
            error:
              "Mind map generation timed out. This feature requires Vercel Pro plan (60s limit). Try regenerating or uploading a smaller document.",
          });
      }
      return res
        .status(502)
        .json({ error: `Mind map generation failed: ${genErr.message}` });
    }

    console.log(
      `[mindmap] Generated ${graphJson.nodes.length} nodes, ${graphJson.edges.length} edges`,
    );

    // 4. Store in mind_maps table (upsert — one mind map per notebook for now)
    // Delete existing mind map for this notebook first
    await getSupabaseClient(req)
      .from("mind_maps")
      .delete()
      .eq("notebook_id", notebook_id);

    const { data: mindMap, error: insertErr } = await getSupabaseClient(req)
      .from("mind_maps")
      .insert({ notebook_id, graph_json: graphJson })
      .select("id, graph_json, created_at")
      .single();

    if (insertErr) {
      console.error(`[mindmap] Insert error:`, insertErr);
      return res
        .status(500)
        .json({ error: `Failed to save mind map: ${insertErr.message}` });
    }

    return res.json({
      id: mindMap.id,
      nodes: graphJson.nodes,
      edges: graphJson.edges,
    });
  } catch (err: any) {
    console.error("[mindmap] Unexpected error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Unexpected server error." });
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

app.post("/api/generate-flashcards", async (req, res) => {
  try {
    const { notebook_id } = req.body;
    if (!notebook_id) {
      return res.status(400).json({ error: "notebook_id is required." });
    }

    console.log(`[flashcards] Generating for notebook ${notebook_id}`);

    const { data: chunks, error: chunkErr } = await getSupabaseClient(req)
      .from("chunks")
      .select("id, content")
      .eq("notebook_id", notebook_id)
      .order("chunk_index", { ascending: true })
      .limit(30);

    if (chunkErr) {
      return res
        .status(500)
        .json({ error: `Failed to retrieve chunks: ${chunkErr.message}` });
    }
    if (!chunks || chunks.length === 0) {
      return res
        .status(400)
        .json({
          error: "No sources found in this notebook. Upload documents first.",
        });
    }

    const contextText = chunks
      .map((c: any) => `[Chunk ID: ${c.id}]\n${c.content}`)
      .join("\n\n");

    let parsedJson: { flashcards: any[] };
    try {
      const chatCompletion = await groq.chat.completions.create(
        {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: FLASHCARDS_PROMPT },
            { role: "user", content: `DOCUMENT CHUNKS:\n\n${contextText}` },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        },
        { timeout: GROQ_TIMEOUT },
      );

      const raw = chatCompletion.choices?.[0]?.message?.content || "{}";
      parsedJson = JSON.parse(raw);

      if (!Array.isArray(parsedJson.flashcards)) {
        throw new Error("Invalid JSON structure: missing flashcards array");
      }
    } catch (genErr: any) {
      console.error(`[flashcards] Generation error:`, genErr.message);
      if (
        genErr.name === "APIConnectionTimeoutError" ||
        genErr.code === "ETIMEDOUT"
      ) {
        return res
          .status(504)
          .json({ error: "Flashcard generation timed out. Please try again." });
      }
      return res
        .status(502)
        .json({ error: `Flashcards generation failed: ${genErr.message}` });
    }

    console.log(
      `[flashcards] Generated ${parsedJson.flashcards.length} flashcards`,
    );

    // Delete existing flashcards for this notebook (simplifies sync for this phase)
    await getSupabaseClient(req)
      .from("flashcards")
      .delete()
      .eq("notebook_id", notebook_id);

    const flashcardRows = parsedJson.flashcards.map((f: any) => ({
      notebook_id,
      front: f.front || "Unknown Question",
      back: f.back || "Unknown Answer",
      citation: f.citation || null,
      source_chunk_id: chunks.find((c: any) => c.id === f.source_chunk_id)
        ? f.source_chunk_id
        : null,
      mastery_level: "new",
    }));

    if (flashcardRows.length > 0) {
      const { error: insertErr } = await getSupabaseClient(req)
        .from("flashcards")
        .insert(flashcardRows);
      if (insertErr) {
        console.error(`[flashcards] Insert error:`, insertErr);
        return res
          .status(500)
          .json({ error: `Failed to save flashcards: ${insertErr.message}` });
      }
    }

    const { data: savedCards } = await getSupabaseClient(req)
      .from("flashcards")
      .select("*")
      .eq("notebook_id", notebook_id)
      .order("created_at", { ascending: true });
    return res.json(savedCards || []);
  } catch (err: any) {
    console.error("[flashcards] Unexpected error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Unexpected server error." });
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

app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { notebook_id } = req.body;
    if (!notebook_id) {
      return res.status(400).json({ error: "notebook_id is required." });
    }

    console.log(`[quiz] Generating for notebook ${notebook_id}`);

    const { data: chunks, error: chunkErr } = await getSupabaseClient(req)
      .from("chunks")
      .select("id, content")
      .eq("notebook_id", notebook_id)
      .order("chunk_index", { ascending: true })
      .limit(30);

    if (chunkErr) {
      return res
        .status(500)
        .json({ error: `Failed to retrieve chunks: ${chunkErr.message}` });
    }
    if (!chunks || chunks.length === 0) {
      return res
        .status(400)
        .json({
          error: "No sources found in this notebook. Upload documents first.",
        });
    }

    const contextText = chunks
      .map((c: any) => `[Chunk ID: ${c.id}]\n${c.content}`)
      .join("\n\n");

    let parsedJson: { questions: any[] };
    try {
      const chatCompletion = await groq.chat.completions.create(
        {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: QUIZ_PROMPT },
            { role: "user", content: `DOCUMENT CHUNKS:\n\n${contextText}` },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        },
        { timeout: GROQ_TIMEOUT },
      );

      const raw = chatCompletion.choices?.[0]?.message?.content || "{}";
      parsedJson = JSON.parse(raw);

      if (!Array.isArray(parsedJson.questions)) {
        throw new Error("Invalid JSON structure: missing questions array");
      }
    } catch (genErr: any) {
      console.error(`[quiz] Generation error:`, genErr.message);
      if (
        genErr.name === "APIConnectionTimeoutError" ||
        genErr.code === "ETIMEDOUT"
      ) {
        return res
          .status(504)
          .json({ error: "Quiz generation timed out. Please try again." });
      }
      return res
        .status(502)
        .json({ error: `Quiz generation failed: ${genErr.message}` });
    }

    console.log(`[quiz] Generated ${parsedJson.questions.length} questions`);

    // Delete existing quiz for this notebook (simplifies sync for this phase)
    await getSupabaseClient(req)
      .from("quiz_questions")
      .delete()
      .eq("notebook_id", notebook_id);

    const quizRows = parsedJson.questions.map((q: any) => ({
      notebook_id,
      question: q.question || "Unknown Question",
      options:
        Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : ["A", "B", "C", "D"],
      correct_index:
        typeof q.correct_index === "number" &&
        q.correct_index >= 0 &&
        q.correct_index <= 3
          ? q.correct_index
          : 0,
      explanation: q.explanation || null,
      citation: q.citation || null,
      source_chunk_id: chunks.find((c: any) => c.id === q.source_chunk_id)
        ? q.source_chunk_id
        : null,
    }));

    if (quizRows.length > 0) {
      const { error: insertErr } = await getSupabaseClient(req)
        .from("quiz_questions")
        .insert(quizRows);
      if (insertErr) {
        console.error(`[quiz] Insert error:`, insertErr);
        return res
          .status(500)
          .json({ error: `Failed to save quiz: ${insertErr.message}` });
      }
    }

    const { data: savedQuiz } = await getSupabaseClient(req)
      .from("quiz_questions")
      .select("*")
      .eq("notebook_id", notebook_id)
      .order("created_at", { ascending: true });
    return res.json(savedQuiz || []);
  } catch (err: any) {
    console.error("[quiz] Unexpected error:", err);
    return res
      .status(500)
      .json({ error: err.message || "Unexpected server error." });
  }
});

// ── Export for Vercel serverless & start for local dev ───────────────────

export default app;

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n  Study Hub API running on http://localhost:${PORT}`);
    console.log(`  POST /api/generate-notes`);
    console.log(`  POST /api/ingest`);
    console.log(`  POST /api/chat`);
    console.log(`  POST /api/generate-mindmap`);
    console.log(`  POST /api/generate-flashcards`);
    console.log(`  POST /api/generate-quiz`);
    console.log(`  GET  /api/health\n`);
  });
}
