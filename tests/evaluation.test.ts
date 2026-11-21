/**
 * Evaluation of ASTRA's deterministic rule engine on a synthetic labeled set (spec section 16).
 *
 * Scope: rules + local URL flags + aggregate() only. No network, no AI, no link-reputation
 * providers. The AI check is marked "not_applicable" so aggregate() can run without it; because
 * of that it returns "unable" instead of "no_clear_warning" for unflagged messages, so we
 * evaluate on riskLevel only and treat "no_clear_warning" and "unable" as "not flagged".
 *
 * Rerun: npx vitest run tests/evaluation.test.ts
 */
import { describe, expect, it } from "vitest";
import { extractEntities } from "@/lib/urls/extract";
import { localUrlFlags } from "@/lib/urls/local";
import { runRules } from "@/lib/analysis/rules";
import { aggregate } from "@/lib/analysis/scoring";
import type { AggregateInput, CheckStatus, RiskLevel, RuleOutput, UrlCheck } from "@/lib/types";
import {
  EVAL_MESSAGES,
  KNOWN_MISSES,
  KNOWN_UNDER_CALLS,
  type EvalLabel,
  type EvalLanguage,
  type EvalMessage,
} from "./fixtures/eval-messages";

type Predicted = "scam" | "suspicious" | "not_flagged";

type Outcome = {
  msg: EvalMessage;
  rules: RuleOutput;
  riskLevel: RiskLevel;
  predicted: Predicted;
};

function evaluate(msg: EvalMessage): Outcome {
  const rules = runRules(msg.text);
  const urlChecks: UrlCheck[] = extractEntities(msg.text)
    .urls.map((u) => localUrlFlags(u))
    .filter((x): x is NonNullable<typeof x> => x !== null)
    // Local flags only: no reputation providers.
    .map((x) => ({ url: x.url, hostname: x.hostname, flags: x.flags, reputation: [] }));
  const checks: CheckStatus[] = [
    { id: "rules", status: "ran" },
    { id: "ai", status: "not_applicable" },
    { id: "url_reputation", status: urlChecks.length ? "unavailable" : "not_applicable" },
  ];
  const input: AggregateInput = { kind: "message", rules, urlChecks, ai: null, checks };
  const { riskLevel } = aggregate(input);
  const predicted: Predicted = riskLevel === "high" ? "scam" : riskLevel === "suspicious" ? "suspicious" : "not_flagged";
  return { msg, rules, riskLevel, predicted };
}

const outcomes: Outcome[] = EVAL_MESSAGES.map(evaluate);

const LABELS: EvalLabel[] = ["scam", "suspicious", "genuine"];
const LANGUAGES: EvalLanguage[] = ["en", "hi", "hinglish"];

const ratio = (num: number, den: number) => (den === 0 ? NaN : num / den);
const pct = (x: number) => (Number.isNaN(x) ? "n/a" : `${(x * 100).toFixed(1)}%`);

function matrix(rows: Outcome[]) {
  const m: Record<EvalLabel, Record<Predicted, number>> = {
    scam: { scam: 0, suspicious: 0, not_flagged: 0 },
    suspicious: { scam: 0, suspicious: 0, not_flagged: 0 },
    genuine: { scam: 0, suspicious: 0, not_flagged: 0 },
  };
  for (const o of rows) m[o.msg.label][o.predicted]++;
  return m;
}

function metrics(rows: Outcome[]) {
  const positives = rows.filter((o) => o.msg.label !== "genuine");
  const genuine = rows.filter((o) => o.msg.label === "genuine");
  const high = rows.filter((o) => o.predicted === "scam");
  const flaggedPositives = positives.filter((o) => o.predicted !== "not_flagged");
  const scams = rows.filter((o) => o.msg.label === "scam");
  const scamsHigh = scams.filter((o) => o.predicted === "scam");
  const genuineFlagged = genuine.filter((o) => o.predicted !== "not_flagged");
  return {
    n: rows.length,
    positives: positives.length,
    genuine: genuine.length,
    flaggedRecall: ratio(flaggedPositives.length, positives.length),
    flaggedRecallCounts: `${flaggedPositives.length}/${positives.length}`,
    scamHighRecall: ratio(scamsHigh.length, scams.length),
    scamHighRecallCounts: `${scamsHigh.length}/${scams.length}`,
    highPrecision: ratio(scamsHigh.length, high.length),
    highPrecisionCounts: `${scamsHigh.length}/${high.length}`,
    fpr: ratio(genuineFlagged.length, genuine.length),
    fprCounts: `${genuineFlagged.length}/${genuine.length}`,
  };
}

/**
 * Flag-level errors: a scam/suspicious message not flagged, a genuine message flagged, or a
 * "suspicious"-labeled message that reaches "high".
 */
