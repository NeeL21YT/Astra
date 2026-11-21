// One entry point for every large-language-model call (message analysis and picture reading).
//
// It tries providers in order and moves on when one is missing, out of quota, slow or returns
// something unusable:
//   1. Google Gemini            (GEMINI_API_KEY, GEMINI_MODEL)
//   2. OpenRouter               (OPENROUTER_API_KEY, OPENROUTER_TEXT_MODEL / OPENROUTER_VISION_MODEL)
//   3. OpenCode Zen             (OPENCODE_API_KEY, OPENCODE_TEXT_MODEL / OPENCODE_VISION_MODEL)
// The order can be changed with AI_PROVIDER_ORDER (for example "openrouter,gemini").
// Every provider takes a comma-separated model list (GEMINI_MODEL included), tried left to right:
// ASTRA walks through the models of one provider before moving on to the next provider.
//
// OpenRouter and OpenCode both speak the OpenAI "chat completions" format.
// Verified live on 2026-11-21: OpenRouter https://openrouter.ai/api/v1 and OpenCode Zen
// https://opencode.ai/zen/v1, both with an `Authorization: Bearer <key>` header.
//
// PRIVACY: every provider that answers sees the (already redacted) message or the picture.
// OpenRouter free models require prompt logging/training; with the default settings ASTRA sends
// `provider.data_collection = "deny"`, which makes OpenRouter skip such models. Set
// OPENROUTER_ALLOW_DATA_COLLECTION=1 to allow them. Nothing here logs prompts or answers.
import { fetchJsonWithTimeout } from "@/lib/server/http";
import { logEvent } from "@/lib/privacy/safe-logging";

export type LlmProviderId = "gemini" | "openrouter" | "opencode";
export type LlmKind = "text" | "vision";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
export const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const OPENCODE_BASE = "https://opencode.ai/zen/v1";

const ALL_PROVIDERS: readonly LlmProviderId[] = ["gemini", "openrouter", "opencode"];

type Candidate = { provider: LlmProviderId; model: string; key: string };

export type LlmRequest = {
  kind: LlmKind;
  system: string;
  user: string;
  image?: { base64: string; mime: string };
  /** JSON Schema. Gemini enforces it; the others get it appended to the system prompt. */
  jsonSchema?: unknown;
  maxTokens: number;
  temperature: number;
  /** Total time allowed across all providers. */
  budgetMs: number;
  /** Longest the first attempt may take. */
  attemptMs: number;
  /** Longest a later attempt (a fallback provider) may take. Defaults to attemptMs. */
  fallbackAttemptMs?: number;
  /** Return false to reject an answer (for example it is not valid JSON) and try the next provider. */
  accept?: (text: string) => boolean;
};

export type LlmResult = { ok: true; text: string; provider: LlmProviderId } | { ok: false };

// ------------------------------------------------------------------ configuration

function clean(v: string | undefined): string {
  return (v ?? "").trim();
}

function list(v: string | undefined): string[] {
  return clean(v)
    .split(",")
    .map((s) => s.trim())
    // Model ids go into a request body (or a URL path for Gemini): accept plain ids only.
    .filter((s) => /^[A-Za-z0-9._:/-]{1,100}$/.test(s));
}

const MAX_GEMINI_MODELS = 5;

/**
 * Gemini models to try, in order. GEMINI_MODEL may be one id or a comma-separated list. Ids go into a
 * URL path, so only plain ids are accepted; anything else is ignored. With nothing valid, the default is used.
 */
export function geminiModelIds(): string[] {
  const ids = clean(process.env.GEMINI_MODEL)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[A-Za-z0-9._-]{1,80}$/.test(s));
  const unique = [...new Set(ids)].slice(0, MAX_GEMINI_MODELS);
  return unique.length > 0 ? unique : [DEFAULT_GEMINI_MODEL];
}

/** The first (preferred) Gemini model. */
export function geminiModelId(): string {
  return geminiModelIds()[0];
}

