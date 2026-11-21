// Server-side validation of AI output against the submitted text (spec 7.1 step 8, 7.5).
//  1. Evidence: each indicator's `evidence` must be a substring of the submitted text after
//     normalizing whitespace and case. If so we keep the ORIGINAL span (original casing), else the
//     indicator is kept as `inferred: true` with no evidence text.
//  2. Invented contact details: any AI-written text (en or hi) that contains a URL/domain, e-mail
//     address, or a digit string of 6+ digits that is NOT present in the submitted text is dropped
//     (list items) or removed (summary / requestedAction), so the model cannot make up contacts.
//  3. Hindi strings must contain Devanagari, otherwise the item is dropped.
import type { Bilingual, Indicator, ValidatedAi } from "@/lib/types";
import type { AiOutput } from "@/lib/analysis/schema";

// ----------------------------------------------------------------------- evidence matching

type Normalized = { norm: string; starts: number[]; ends: number[] };

/** Collapse whitespace runs to one space and lowercase, keeping a map back to original offsets. */
function normalizeWithMap(text: string): Normalized {
  let norm = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let pendingSpaceAt = -1;
  let i = 0;
  for (const ch of text) {
    const start = i;
    i += ch.length;
    if (/\s/u.test(ch)) {
      if (norm.length > 0 && pendingSpaceAt < 0) pendingSpaceAt = start;
      continue;
    }
    if (pendingSpaceAt >= 0) {
      norm += " ";
      starts.push(pendingSpaceAt);
      ends.push(pendingSpaceAt + 1);
      pendingSpaceAt = -1;
    }
    const lower = ch.toLowerCase();
    norm += lower;
    for (let k = 0; k < lower.length; k++) {
      starts.push(start);
      ends.push(i);
    }
  }
  return { norm, starts, ends };
}

const EDGE_QUOTES = /^["'“”‘’«»`\s.…]+|["'“”‘’«»`\s.…]+$/g;

/**
 * Finds `evidence` in `text` ignoring case and whitespace differences.
 * Returns the exact span from the original text, or null.
 */
export function findEvidenceSpan(text: string, evidence: string, normalizedText?: Normalized): string | null {
  const cleaned = evidence.replace(EDGE_QUOTES, "");
  const ev = normalizeWithMap(cleaned);
  if (ev.norm.length < 3) return null; // too short to be meaningful evidence
  const hay = normalizedText ?? normalizeWithMap(text);
  const idx = hay.norm.indexOf(ev.norm);
  if (idx < 0) return null;
  const start = hay.starts[idx];
  const end = hay.ends[idx + ev.norm.length - 1];
  const span = text.slice(start, end);
  return span.length > 0 ? span : null;
}

// ----------------------------------------------------------------------- contact detection

const TLDS =
  "com|in|org|net|co|gov|edu|info|biz|xyz|top|club|online|site|live|app|link|ly|me|io|ai|us|uk|ru|cn|tk|ml|ga|cf|gq|cc|vip|shop|store|click|icu|buzz|work|pw|to|ws|cyou|sbs|life|world|today|support|help|page|dev";

const URL_RE = new RegExp(
  String.raw`(?:https?:\/\/|www\.)[^\s<>"')\]]+|(?:\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:${TLDS})\b(?:[\/:][^\s<>"')\]]*)?`,
  "giu",
);
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/giu;
const DIGIT_RUN_RE = /\+?\d(?:[\s\-().]?\d){5,}/g;

function asciiDigits(s: string): string {
  return s.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x966));
}

