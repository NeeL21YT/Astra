// AI layer for message analysis. Server-side only, never throws.
//
// The actual model calls (Gemini first, then OpenRouter, then OpenCode) live in lib/ai/llm.ts.
// This file builds the prompt, asks the chain for one JSON object, and then does not trust the
// answer: it is parsed against a strict schema and every quoted piece of evidence is checked
// against the real message (see lib/analysis/schema.ts and evidence-validator.ts).
//
// Gemini notes (verified against Google's docs on 2026-11-21):
//  - POST /v1beta/models/{model}:generateContent with header `x-goog-api-key`.
//  - Structured output: generationConfig.responseMimeType = "application/json" plus
//    generationConfig.responseJsonSchema. Docs: https://ai.google.dev/gemini-api/docs/structured-output
//
// PRIVACY: the (server-side re-redacted) message text is sent to whichever provider answers. This
// is disclosed in the privacy notice. Message text is never logged.
import type { ExtractedEntities, RuleOutput, ValidatedAi } from "@/lib/types";
import { redactSensitive } from "@/lib/privacy/redact";
import { logEvent, startTimer } from "@/lib/privacy/safe-logging";
import { AI_RESPONSE_JSON_SCHEMA, parseAiOutput } from "@/lib/analysis/schema";
import { validateAi } from "@/lib/analysis/evidence-validator";
import { SYSTEM_INSTRUCTION, buildUserPrompt } from "@/lib/ai/prompt";
import { generateWithFallback, isLlmConfigured } from "@/lib/ai/llm";

// The message and phone routes allow 30 seconds. Gemini normally answers in a few seconds; a
// fallback model can take around 10, so it gets longer. The whole chain stays inside 26.
const TOTAL_BUDGET_MS = 26_000;
const ATTEMPT_MS = 8_000;
const FALLBACK_ATTEMPT_MS = 15_000;

export function isAiConfigured(): boolean {
  return isLlmConfigured("text");
}

/** Parse a model answer as JSON, tolerating code fences and stray words around the object. */
export function parseJsonLoose(s: string): unknown {
  const t = s.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
    throw new Error("not json");
  }
}

function parseAnswer(text: string) {
  try {
    return parseAiOutput(parseJsonLoose(text));
  } catch {
    return null;
  }
}

export async function analyzeWithAi(args: {
  text: string;
  entities: ExtractedEntities;
  rules: RuleOutput;
}): Promise<{ status: "ran" | "unavailable" | "skipped"; ai: ValidatedAi | null }> {
  if (!isLlmConfigured("text")) return { status: "skipped", ai: null };

  const elapsed = startTimer();
  try {
    // Defense in depth: the browser already redacts, but redact again before leaving the server.
    const redacted = redactSensitive(args.text).text;
    const result = await generateWithFallback({
      kind: "text",
      system: SYSTEM_INSTRUCTION,
      user: buildUserPrompt({ text: redacted, entities: args.entities, rules: args.rules }),
      jsonSchema: AI_RESPONSE_JSON_SCHEMA,
      // Kept modest: pay-as-you-go providers (OpenRouter) refuse a request if the account cannot
      // afford the maximum, even though the real answer is far shorter.
      maxTokens: 3000,
      temperature: 0.2,
      budgetMs: TOTAL_BUDGET_MS,
      attemptMs: ATTEMPT_MS,
      fallbackAttemptMs: FALLBACK_ATTEMPT_MS,
      // An answer that is not valid against the schema counts as a failure: try the next provider.
      accept: (text) => parseAnswer(text) !== null,
    });
    if (!result.ok) {
      logEvent("ai.failed", { durationMs: elapsed(), status: "no_provider_answered" });
      return { status: "unavailable", ai: null };
    }
    const parsed = parseAnswer(result.text);
    if (!parsed) return { status: "unavailable", ai: null };
    // Validate against the ORIGINAL submitted text (the model saw the redacted copy, so evidence
    // that spans a redaction simply fails to match and becomes an inferred indicator).
    const ai = validateAi(parsed, args.text);
    logEvent("ai.ran", { durationMs: elapsed(), status: result.provider });
    return { status: "ran", ai };
  } catch {
    logEvent("ai.failed", { durationMs: elapsed(), status: "error" });
    return { status: "unavailable", ai: null };
  }
}
