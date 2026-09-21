import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set("trust proxy", true);
app.use(express.json({ limit: "256kb" }));

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 25_000;
const MAX_MESSAGE_CHARS = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

// Best-effort in-memory rate limit. On serverless every instance keeps its own
// counter, so this blunts accidental hammering rather than enforcing a hard cap.
const rateBuckets = new Map<string, number[]>();

// ---------------------------------------------------------------------------
// Provider selection
//
// Gemini is the default. Set AI_PROVIDER=openai (or just provide an
// OPENAI_API_KEY) to talk to any OpenAI-compatible endpoint instead, including
// third-party gateways, via OPENAI_BASE_URL.
// ---------------------------------------------------------------------------

const AI_PROVIDER = (process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : "gemini")).toLowerCase();
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function getApiKey(): string | undefined {
  if (AI_PROVIDER === "openai") {
    return process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || undefined;
  }
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || undefined;
}

function activeModel(): string {
  return AI_PROVIDER === "openai" ? OPENAI_MODEL : MODEL;
}

/**
 * Google retires model ids for existing keys without warning, which silently
 * breaks the coach. Keep a fallback chain so a retired id self-heals.
 */
function modelCandidates(): string[] {
  if (AI_PROVIDER === "openai") return [OPENAI_MODEL];
  const configured = process.env.GEMINI_MODEL;
  return [...new Set([MODEL, configured, "gemini-flash-latest", "gemini-3.5-flash"].filter(Boolean) as string[])];
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateBuckets.set(key, hits);
  if (rateBuckets.size > 5000) rateBuckets.clear();
  return hits.length > RATE_LIMIT_MAX;
}

/**
 * The coaching prompt asks the model to reason inside <think> tags. That
 * reasoning must never reach the UI, so strip it before returning.
 */
function stripThoughts(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/i, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Method-aware coaching
// ---------------------------------------------------------------------------

const METHOD_GUIDES: Record<string, string> = {
  cbt: `Their active method is CBT. Work on the thought behind the urge, not just the feeling: help them name the automatic thought, spot the distortion (all-or-nothing, catastrophising, mind reading), and test it against evidence. Point them at their Thought Journal.`,
  act: `Their active method is ACT. Work on acceptance and urge surfing: normalise the discomfort, drop the struggle with it, and ride the wave while it peaks and falls. Point them at the Urge Surf timer. Prefer one concrete metaphor over several.`,
  mindfulness: `Their active method is Mindfulness. Work on grounding and present-moment awareness: a short breath anchor, a body scan, or 5-4-3-2-1. Instructions must be followable mid-urge, one step at a time. Point them at the Craving Bell and Reality Checks.`,
  mi: `Their active method is Motivational Interviewing. Evoke their own reasons to change: reflect the ambivalence without arguing, explore the pros and cons, and draw out their deeper "why". Point them at the Ambivalence Sheet. Never lecture or push.`,
  habit: `Their active method is Habit Replacement. Work the cue-routine-reward loop: find the cue, interrupt the routine, and swap in a competing behaviour with a similar reward. Point them at their Habit Loop map. Be specific about the replacement action.`,
};

// Declared once as plain JSON Schema, then adapted to each provider's format.
const TOOL_SPECS = [
  {
    name: "navigate_feature",
    description:
      'Opens a specific feature tab. Allowed tabs: "log", "inhaler_log", "analytics", "shop", "method", "goals", "tools", "home"',
    parameters: {
      type: "object",
      properties: {
        tabName: { type: "string" },
      },
      required: ["tabName"],
    },
  },
  {
    name: "log_craving_for_user",
    description:
      "Directly record a craving event into the database when the user explicitly says they are having a craving or just had one and want it recorded.",
    parameters: {
      type: "object",
      properties: {
        intensity: { type: "integer", description: "Subjective intensity 1-10" },
        trigger_category: { type: "string", description: "Main trigger (e.g., stress, boredom, social, morning)" },
        outcome: { type: "string", description: '"resisted" or "smoked"' },
        notes: { type: "string" },
      },
      required: ["intensity", "trigger_category", "outcome"],
    },
  },
  {
    name: "log_inhaler_for_user",
    description: "Record an inhaler usage event when the user explicitly says they used their inhaler.",
    parameters: {
      type: "object",
      properties: {
        intensityBefore: { type: "integer", description: "Craving intensity before using the inhaler, 1-10" },
        intensityAfter: { type: "integer", description: "Craving intensity after using the inhaler, 1-10" },
        notes: { type: "string" },
      },
      required: ["intensityBefore", "intensityAfter"],
    },
  },
  {
    name: "create_personal_mission",
    description: "Create a short personalised mission for the user, tied to their active method.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        targetCount: { type: "integer", description: "Number of times they need to do it to complete the mission" },
        relatedMethod: { type: "string", description: '"cbt", "act", "mindfulness", "mi", "habit", or "general"' },
      },
      required: ["title", "description", "targetCount", "relatedMethod"],
    },
  },
];