/** Reduce a URL-ish token to its lowercase host. */
function hostKey(token: string): string {
  let t = token.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  t = t.split(/[\/?#]/)[0].replace(/:\d+$/, "").replace(/[.,;:!?]+$/, "");
  return t;
}

export type AllowedContacts = { hosts: Set<string>; emails: Set<string>; digitRuns: string[] };

export function collectAllowedContacts(submitted: string): AllowedContacts {
  const t = asciiDigits(submitted);
  const hosts = new Set<string>();
  for (const m of t.matchAll(URL_RE)) hosts.add(hostKey(m[0]));
  const emails = new Set<string>();
  for (const m of t.matchAll(EMAIL_RE)) emails.add(m[0].toLowerCase().replace(/[.,;:!?]+$/, ""));
  const digitRuns: string[] = [];
  for (const m of t.matchAll(DIGIT_RUN_RE)) digitRuns.push(m[0].replace(/\D/g, ""));
  return { hosts, emails, digitRuns };
}

/** Tokens in `s` (any language) that are contact details absent from the submitted text. */
export function findInventedContacts(s: string, allowed: AllowedContacts): string[] {
  const t = asciiDigits(s);
  const bad: string[] = [];
  for (const m of t.matchAll(EMAIL_RE)) {
    if (!allowed.emails.has(m[0].toLowerCase().replace(/[.,;:!?]+$/, ""))) bad.push(m[0]);
  }
  for (const m of t.matchAll(URL_RE)) {
    if (!allowed.hosts.has(hostKey(m[0]))) bad.push(m[0]);
  }
  for (const m of t.matchAll(DIGIT_RUN_RE)) {
    const d = m[0].replace(/\D/g, "");
    if (!allowed.digitRuns.some((a) => a.includes(d) || d.includes(a))) bad.push(m[0]);
  }
  return bad;
}

const DEVANAGARI = /[ऀ-ॿ]/;

function cleanBilingual(b: Bilingual | undefined, allowed: AllowedContacts): Bilingual | undefined {
  if (!b) return undefined;
  if (!DEVANAGARI.test(b.hi)) return undefined;
  if (findInventedContacts(b.en, allowed).length > 0) return undefined;
  if (findInventedContacts(b.hi, allowed).length > 0) return undefined;
  return b;
}

// ----------------------------------------------------------------------- main entry

/**
 * Convert parsed AI output into ValidatedAi.
 * NOTE: when the AI summary is dropped (it contained invented contact details or no Hindi), the
 * returned `summary` has empty strings; the pipeline then uses its rule-derived summary.
 */
export function validateAi(raw: AiOutput, submittedText: string): ValidatedAi {
  const allowed = collectAllowedContacts(submittedText);
  const normalizedText = normalizeWithMap(submittedText);

  const indicators: Indicator[] = [];
  const seen = new Set<string>();
  const typeCount = new Map<string, number>();

  for (const ind of raw.indicators) {
    const explanation = cleanBilingual(ind.explanation, allowed);
    if (!explanation) continue;

    const span = ind.evidence ? findEvidenceSpan(submittedText, ind.evidence, normalizedText) : null;
    const key = `${ind.type}|${(span ?? "").toLowerCase()}`;
    if (span && seen.has(key)) continue;
    seen.add(key);

    const n = (typeCount.get(ind.type) ?? 0) + 1;
    typeCount.set(ind.type, n);
    const indicator: Indicator = {
      id: n === 1 ? `ai_${ind.type}` : `ai_${ind.type}_${n}`,
      type: ind.type,
      source: "ai",
      explanation,
      points: 0, // scoring is done by the engine, never by the model
    };
    if (span) indicator.evidence = span;
    else indicator.inferred = true;
    indicators.push(indicator);
  }

  const keepList = (items: Bilingual[]) =>
    items.map((b) => cleanBilingual(b, allowed)).filter((b): b is Bilingual => !!b);

  return {
    categories: raw.categories,
    riskLevel: raw.riskLevel,
    evidenceConfidence: raw.evidenceConfidence,
    summary: cleanBilingual(raw.summary, allowed) ?? { en: "", hi: "" },
    requestedAction: cleanBilingual(raw.requestedAction, allowed),
    indicators,
    recommendedActions: keepList(raw.recommendedActions),
    limitations: keepList(raw.limitations),
  };
}
