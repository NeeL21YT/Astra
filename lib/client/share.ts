import type { AnalysisResult, Lang, ScamCategory } from "@/lib/types";
import { translate } from "@/lib/i18n/ui";
import type { UiKey } from "@/lib/i18n/ui";

/**
 * Remove anything that could identify the sender, a link or an account from a
 * line of text that is about to be shared. This is a safety net on top of the
 * fact that we never put the message, links, numbers, UPI ids or hashes in.
 */
export function scrubForShare(text: string): string {
  return text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\bwww\.\S+/gi, "")
    .replace(/\b[\w.+-]+@[\w.-]+\b/g, "")
    .replace(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|org|net|co|info|xyz|top|link|example|app)\b\S*/gi, "")
    .replace(/\+?\d[\d\s-]{5,}\d/g, "")
    .replace(/\b[a-f0-9]{32,}\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?।])/g, "$1")
    .trim();
}

function firstSentence(text: string, max = 220): string {
  const match = text.match(/^[^.!?।]+[.!?।]?/);
  const sentence = (match ? match[0] : text).trim();
  if (sentence.length <= max) return sentence;
  return sentence.slice(0, max - 1).trimEnd() + "…";
}

export function categoryLabels(categories: ScamCategory[], lang: Lang): string[] {
  return categories.map((c) => translate(lang, `cat.${c}` as UiKey));
}

/** The privacy-safe family summary. Contains only: state label, categories, one-line summary, one action. */
export function buildShareSummary(result: AnalysisResult, lang: Lang): string {
  const out: string[] = [];
  out.push(translate(lang, "share.header", { state: translate(lang, `state.${result.uiState}` as UiKey) }));

  const cats = categoryLabels(result.categories.slice(0, 3), lang);
  if (cats.length > 0) out.push(translate(lang, "share.looksLike", { list: cats.join(", ") }));

  const summary = firstSentence(scrubForShare(result.summary[lang]));
  if (summary) out.push(summary);

  const action = result.recommendedActions[0];
  const actionText = action ? firstSentence(scrubForShare(action[lang])) : "";
  if (actionText) out.push(translate(lang, "share.todo", { action: actionText }));

  if (result.uiState === "likely_safe") out.push(translate(lang, "state.likely_safe.caution"));
  out.push(translate(lang, "share.footer"));
  return out.join("\n");
}

/** Script for read-aloud: state label, summary, top 3 reasons, first 3 actions. */
export function buildReadAloudScript(result: AnalysisResult, lang: Lang): string {
  const parts: string[] = [];
  parts.push(`${translate(lang, `state.${result.uiState}` as UiKey)}.`);
  parts.push(result.summary[lang]);
  if (result.uiState === "likely_safe") parts.push(translate(lang, "state.likely_safe.caution"));

  const reasons = result.indicators.slice(0, 3).map((i) => i.explanation[lang]);
  if (reasons.length > 0) {
    parts.push(translate(lang, "read.script.reasons"));
    parts.push(...reasons);
  }
  const actions = result.recommendedActions.slice(0, 3).map((a) => a[lang]);
  if (actions.length > 0) {
    parts.push(translate(lang, "read.script.actions"));
    parts.push(...actions);
  }
  return parts.map((p) => (/[.!?।…]$/.test(p.trim()) ? p.trim() : `${p.trim()}.`)).join(" ");
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