/** Gemini expects the Type enum ("OBJECT"), [OI] expects JSON Schema ("object"). */
function toGeminiSchema(schema: any): any {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (schema && typeof schema === "object") {
    const out: any = {};
    for (const [key, value] of Object.entries(schema)) {
      out[key] = key === "type" && typeof value === "string" ? value.toUpperCase() : toGeminiSchema(value);
    }
    return out;
  }
  return schema;
}

function geminiTools() {
  return TOOL_SPECS.map((spec) => ({
    name: spec.name,
    description: spec.description,
    parameters: toGeminiSchema(spec.parameters),
  }));
}

function openaiTools() {
  return TOOL_SPECS.map((spec) => ({
    type: "function",
    function: { name: spec.name, description: spec.description, parameters: spec.parameters },
  }));
}

// ---------------------------------------------------------------------------
// Request shaping
// ---------------------------------------------------------------------------

const VALID_METHODS = ["cbt", "act", "mindfulness", "mi", "habit", "None"];
const VALID_EMOTIONS = ["distressed", "motivated", "ambivalent", "neutral"];

function asString(value: unknown, fallback = "Unknown"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function buildContext(body: any) {
  const quitMethod = VALID_METHODS.includes(body.quitMethod) ? body.quitMethod : "None";
  const emotion = VALID_EMOTIONS.includes(body.emotion) ? body.emotion : "neutral";
  const primaryTriggers = Array.isArray(body.primaryTriggers)
    ? body.primaryTriggers.filter((t: unknown) => typeof t === "string").slice(0, 10)
    : [];

  return {
    messageText: body.messageText.trim(),
    recentHistory: typeof body.recentHistory === "string" ? body.recentHistory.slice(0, 4000) : "",
    methodEngagements: asNumber(body.methodEngagements),
    currentDay: asNumber(body.currentDay),
    primaryTriggers,
    resistanceRate: asNumber(body.resistanceRate),
    last7cravingsCount: asNumber(body.last7cravingsCount),
    topMood: asString(body.topMood),
    bhiProxy: asString(body.bhiProxy, "Moderate"),
    emotion,
    quitMethod,
    methodContext: typeof body.methodContext === "string" ? body.methodContext.slice(0, 1500) : "",
  };
}

type Ctx = ReturnType<typeof buildContext>;

function buildSystemInstruction(ctx: Ctx, language: string): string {
  return `
You are Breathe AI by Noconi, an empathetic, evidence-based smoking cessation coach who blends CBT, ACT, mindfulness, Motivational Interviewing and habit replacement.

Your persona: highly trained but conversational, warm, and interactive. You are supporting someone in the middle of a craving, so be calm and steady, never clinical or preachy.

Language: ${language === "id" ? "Respond ONLY in Indonesian (Bahasa Indonesia). Use friendly, natural, supportive Indonesian." : "Respond ONLY in English."}

Length: keep it SHORT. 2-3 sentences normally. If the user is mid-craving, give at most 3 short numbered steps they can follow right now. Never dump a list of techniques. Validate the feeling first, then give exactly one next action.

CRITICAL RESTRICTION: You MUST ONLY discuss topics related to smoking cessation, tobacco, vaping, habit replacement, the psychology of quitting, and health. If the user asks about anything else (coding, news, trivia), warmly decline and redirect to their quit goals.

TOOLS: Use log_craving_for_user when the user says they are having or just had a craving and it is worth recording. Use log_inhaler_for_user when they mention using their inhaler. Use create_personal_mission when a concrete follow-up task would help. Use navigate_feature when sending them somewhere in the app would help. Never claim you have saved something unless you actually called the tool.

Do NOT give medical advice or dosing guidance.

--- LIVE CONTEXT INJECTION TARGET ---
Active Quit Method: ${ctx.quitMethod}. Method Engagement: ${ctx.methodEngagements} total logs.
Days Quit: ${ctx.currentDay} days.
Top Triggers: ${ctx.primaryTriggers.length ? ctx.primaryTriggers.join(", ") : "Not enough data yet"}.
Resistance Rate (Last 7 Days): ${ctx.resistanceRate}% (${ctx.last7cravingsCount} total cravings).
Top Mood (7D): ${ctx.topMood}.
Behavioral Health Index Estimate: ${ctx.bhiProxy}.
Current Emotion Detected: ${ctx.emotion}. Strategy: ${
    ctx.emotion === "distressed"
      ? "Prioritize validation and stabilization before anything else."
      : ctx.emotion === "motivated"
        ? "Set one concrete next action."
        : "Explore without pressure."
  }

--- COACHING METHOD FOR THIS USER ---
${METHOD_GUIDES[ctx.quitMethod] || "No single active method yet. Draw lightly on whichever method fits the moment."}
${ctx.methodContext ? `\nRecent method-specific activity: ${ctx.methodContext}` : ""}

--- REASONING ---
Before your visible reply, think step-by-step inside a <think> tag: consider the emotion, their active method, and their resistance. Your visible reply must be outside the <think> tag. Never reveal the contents of <think> in your reply.
Example:
<think>
User is distressed and their method is ACT. Low resistance. I will validate, then guide one urge-surf step.
</think>
I hear how hard this is. Let's take a slow breath together...
`;
}

function buildUserPrompt(ctx: Ctx): string {
  return `Recent Conversation:\n${ctx.recentHistory}\nUser: ${ctx.messageText}\nCoach:`;
}

function buildGeminiContents(prompt: string, toolResults: any[]) {
  if (toolResults.length === 0) {
    return [{ role: "user", parts: [{ text: prompt }] }];
  }

  // Replay the tool calls the client executed so the model can produce a
  // natural follow-up instead of a canned string.
  return [
    { role: "user", parts: [{ text: prompt }] },
    {
      role: "model",
      parts: toolResults.map((t) => ({
        functionCall: { name: t.name, args: t.args },
      })),
    },
    {
      role: "user",
      parts: toolResults.map((t) => ({
        functionResponse: { name: t.name, response: t.response },
      })),
    },
  ];
}

function classifyError(err: any) {
  const message = String(err?.message || err || "Unknown AI error");
  if (/abort|timeout|timed out|ETIMEDOUT|DEADLINE/i.test(message)) {
    return { status: 504, code: "AI_TIMEOUT", error: "The AI coach took too long to respond. Please try again." };
  }
  if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED|Incorrect API key|invalid_api_key|401/i.test(message)) {
    return { status: 502, code: "AI_KEY_INVALID", error: "The server's AI API key was rejected. Check the key for the configured provider." };
  }
  return { status: 502, code: "AI_ERROR", error: "The AI coach is unavailable right now. Please try again." };
}