export function providerOrder(): LlmProviderId[] {
  const configured = clean(process.env.AI_PROVIDER_ORDER)
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is LlmProviderId => (ALL_PROVIDERS as readonly string[]).includes(s));
  const seen = new Set<LlmProviderId>();
  const order = configured.filter((p) => (seen.has(p) ? false : (seen.add(p), true)));
  return order.length > 0 ? order : [...ALL_PROVIDERS];
}

function candidatesFor(kind: LlmKind): Candidate[] {
  const out: Candidate[] = [];
  for (const provider of providerOrder()) {
    if (provider === "gemini") {
      const key = clean(process.env.GEMINI_API_KEY);
      if (key) for (const model of geminiModelIds()) out.push({ provider, model, key });
    } else if (provider === "openrouter") {
      const key = clean(process.env.OPENROUTER_API_KEY);
      const models = list(kind === "vision" ? process.env.OPENROUTER_VISION_MODEL : process.env.OPENROUTER_TEXT_MODEL);
      if (key) for (const model of models) out.push({ provider, model, key });
    } else {
      const key = clean(process.env.OPENCODE_API_KEY);
      const models = list(kind === "vision" ? process.env.OPENCODE_VISION_MODEL : process.env.OPENCODE_TEXT_MODEL);
      if (key) for (const model of models) out.push({ provider, model, key });
    }
  }
  return out;
}

/** Is at least one provider set up for this kind of request? */
export function isLlmConfigured(kind: LlmKind): boolean {
  return candidatesFor(kind).length > 0;
}

/** Which providers are set up (booleans only, for the health check). */
export function llmProviderStatus(): Record<LlmProviderId, boolean> & { vision: boolean } {
  const has = (kind: LlmKind) => new Set(candidatesFor(kind).map((c) => c.provider));
  const text = has("text");
  const vision = has("vision");
  return {
    gemini: text.has("gemini"),
    openrouter: text.has("openrouter") || vision.has("openrouter"),
    opencode: text.has("opencode") || vision.has("opencode"),
    vision: vision.size > 0,
  };
}

// ------------------------------------------------------------------ cooldowns

// After a failure a model is skipped for a while so a quota or outage does not slow every request.
// In-memory only: serverless instances do not share it, so this is best effort.
const cooldownUntil = new Map<string, number>();

export function resetLlmCooldowns(): void {
  cooldownUntil.clear();
}

function cooldownFor(httpStatus: number | null): number {
  if (httpStatus === 429) return 60_000; // quota or rate limit
  if (httpStatus === 402) return 5 * 60_000; // out of credits (OpenRouter asks for payment)
  if (httpStatus === 401 || httpStatus === 403) return 10 * 60_000; // bad key
  if (httpStatus === 400 || httpStatus === 404) return 10 * 60_000; // model unavailable / no matching endpoint
  return 15_000; // timeouts, network errors, 5xx, unusable answers
}

// ------------------------------------------------------------------ calls

type RawOutcome = { text: string } | { failed: true; httpStatus: number | null };

function geminiText(body: unknown): string {
  const candidates = (body as { candidates?: unknown })?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";
  const parts = (candidates[0] as { content?: { parts?: unknown } })?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .filter((p) => p && typeof p === "object" && !(p as { thought?: boolean }).thought)
    .map((p) => (typeof (p as { text?: unknown }).text === "string" ? (p as { text: string }).text : ""))
    .join("")
    .trim();
}

