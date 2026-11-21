// Zod schema for the AI model output (spec 7.5, with bilingual {en, hi} fields) plus the matching
// JSON Schema sent to Gemini as `responseJsonSchema`. The model is never trusted: this validates
// shape and caps lengths; lib/analysis/evidence-validator.ts then checks evidence and contact details.
import { z } from "zod";
import type { IndicatorType, ScamCategory } from "@/lib/types";

export const SCAM_CATEGORIES = [
  "banking_kyc",
  "upi_payment",
  "government_impersonation",
  "delivery_customs",
  "utility_disconnection",
  "job_task",
  "investment",
  "loan_credit",
  "fake_support",
  "remote_access_apk",
  "family_emergency",
  "sextortion",
  "prize_lottery",
  "gambling_spam",
  "credential_theft",
  "malicious_file",
  "other",
] as const satisfies readonly ScamCategory[];

/** Indicator types the model may use. url_reputation / file_reputation come only from providers. */
export const AI_INDICATOR_TYPES = [
  "credential_request",
  "payment_request",
  "urgency",
  "threat",
  "prize_bait",
  "install_request",
  "impersonation",
  "secrecy",
  "isolation",
  "advance_fee",
  "link_risk",
  "other",
] as const satisfies readonly IndicatorType[];

export const AI_CAPS = {
  summaryChars: 300,
  requestedActionChars: 200,
  explanationChars: 240,
  actionChars: 200,
  limitationChars: 200,
  evidenceChars: 300,
  categories: 4,
  indicators: 6,
  actions: 5,
  limitations: 3,
} as const;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function tidy(s: string): string {
  return s.replace(CONTROL_CHARS, "").replace(/[ \t]+/g, " ").trim();
}

function dropTrailingHalfSurrogate(s: string): string {
  return s.replace(/[\uD800-\uDBFF]$/, "");
}

/** Truncate with an ellipsis, preferring a word boundary. */
function capText(s: string, max: number): string {
  const t = tidy(s);
  if (t.length <= max) return t;
  let cut = dropTrailingHalfSurrogate(t.slice(0, max - 1));
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > max * 0.6) cut = cut.slice(0, lastSpace);
  return cut.trimEnd() + "…";
}

const text = (max: number) =>
  z
    .string()
    .transform((s) => capText(s, max))
    .pipe(z.string().min(1));

const bilingual = (max: number) => z.object({ en: text(max), hi: text(max) });

/** Parse each element on its own and drop bad ones, so one bad item does not discard the rest. */
function lenientList<S extends z.ZodType>(item: S, max: number) {
  return z
    .array(z.unknown())
    .optional()
    .transform((arr) => {
      const out: z.output<S>[] = [];
      for (const el of arr ?? []) {
        const r = item.safeParse(el);
        if (r.success) out.push(r.data);
        if (out.length >= max) break;
      }
      return out;
    });
}

const indicatorSchema = z.object({
  type: z.string().transform((t): (typeof AI_INDICATOR_TYPES)[number] =>
    (AI_INDICATOR_TYPES as readonly string[]).includes(t) ? (t as (typeof AI_INDICATOR_TYPES)[number]) : "other",
  ),
  evidence: z
    .string()
    .nullish()
    .transform((e) => (e ? e.replace(CONTROL_CHARS, "").slice(0, AI_CAPS.evidenceChars) : undefined)),
  explanation: bilingual(AI_CAPS.explanationChars),
});

export const aiOutputSchema = z.object({
  categories: z
    .array(z.unknown())
    .optional()
    .transform((arr) => {
      const out: ScamCategory[] = [];
      for (const c of arr ?? []) {
        if (typeof c === "string" && (SCAM_CATEGORIES as readonly string[]).includes(c) && !out.includes(c as ScamCategory)) {
          out.push(c as ScamCategory);
        }
        if (out.length >= AI_CAPS.categories) break;
      }
      return out;
    }),
  riskLevel: z.enum(["high", "suspicious", "low"]),
  evidenceConfidence: z.enum(["low", "medium", "high"]),
  summary: bilingual(AI_CAPS.summaryChars),
  requestedAction: bilingual(AI_CAPS.requestedActionChars)
    .nullish()
    .catch(undefined)
    .transform((v) => v ?? undefined),
  indicators: lenientList(indicatorSchema, AI_CAPS.indicators),
  recommendedActions: lenientList(bilingual(AI_CAPS.actionChars), AI_CAPS.actions),
  limitations: lenientList(bilingual(AI_CAPS.limitationChars), AI_CAPS.limitations),
});

export type AiOutput = z.output<typeof aiOutputSchema>;

/** Returns the parsed output, or null when it is malformed. */
export function parseAiOutput(raw: unknown): AiOutput | null {
  const r = aiOutputSchema.safeParse(raw);
  return r.success ? r.data : null;
}

// ------------------------------------------------------------ JSON Schema for Gemini
// Keep in sync with aiOutputSchema. Gemini ignores unsupported keywords (e.g. maxLength), so length
// caps are also stated in the prompt and enforced by zod above.

const bilingualJson = (description: string) => ({
  type: "object",
  description,
  properties: {
    en: { type: "string", description: "Simple English." },
    hi: { type: "string", description: "Plain Hindi in Devanagari script." },
  },
  required: ["en", "hi"],
});

export const AI_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    categories: {
      type: "array",
      maxItems: AI_CAPS.categories,
      items: { type: "string", enum: [...SCAM_CATEGORIES] },
    },
    riskLevel: { type: "string", enum: ["high", "suspicious", "low"] },
    evidenceConfidence: { type: "string", enum: ["low", "medium", "high"] },
    summary: bilingualJson(`At most ${AI_CAPS.summaryChars} characters per language.`),
    requestedAction: bilingualJson("What the sender wants the recipient to do. Omit if none."),
    indicators: {
      type: "array",
      maxItems: AI_CAPS.indicators,
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: [...AI_INDICATOR_TYPES] },
          evidence: {
            type: "string",
            description: "Exact words copied from the message. Omit if you cannot quote exactly.",
          },
          explanation: bilingualJson("Why this is a warning sign."),
        },
        required: ["type", "explanation"],
      },
    },
    recommendedActions: { type: "array", maxItems: AI_CAPS.actions, items: bilingualJson("One safe next step.") },
    limitations: { type: "array", maxItems: AI_CAPS.limitations, items: bilingualJson("One limit of this analysis.") },
  },
  required: ["categories", "riskLevel", "evidenceConfidence", "summary", "indicators", "recommendedActions", "limitations"],
} as const;
