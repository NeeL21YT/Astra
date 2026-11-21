/**
 * Risk aggregation (spec 7.1 step 7, 7.2, 7.3, 7.4 and F13/F14 result rules).
 *
 * Policy, in short:
 *  - Internal score = rule points + URL flag points + provider/file signals (+ a little for
 *    AI-only indicators), clamped to 0-100. It is never shown as a probability.
 *  - A confirmed malicious URL, or a file flagged by 3+ engines, is "high" no matter what the AI says.
 *  - The AI may raise or confirm the level, never lower it. An AI-only "high" needs at least one
 *    AI indicator with a real (non-inferred) evidence span; otherwise it is capped at "suspicious".
 *  - "no_clear_warning" (shown as "likely_safe") is only returned when every applicable check ran.
 *    Otherwise the result is "unable". Indicators that already make it suspicious/high are kept.
 *  - File: never "likely_safe". Phone: never "likely_safe"; with no rule indicators always "unable".
 */
import type {
  AggregateInput,
  AggregateOutput,
  CheckId,
  FileCheck,
  RiskLevel,
  ScamCategory,
  UiState,
} from "@/lib/types";

/** Starting heuristics (spec 7.3). Tune them with a labelled evaluation set. */
export const THRESHOLDS = {
  high: 55,
  suspicious: 20,
  /** Below `suspicious`, this score plus 2+ distinct weak indicators still counts as suspicious. */
  weakCombined: 15,
} as const;

type Level = 0 | 1 | 2; // none, suspicious, high
const NONE = 0;
const SUSPICIOUS = 1;
const HIGH = 2;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const toRisk: Record<Level, RiskLevel> = { 0: "no_clear_warning", 1: "suspicious", 2: "high" };

const UI_STATE: Record<RiskLevel, UiState> = {
  high: "potential_scam",
  suspicious: "suspicious",
  no_clear_warning: "likely_safe",
  unable: "unable",
};

type FileLevel = "high" | "suspicious" | "none" | "unknown" | "unavailable" | "absent";