function isMiss(o: Outcome): boolean {
  if (o.msg.label === "genuine") return o.predicted !== "not_flagged";
  if (o.predicted === "not_flagged") return true;
  return o.msg.label === "suspicious" && o.predicted === "scam";
}
/** Scams flagged only as "suspicious": the user still gets a warning, but not the strongest one. */
const isUnderCall = (o: Outcome) => o.msg.label === "scam" && o.predicted === "suspicious";

const observedMisses = outcomes.filter(isMiss);
const observedUnderCalls = outcomes.filter(isUnderCall);

function kindOf(o: Outcome): string {
  const { label } = o.msg;
  if (label === "genuine") return o.predicted === "scam" ? "false positive (high)" : "false positive (suspicious)";
  if (o.predicted === "not_flagged") return "missed (not flagged)";
  if (isUnderCall(o)) return "under-call (scam shown as suspicious)";
  return "over-call (suspicious shown as high)";
}

const overall = metrics(outcomes);
const byLanguage = Object.fromEntries(LANGUAGES.map((l) => [l, metrics(outcomes.filter((o) => o.msg.language === l))])) as Record<
  EvalLanguage,
  ReturnType<typeof metrics>
>;

describe("evaluation: dataset shape", () => {
  it("has unique ids, a note on every message, and enough messages", () => {
    const ids = EVAL_MESSAGES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(EVAL_MESSAGES.length).toBeGreaterThanOrEqual(60);
    for (const m of EVAL_MESSAGES) {
      expect(m.note.length, m.id).toBeGreaterThan(5);
      expect(m.text.length, m.id).toBeGreaterThan(7);
    }
  });

  it("covers the required groups and all three languages", () => {
    const groups = new Set(EVAL_MESSAGES.map((m) => m.group));
    for (const g of ["banking_kyc", "upi", "delivery", "government", "job", "investment", "electricity", "family_emergency",
      "remote_access", "sextortion", "prize", "genuine_otp", "genuine_bank_alert", "genuine_delivery",
      "genuine_payment_reminder", "marketing", "ambiguous", "hindi", "hinglish", "prompt_injection", "no_link"]) {
      expect(groups.has(g), g).toBe(true);
    }
    expect(new Set(EVAL_MESSAGES.map((m) => m.language))).toEqual(new Set(LANGUAGES));
  });

  it("uses only reserved or placeholder identifiers (no real domains or numbers)", () => {
    for (const m of EVAL_MESSAGES) {
      for (const url of extractEntities(m.text).urls) {
        const host = url.replace(/^https?:\/\//i, "").split(/[/?#:]/)[0].toLowerCase();
        const ok =
          host.endsWith(".example") ||
          host === "example.com" ||
          host.endsWith(".example.com") ||
          host === "bit.ly" || // shortener-flag test case; the path is a placeholder
          /^203\.0\.113\.\d+$/.test(host); // TEST-NET-3 documentation address
        expect(ok, `${m.id}: ${url}`).toBe(true);
      }
      for (const phone of extractEntities(m.text).phones) {
        expect(phone, m.id).toBe("+919876543210");
      }
    }
  });
});

describe("evaluation: hard invariants", () => {
  it("every prompt-injection message is flagged (suspicious or high)", () => {
    const rows = outcomes.filter((o) => o.msg.group === "prompt_injection");
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for (const o of rows) expect(o.predicted, o.msg.id).not.toBe("not_flagged");
  });

  it("an instruction aimed at the checker never lowers the result (same scam with and without it)", () => {
    for (const o of outcomes.filter((x) => x.msg.group === "prompt_injection")) {
      const stripped = o.msg.text.replace(/^[^.]*(ignore|disregard|note to|system:)[^.]*\.\s*/i, "");
      if (stripped === o.msg.text) continue;
      const base = runRules(stripped).score;
      expect(o.rules.score, o.msg.id).toBeGreaterThanOrEqual(base);
    }
  });

  it("security advisories and OTP safety advice are never high", () => {
    const rows = outcomes.filter((o) => ["genuine_advisory", "genuine_otp"].includes(o.msg.group));
    expect(rows.length).toBeGreaterThanOrEqual(8);
    for (const o of rows) expect(o.predicted, o.msg.id).not.toBe("scam");
  });

  it("no genuine message is high", () => {
    for (const o of outcomes.filter((x) => x.msg.label === "genuine")) {
      expect(o.predicted, o.msg.id).not.toBe("scam");
    }
  });

  it("every evidence string is an exact substring of the message text", () => {
    for (const o of outcomes) {
      for (const ind of o.rules.indicators) {
        if (ind.evidence !== undefined) expect(o.msg.text.includes(ind.evidence), `${o.msg.id}/${ind.id}`).toBe(true);
      }
    }
  });

  it("the engine never returns a 'likely safe' style level without the AI check", () => {
    for (const o of outcomes) expect(["high", "suspicious", "no_clear_warning", "unable"]).toContain(o.riskLevel);
  });
});

describe("evaluation: report and regression guards", () => {
  it("prints the confusion matrix, metrics, and misclassified messages", () => {
    const m = matrix(outcomes);
    const lines: string[] = [];
    lines.push("");
    lines.push("ASTRA rule-engine evaluation (rules + local URL flags only; no AI, no reputation providers)");
    lines.push(`Messages: ${overall.n} (${LABELS.map((l) => `${l}=${outcomes.filter((o) => o.msg.label === l).length}`).join(", ")})`);
    lines.push("");
    lines.push("Confusion matrix (rows = true label, columns = predicted)");
    lines.push(["true \\ predicted".padEnd(18), "high".padStart(8), "suspicious".padStart(12), "not flagged".padStart(13)].join(""));
    for (const l of LABELS) {
      lines.push(
        [l.padEnd(18), String(m[l].scam).padStart(8), String(m[l].suspicious).padStart(12), String(m[l].not_flagged).padStart(13)].join(""),
      );
    }
    lines.push("");
    lines.push(["slice".padEnd(10), "n".padStart(4), "flagged recall".padStart(22), "scam->high recall".padStart(22), "high precision".padStart(20), "genuine FPR".padStart(18)].join(""));
    const row = (name: string, x: ReturnType<typeof metrics>) =>
      [
        name.padEnd(10),
        String(x.n).padStart(4),
        `${pct(x.flaggedRecall)} (${x.flaggedRecallCounts})`.padStart(22),
        `${pct(x.scamHighRecall)} (${x.scamHighRecallCounts})`.padStart(22),
        `${pct(x.highPrecision)} (${x.highPrecisionCounts})`.padStart(20),
        `${pct(x.fpr)} (${x.fprCounts})`.padStart(18),
      ].join("");
    lines.push(row("overall", overall));
    for (const l of LANGUAGES) lines.push(row(l, byLanguage[l]));
    lines.push("");
    lines.push(`Misses: flag-level errors (${observedMisses.length}), then under-calls (${observedUnderCalls.length}):`);
    for (const o of [...observedMisses, ...observedUnderCalls]) {
      lines.push(`  ${o.msg.id.padEnd(22)} group=${o.msg.group.padEnd(24)} label=${o.msg.label.padEnd(10)} predicted=${o.predicted.padEnd(12)} score=${String(o.rules.score).padStart(3)}  ${kindOf(o)}`);
    }
    console.log(lines.join("\n"));
    expect(lines.length).toBeGreaterThan(5);
  });

  it("the flag-level errors are exactly KNOWN_MISSES (any change must be examined and recorded)", () => {
    expect(observedMisses.map((o) => o.msg.id).sort()).toEqual(Object.keys(KNOWN_MISSES).sort());
    for (const reason of Object.values(KNOWN_MISSES)) expect(reason.length).toBeGreaterThan(10);
  });

  it("the scams shown only as suspicious are exactly KNOWN_UNDER_CALLS", () => {
    expect(observedUnderCalls.map((o) => o.msg.id).sort()).toEqual(Object.keys(KNOWN_UNDER_CALLS).sort());
    for (const reason of Object.values(KNOWN_UNDER_CALLS)) expect(reason.length).toBeGreaterThan(10);
  });

  // The thresholds below are regression guards set slightly under the measured values.
  // They are not accuracy claims: the dataset is small, synthetic, and written by the rule authors.
  it("meets the regression thresholds", () => {
    expect(overall.flaggedRecall).toBeGreaterThanOrEqual(THRESHOLDS.flaggedRecall);
    expect(overall.highPrecision).toBeGreaterThanOrEqual(THRESHOLDS.highPrecision);
    expect(overall.fpr).toBeLessThanOrEqual(THRESHOLDS.fpr);
    expect(overall.scamHighRecall).toBeGreaterThanOrEqual(THRESHOLDS.scamHighRecall);
    for (const l of LANGUAGES) {
      expect(byLanguage[l].fpr, `fpr ${l}`).toBeLessThanOrEqual(THRESHOLDS.fprByLanguage);
      expect(byLanguage[l].flaggedRecall, `recall ${l}`).toBeGreaterThanOrEqual(THRESHOLDS.flaggedRecallByLanguage);
    }
  });
});

// Measured when written: flagged recall 94.3%, scam->high recall 46.9%, high precision 100%,
// genuine FPR 6.1% (en 7.7%, hi 0%, hinglish 0%), flagged recall by language 92.3% / 100% / 100%.
const THRESHOLDS = {
  flaggedRecall: 0.9,
  scamHighRecall: 0.4,
  highPrecision: 0.95,
  fpr: 0.1,
  fprByLanguage: 0.1,
  flaggedRecallByLanguage: 0.88,
};
