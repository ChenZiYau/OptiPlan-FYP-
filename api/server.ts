import express from 'express';
import multer from 'multer';
import cors from 'cors';
import Groq from 'groq-sdk';
import { OfficeParser } from 'officeparser';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ── Load env ────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

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

const SYSTEM_PROMPT = `You are an expert academic tutor. I will provide you with raw text extracted from a student's study material. You must generate structured, easy-to-read Markdown notes, summarizing the key concepts, definitions, and main ideas.

FORMAT RULES:
- Use ## headers to organize by topic
- Use bullet points for key facts
- Use **bold** for important terms and definitions
- Keep explanations concise but clear
- Add a brief summary section at the end

CRITICAL: You MUST base your notes ONLY on the provided text. Do NOT invent, hallucinate, or pull in outside information. If the text is empty or unreadable, reply stating that no valid content was found.`;

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

// ── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  🚀 Study Hub API running on http://localhost:${PORT}`);
  console.log(`  📄 POST /api/generate-notes — Upload PDF/PPTX/DOCX → AI notes`);
  console.log(`  ❤️  GET  /api/health — Health check`);
  console.log(`  🔑 Groq API key: ${process.env.GROQ_API_KEY?.slice(0, 8)}...${process.env.GROQ_API_KEY?.slice(-4)}\n`);
});