/** True when the model id itself is unusable, so trying the next one is worth it. */
function isRetiredModelError(err: any): boolean {
  return /404|NOT_FOUND|no longer available|is not supported|not found/i.test(String(err?.message || err));
}

async function generateWithModelFallback(ai: GoogleGenAI, params: { contents: any; config: any }) {
  const attempted: string[] = [];
  for (const model of modelCandidates()) {
    attempted.push(model);
    try {
      return await ai.models.generateContent({ model, ...params });
    } catch (err) {
      if (isRetiredModelError(err)) {
        console.warn(`[ai] model ${model} is unavailable, trying next candidate`);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`No usable Gemini model. Tried: ${attempted.join(", ")}`);
}

function safeJsonParse(value: unknown): any {
  if (typeof value !== "string") return value ?? {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

/**
 * Calls any OpenAI-compatible /chat/completions endpoint. The client's tool
 * results are replayed as an assistant tool_calls turn plus matching tool
 * messages, which is how this protocol continues a tool call.
 */
async function callOpenAI(apiKey: string, system: string, userContent: string, toolResults: any[]) {
  const messages: any[] = [
    { role: "system", content: system },
    { role: "user", content: userContent },
  ];

  if (toolResults.length > 0) {
    const ids = toolResults.map((t, i) => t.id || `call_${i + 1}`);
    messages.push({
      role: "assistant",
      content: null,
      tool_calls: toolResults.map((t, i) => ({
        id: ids[i],
        type: "function",
        function: { name: t.name, arguments: JSON.stringify(t.args || {}) },
      })),
    });
    toolResults.forEach((t, i) => {
      messages.push({ role: "tool", tool_call_id: ids[i], content: JSON.stringify(t.response ?? {}) });
    });
  }

  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: OPENAI_MODEL, messages, tools: openaiTools(), temperature: 0.7 }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  const raw = await res.text();
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`[${res.status}] Non-JSON reply from ${OPENAI_BASE_URL}: ${raw.slice(0, 200)}`);
  }

  if (!res.ok) {
    const detail = json?.error?.message || json?.message || raw.slice(0, 200);
    throw new Error(`[${res.status}] ${detail}`);
  }

  const message = json?.choices?.[0]?.message;
  const text = Array.isArray(message?.content)
    ? message.content.map((part: any) => part?.text || "").join("")
    : message?.content || "";

  const functionCalls = (message?.tool_calls || []).map((tc: any) => ({
    name: tc?.function?.name,
    args: safeJsonParse(tc?.function?.arguments),
  }));

  return { text, functionCalls };
}

/** Single entry point so the routes do not care which provider is active. */
async function runModel(apiKey: string, system: string, userContent: string, toolResults: any[]) {
  if (AI_PROVIDER === "openai") {
    return callOpenAI(apiKey, system, userContent, toolResults);
  }

  const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: AI_TIMEOUT_MS } });
  const response = await generateWithModelFallback(ai, {
    contents: buildGeminiContents(userContent, toolResults) as any,
    config: {
      systemInstruction: system,
      temperature: 0.7,
      tools: [{ functionDeclarations: geminiTools() as any }],
    },
  });

  return {
    text: response.text || "",
    functionCalls: (response.functionCalls || []).map((c) => ({ name: c.name, args: c.args })),
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const apiRouter = express.Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(getApiKey()),
    provider: AI_PROVIDER,
    model: activeModel(),
    baseUrl: AI_PROVIDER === "openai" ? OPENAI_BASE_URL : undefined,
    modelFallbacks: modelCandidates().slice(1),
  });
});