async function callGemini(c: Candidate, req: LlmRequest, timeoutMs: number): Promise<RawOutcome> {
  const parts: unknown[] = [];
  if (req.image) parts.push({ inlineData: { mimeType: req.image.mime, data: req.image.base64 } });
  parts.push({ text: req.user });
  const generationConfig: Record<string, unknown> = { temperature: req.temperature, maxOutputTokens: req.maxTokens };
  if (req.jsonSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseJsonSchema = req.jsonSchema;
  }
  const res = await fetchJsonWithTimeout(
    `${GEMINI_BASE}/${c.model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": c.key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts }],
        generationConfig,
      }),
    },
    timeoutMs,
  );
  if (res.status !== 200 || !res.parsed) return { failed: true, httpStatus: res.status };
  // A 200 with no text means the model found nothing to say (for example a picture with no text).
  return { text: geminiText(res.body) };
}

function openAiText(body: unknown): string {
  const content = (body as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((p) => (p && typeof p === "object" && typeof (p as { text?: unknown }).text === "string" ? (p as { text: string }).text : ""))
      .join("")
      .trim();
  }
  return "";
}

async function callOpenAiCompatible(c: Candidate, req: LlmRequest, timeoutMs: number): Promise<RawOutcome> {
  const base = c.provider === "openrouter" ? OPENROUTER_BASE : OPENCODE_BASE;
  const system = req.jsonSchema
    ? `${req.system}\n\nRespond with ONLY one JSON object that matches this JSON Schema (no markdown fences, no extra text):\n${JSON.stringify(req.jsonSchema)}`
    : req.system;
  const userContent = req.image
    ? [
        { type: "text", text: req.user },
        { type: "image_url", image_url: { url: `data:${req.image.mime};base64,${req.image.base64}` } },
      ]
    : req.user;
  const body: Record<string, unknown> = {
    model: c.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ],
    max_tokens: req.maxTokens,
    temperature: req.temperature,
  };
  if (c.provider === "openrouter" && process.env.OPENROUTER_ALLOW_DATA_COLLECTION !== "1") {
    body.provider = { data_collection: "deny" };
  }
  const res = await fetchJsonWithTimeout(
    `${base}/chat/completions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.key}` },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );
  if (res.status !== 200 || !res.parsed) return { failed: true, httpStatus: res.status };
  const text = openAiText(res.body);
  // Reasoning models can run out of tokens before writing an answer: treat that as a failure.
  if (!text) return { failed: true, httpStatus: 200 };
  return { text };
}

// ------------------------------------------------------------------ the chain

/** Try each configured provider and model in order. Never throws. */
export async function generateWithFallback(req: LlmRequest): Promise<LlmResult> {
  const startedAt = Date.now();
  const candidates = candidatesFor(req.kind);
  let attempts = 0;

  for (const c of candidates) {
    const remaining = req.budgetMs - (Date.now() - startedAt);
    if (remaining < 1500) break;
    const key = `${c.provider}:${c.model}`;
    if ((cooldownUntil.get(key) ?? 0) > Date.now()) continue;

    // The primary provider should answer quickly; fallbacks (often slower, free or reasoning
    // models) get more time, because by then the person is already waiting.
    const limit = attempts === 0 ? req.attemptMs : (req.fallbackAttemptMs ?? req.attemptMs);
    attempts += 1;
    const timeoutMs = Math.min(limit, remaining);
    const t0 = Date.now();
    let outcome: RawOutcome;
    try {
      outcome = c.provider === "gemini" ? await callGemini(c, req, timeoutMs) : await callOpenAiCompatible(c, req, timeoutMs);
    } catch {
      outcome = { failed: true, httpStatus: null }; // network error or timeout
    }

    if ("failed" in outcome) {
      cooldownUntil.set(key, Date.now() + cooldownFor(outcome.httpStatus));
      logEvent("llm.failed", { durationMs: Date.now() - t0, httpStatus: outcome.httpStatus ?? undefined, status: c.provider, model: c.model });
      continue;
    }
    if (req.accept && !req.accept(outcome.text)) {
      cooldownUntil.set(key, Date.now() + cooldownFor(null));
      logEvent("llm.rejected", { durationMs: Date.now() - t0, status: c.provider, model: c.model });
      continue;
    }
    logEvent("llm.ok", { durationMs: Date.now() - t0, status: c.provider, model: c.model });
    return { ok: true, text: outcome.text, provider: c.provider };
  }
  return { ok: false };
}
