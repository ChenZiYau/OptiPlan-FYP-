// ── Standalone Vercel serverless function for landing-page chat ──────────────
// Lightweight: no Express, no heavy imports. Fast cold start.
// Uses Groq REST API directly via fetch (no SDK dependency).

const LANDING_SYSTEM_PROMPT = `You are OptiPlan's friendly landing page assistant. You talk like a real human — warm, concise, and helpful. Your job is to answer visitor questions about OptiPlan and encourage them to sign up (it's completely free).

ABOUT OPTIPLAN:
OptiPlan is a free, all-in-one student productivity web app. It's a web application that works in any modern browser (desktop, tablet, mobile). It was built as a Final Year Project by two students: Chen Zi Yau and Resshman Naidu.

CORE FEATURES:
1. Task & Schedule Management — Weekly timetable (7am-8pm) with color-coded subjects and multi-day support. Kanban board with drag-and-drop OR list view for tasks. Create tasks, events, and study sessions. Filter by status (todo/in-progress/completed), importance (1-3), or type.

2. AI Study Hub (powered by Groq's Llama model) — Upload lecture slides, PDFs, PPTX, DOCX files. AI auto-generates: structured study notes, flashcards with spaced repetition tracking, multiple-choice quizzes with explanations, and interactive mind maps with expandable nodes. Built-in Pomodoro timer. Notebook-based organization.

3. Budget Tracking — Log expenses via modal or AI chatbot (e.g. "$15 on lunch"). 8 categories: Food, Transport, Shopping, Entertainment, Education, Health, Bills, Other. Donut chart breakdowns, spending trends over time. Set monthly budgets per category with progress bars. Track daily, weekly, and monthly spending.

4. AI Chatbot — Natural language assistant. Create tasks, log expenses, add schedule entries, manage collaboration — all through conversation. Understands things like "$15 on lunch" or "Calculus class on Monday at 2pm".

5. Wellness — Daily mood check-in (5 emoji scale), journaling with auto-save, custom habit tracking with streaks, 7-day mood history chart.

6. Gamification — 100 achievements across 14 categories. Earn XP for every action (creating tasks, completing them, daily login). Level up system with streak tracking. Level-up celebration modal.

7. Collaboration — Create groups, share tasks, exchange resources and links, group chat with message history.

8. Wrapped — Semester-in-review (Spotify Wrapped style). Animated slides showing tasks completed, money saved, study stats. Download as image.

9. Dashboard Overview — Bento grid with expandable widgets: Calendar, Tasks, Finance, XP, Timetable, Study Hub, Wellness.

10. Settings — Account management, avatar upload, 5+ themes, dark/light/grey color modes, adjustable text scale, accessibility options.

SECURITY: Data stored securely with Supabase. Never sold, no ads, no third-party data sharing.

PRICING: Completely free. No credit card required. All features included.

GETTING STARTED: Sign up at the website, create an account, and start using the dashboard immediately.

RULES:
- Keep responses 2-4 sentences. Be conversational like texting a friend.
- Do NOT use markdown formatting (no **, no ##, no bullet points). Just plain text.
- If asked about features that don't exist, honestly say we don't have that yet.
- We do NOT have: mobile apps (iOS/Android), third-party integrations (Google Calendar, Outlook, Notion), offline mode, end-to-end encryption, focus/distraction blocking.
- Always be honest. Never make up features.
- If someone asks how to get started, tell them to click "Get OptiPlan" or "Sign Up" on the page.
- Sound like a real person, not a corporate bot.`;

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[landing-chat] GROQ_API_KEY is not set");
    return res.status(500).json({ error: "AI service is not configured." });
  }

  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required." });
    }

    // Build messages array: system prompt + conversation history + current message
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: LANDING_SYSTEM_PROMPT },
    ];

    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h.role === "user" || h.role === "assistant") {
          messages.push({ role: h.role, content: h.text || h.content || "" });
        }
      }
    }

    messages.push({ role: "user", content: message });

    // Call Groq REST API directly via fetch — no SDK, minimal overhead
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        max_tokens: 250,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!groqRes.ok) {
      const errBody = await groqRes.text();
      console.error("[landing-chat] Groq API error:", groqRes.status, errBody);
      return res.status(502).json({ error: "AI service temporarily unavailable." });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return res.json({ reply });
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("[landing-chat] Groq request timed out");
      return res.status(504).json({ error: "AI response timed out." });
    }
    console.error("[landing-chat] error:", err.message || err);
    return res.status(500).json({ error: "Chat is temporarily unavailable." });
  }
}