apiRouter.post("/chat", async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(503).json({
      error: "The AI coach is not configured on the server.",
      code: "AI_NOT_CONFIGURED",
    });
  }

  if (isRateLimited(req.ip || "unknown")) {
    return res.status(429).json({ error: "Too many requests. Please slow down.", code: "RATE_LIMITED" });
  }

  const body = req.body ?? {};
  if (typeof body.messageText !== "string" || !body.messageText.trim()) {
    return res.status(400).json({ error: "messageText is required.", code: "BAD_REQUEST" });
  }
  if (body.messageText.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({
      error: `messageText must be under ${MAX_MESSAGE_CHARS} characters.`,
      code: "BAD_REQUEST",
    });
  }

  const language = body.language === "en" ? "en" : "id";
  const ctx = buildContext(body);
  const toolResults = Array.isArray(body.toolResults)
    ? body.toolResults.filter((t: any) => t && typeof t.name === "string").slice(0, 4)
    : [];

  try {
    const result = await runModel(apiKey, buildSystemInstruction(ctx, language), buildUserPrompt(ctx), toolResults);

    res.json({
      text: stripThoughts(result.text || ""),
      functionCalls: result.functionCalls.filter((call) => Boolean(call.name)),
    });
  } catch (err: any) {
    const { status, code, error } = classifyError(err);
    console.error(`[api/chat] ${code}:`, err);
    res.status(status).json({ error, code });
  }
});

apiRouter.post("/insight", async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(503).json({ error: "The AI coach is not configured on the server.", code: "AI_NOT_CONFIGURED" });
  }

  if (isRateLimited(req.ip || "unknown")) {
    return res.status(429).json({ error: "Too many requests. Please slow down.", code: "RATE_LIMITED" });
  }

  const statsContext = typeof req.body?.statsContext === "string" ? req.body.statsContext.slice(0, 2000) : "";
  if (!statsContext.trim()) {
    return res.status(400).json({ error: "statsContext is required.", code: "BAD_REQUEST" });
  }
  const language = req.body?.language === "en" ? "en" : "id";

  const systemInstruction = `You are an empathetic, concise smoking cessation coach. Generate a short 2-3 sentence insight based on this data. Emphasize their method and point out positive trends. No generic lines. Use emojis sparingly. Language requirement: ${language === "id" ? "Respond in Indonesian (Bahasa Indonesia)." : "Respond in English."}`;

  try {
    const result = await runModel(apiKey, systemInstruction, `Analyze this data: ${statsContext}`, []);
    res.json({ content: stripThoughts(result.text || "") });
  } catch (err: any) {
    const { status, code, error } = classifyError(err);
    console.error(`[api/insight] ${code}:`, err);
    res.status(status).json({ error, code });
  }
});

app.use("/api", apiRouter);

// ---------------------------------------------------------------------------
// Serving
// ---------------------------------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`AI provider: ${AI_PROVIDER} | model: ${activeModel()} | key configured: ${Boolean(getApiKey())}`);
    if (AI_PROVIDER === "openai") console.log(`AI base URL: ${OPENAI_BASE_URL}`);
  });
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  start();
}

export default app;