/** Engine-count thresholds (spec F13): 3+ malicious = high, 1-2 malicious or any suspicious = suspicious. */
function fileLevelOf(fc?: FileCheck): FileLevel {
  if (!fc) return "absent";
  const r = fc.reputation;
  if (r.status === "unavailable") return "unavailable";
  const c = r.engineCounts;
  if (c) {
    if (c.malicious >= 3) return "high";
    if (c.malicious >= 1 || c.suspicious >= 1) return "suspicious";
    if (r.status === "malicious") return "suspicious";
    if (r.status === "suspicious") return "suspicious";
    return r.status === "not_found" ? "unknown" : "none";
  }
  if (r.status === "malicious") return "high";
  if (r.status === "suspicious") return "suspicious";
  return r.status === "not_found" ? "unknown" : "none";
}

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function aggregate(input: AggregateInput): AggregateOutput {
  const { kind, rules, urlChecks, fileCheck, ai, checks } = input;
  const statusOf = (id: CheckId) => checks.find((c) => c.id === id)?.status;

  // ---------------------------------------------------------- local signals
  const urlFlagPoints = Math.min(
    40,
    urlChecks.reduce((n, u) => n + u.flags.reduce((m, f) => m + f.points, 0), 0),
  );
  const urlFlagCount = urlChecks.reduce((n, u) => n + u.flags.filter((f) => f.points > 0).length, 0);

  const reputation = urlChecks.flatMap((u) => u.reputation);
  const urlMalicious = reputation.some((r) => r.status === "malicious");
  const urlSuspicious = !urlMalicious && reputation.some((r) => r.status === "suspicious");
  const providerPoints = urlMalicious ? 50 : urlSuspicious ? 20 : 0;

  const fileLevel = fileLevelOf(fileCheck);
  const filePoints = fileLevel === "high" ? 60 : fileLevel === "suspicious" ? 30 : 0;

  const ruleIndicators = rules.indicators.filter((i) => i.points > 0 || i.evidence);
  const ruleTypes = new Set(ruleIndicators.map((i) => i.type));
  const aiGoodIndicators = (ai?.indicators ?? []).filter((i) => !i.inferred && !!i.evidence && i.evidence.trim().length > 0);
  const aiExtra = Math.min(
    15,
    aiGoodIndicators.filter((i) => !ruleTypes.has(i.type)).reduce((n, i) => n + Math.min(10, Math.max(0, i.points)), 0),
  );

  const score = clamp(rules.score + urlFlagPoints + providerPoints + filePoints + aiExtra);

  // ---------------------------------------------------------- levels
  const localScore = rules.score + urlFlagPoints + (urlSuspicious ? 20 : 0);
  const distinctWeak = ruleIndicators.length + urlFlagCount;
  let level: Level = NONE;
  if (localScore >= THRESHOLDS.high) level = HIGH;
  else if (localScore >= THRESHOLDS.suspicious) level = SUSPICIOUS;
  else if (localScore >= THRESHOLDS.weakCombined && distinctWeak >= 2) level = SUSPICIOUS;
  if (urlSuspicious && level < SUSPICIOUS) level = SUSPICIOUS;

  // Deterministic overrides from confirmed threat intelligence.
  if (urlMalicious || fileLevel === "high") level = HIGH;
  else if (fileLevel === "suspicious" && level < SUSPICIOUS) level = SUSPICIOUS;

  // AI can raise or confirm, never lower.
  if (ai) {
    if (ai.riskLevel === "high") {
      const aiLevel: Level = aiGoodIndicators.length > 0 ? HIGH : SUSPICIOUS;
      if (aiLevel > level) level = aiLevel;
    } else if (ai.riskLevel === "suspicious" && level < SUSPICIOUS) {
      level = SUSPICIOUS;
    }
  }

  // ------------------------------------------------------ completeness
  const incomplete = (id: CheckId) => {
    const s = statusOf(id);
    return s === "unavailable" || s === "skipped";
  };
  const anyUnavailable = checks.some((c) => c.status === "unavailable");

  const hasUrls = urlChecks.length > 0;
  const urlRepIncomplete =
    hasUrls &&
    (incomplete("url_reputation") ||
      statusOf("url_reputation") === undefined ||
      urlChecks.some((u) => !u.reputation.some((r) => r.status === "no_match")) ||
      reputation.some((r) => r.status === "unavailable"));
  const aiIncomplete =
    kind === "message" && (incomplete("ai") || (!ai && statusOf("ai") !== "not_applicable"));
  const rulesIncomplete = incomplete("rules") || (kind === "message" && rules.signals.insufficient_content === true);

  let risk: RiskLevel = toRisk[level];
  if (level === NONE) {
    let unable = false;
    if (kind === "file") unable = true; // never likely_safe; file result alone cannot clear it
    else if (kind === "phone") unable = true; // a number alone, or a weak description, is never cleared
    else if (kind === "url") unable = !hasUrls || urlRepIncomplete || rulesIncomplete;
    else unable = rulesIncomplete || urlRepIncomplete || aiIncomplete;
    if (unable) risk = "unable";
  }

  // ------------------------------------------------------- categories
  const cats: ScamCategory[] = [...rules.categories, ...(ai?.categories ?? [])];
  for (const r of reputation) {
    if (r.status !== "malicious" && r.status !== "suspicious") continue;
    const t = r.threatTypes.join(" ").toLowerCase();
    if (/phish|social|credential/.test(t)) cats.push("credential_theft");
    if (/malware|trojan|virus|unwanted|ransom/.test(t)) cats.push("malicious_file");
  }
  if (kind === "file" && (fileLevel === "high" || fileLevel === "suspicious")) cats.push("malicious_file");
  let categories = uniq(cats);
  if ((risk === "high" || risk === "suspicious") && categories.length === 0) categories = ["other"];

  // ------------------------------------------------ evidence confidence
  const strongRuleSignals = ruleIndicators.filter((i) => i.evidence && i.points > 0).length;
  let evidenceConfidence: "low" | "medium" | "high";
  if (urlMalicious || fileLevel === "high" || strongRuleSignals >= 3) evidenceConfidence = "high";
  else if (
    risk === "unable" ||
    anyUnavailable ||
    (ruleIndicators.length > 0 && rules.score < THRESHOLDS.suspicious && level === NONE)
  ) {
    evidenceConfidence = "low";
  } else evidenceConfidence = "medium";

  return { riskLevel: risk, uiState: UI_STATE[risk], score, categories, evidenceConfidence };
}
