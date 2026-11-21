import { describe, expect, it } from "vitest";
import { aggregate } from "@/lib/analysis/scoring";
import { runRules } from "@/lib/analysis/rules";
import { actionsFor, baseLimitations } from "@/lib/analysis/guidance";
import type {
  AggregateInput,
  CheckStatus,
  FileCheck,
  Indicator,
  RuleOutput,
  UrlCheck,
  ValidatedAi,
} from "@/lib/types";

const NOW = "2026-01-01T00:00:00.000Z";
const EMPTY_RULES: RuleOutput = { indicators: [], categories: [], score: 0, signals: {} };

const ranChecks = (over: Partial<Record<CheckStatus["id"], CheckStatus["status"]>> = {}): CheckStatus[] => [
  { id: "rules", status: over.rules ?? "ran" },
  { id: "ai", status: over.ai ?? "ran" },
  { id: "url_reputation", status: over.url_reputation ?? "ran" },
];

const ai = (over: Partial<ValidatedAi> = {}): ValidatedAi => ({
  categories: [],
  riskLevel: "low",
  evidenceConfidence: "medium",
  summary: { en: "", hi: "" },
  indicators: [],
  recommendedActions: [],
  limitations: [],
  ...over,
});

const urlCheck = (status: "malicious" | "suspicious" | "no_match" | "unknown" | "unavailable", flags: UrlCheck["flags"] = []): UrlCheck => ({
  url: "https://example.com/",
  hostname: "example.com",
  flags,
  reputation: [{ provider: "t", status, threatTypes: status === "malicious" ? ["phishing"] : [], checkedAt: NOW }],
});

const file = (status: FileCheck["reputation"]["status"], malicious = 0, suspicious = 0): FileCheck => ({
  sha256: "a".repeat(64),
  reputation: {
    provider: "virustotal",
    status,
    engineCounts: { malicious, suspicious, harmless: 10, undetected: 50 },
    checkedAt: NOW,
  },
});

const msg = (over: Partial<AggregateInput> = {}): AggregateInput => ({
  kind: "message",
  rules: EMPTY_RULES,
  urlChecks: [],
  ai: ai(),
  checks: ranChecks({ url_reputation: "not_applicable" }),
  ...over,
});

const ind = (id: string, points: number, evidence = "x"): Indicator => ({
  id,
  type: "other",
  source: "rule",
  evidence,
  explanation: { en: "e", hi: "ह" },
  points,
});

describe("aggregate: levels and mapping", () => {
  it("rules score >= 55 is high; 20-54 suspicious; mapping to uiState", () => {
    const high = aggregate(msg({ rules: { ...EMPTY_RULES, score: 70, indicators: [ind("a", 35), ind("b", 35)] } }));
    expect(high).toMatchObject({ riskLevel: "high", uiState: "potential_scam" });
    const mid = aggregate(msg({ rules: { ...EMPTY_RULES, score: 35, indicators: [ind("a", 35)] } }));
    expect(mid).toMatchObject({ riskLevel: "suspicious", uiState: "suspicious" });
  });

  it("no indicators and every check ran gives no_clear_warning / likely_safe", () => {
    const out = aggregate(msg());
    expect(out).toMatchObject({ riskLevel: "no_clear_warning", uiState: "likely_safe", score: 0 });
    expect(out.evidenceConfidence).toBe("medium");
  });

  it("a single weak indicator stays below suspicious, two weak ones can combine", () => {
    expect(aggregate(msg({ rules: { ...EMPTY_RULES, score: 15, indicators: [ind("imp", 15)] } })).riskLevel).toBe("no_clear_warning");
    expect(
      aggregate(msg({ rules: { ...EMPTY_RULES, score: 15, indicators: [ind("a", 10), ind("b", 5)] } })).riskLevel,
    ).toBe("suspicious");
  });

  it("URL flag points add to the rules score", () => {
    const flags: UrlCheck["flags"] = [
      { id: "brand_lookalike", explanation: { en: "", hi: "" }, points: 20 },
      { id: "suspicious_tld", explanation: { en: "", hi: "" }, points: 5 },
    ];
    const out = aggregate(
      msg({
        rules: { ...EMPTY_RULES, score: 35, indicators: [ind("a", 35)] },
        urlChecks: [urlCheck("no_match", flags)],
        checks: ranChecks(),
      }),
    );
    expect(out.riskLevel).toBe("high");
    expect(out.score).toBe(60);
  });

  it("score is clamped to 0-100", () => {
    const out = aggregate(msg({ rules: { ...EMPTY_RULES, score: 100, indicators: [ind("a", 35)] }, urlChecks: [urlCheck("malicious")], checks: ranChecks() }));
    expect(out.score).toBe(100);
  });
});

describe("aggregate: provider and AI policy", () => {
  it("a malicious URL is high regardless of AI and rules", () => {
    const out = aggregate(msg({ urlChecks: [urlCheck("malicious")], checks: ranChecks(), ai: ai({ riskLevel: "low" }) }));
    expect(out.riskLevel).toBe("high");
    expect(out.evidenceConfidence).toBe("high");
    expect(out.categories).toContain("credential_theft");
  });

  it("AI can raise but never lower", () => {
    const rules = { ...EMPTY_RULES, score: 60, indicators: [ind("a", 35), ind("b", 25)] };
    expect(aggregate(msg({ rules, ai: ai({ riskLevel: "low" }) })).riskLevel).toBe("high");
    expect(aggregate(msg({ rules, ai: null, checks: ranChecks({ ai: "unavailable", url_reputation: "not_applicable" }) })).riskLevel).toBe("high");
    expect(
      aggregate(msg({ rules: { ...EMPTY_RULES, score: 25, indicators: [ind("a", 25)] }, ai: ai({ riskLevel: "high", indicators: [ind("ai1", 10, "span")] }) })).riskLevel,
    ).toBe("high");
  });

  it("AI-only high needs a real evidence span, otherwise it is capped at suspicious", () => {
    const inferred: Indicator = { ...ind("ai1", 10), evidence: undefined, inferred: true };
    expect(aggregate(msg({ ai: ai({ riskLevel: "high", indicators: [inferred] }) })).riskLevel).toBe("suspicious");
    expect(aggregate(msg({ ai: ai({ riskLevel: "high", indicators: [] }) })).riskLevel).toBe("suspicious");
    expect(aggregate(msg({ ai: ai({ riskLevel: "high", indicators: [ind("ai1", 10, "real span")] }) })).riskLevel).toBe("high");
  });

  it("AI suspicious raises no_clear_warning to suspicious", () => {
    expect(aggregate(msg({ ai: ai({ riskLevel: "suspicious" }) })).riskLevel).toBe("suspicious");
  });

  it("merges and dedupes categories from rules and AI", () => {
    const out = aggregate(
      msg({
        rules: { ...EMPTY_RULES, score: 60, categories: ["banking_kyc", "upi_payment"], indicators: [ind("a", 60)] },
        ai: ai({ categories: ["upi_payment", "credential_theft"] }),
      }),
    );
    expect(out.categories).toEqual(["banking_kyc", "upi_payment", "credential_theft"]);
  });

  it("suspicious/high with no category falls back to 'other'", () => {
    const out = aggregate(msg({ ai: ai({ riskLevel: "suspicious" }) }));
    expect(out.categories).toEqual(["other"]);
  });
});

describe("aggregate hard rule (i): likely_safe only when every check ran", () => {
  it("url_reputation unavailable with URLs present -> unable", () => {
    const out = aggregate(msg({ urlChecks: [urlCheck("unavailable")], checks: ranChecks({ url_reputation: "unavailable" }) }));
    expect(out).toMatchObject({ riskLevel: "unable", uiState: "unable" });
    expect(out.evidenceConfidence).toBe("low");
  });

  it("URLs present with only 'unknown' reputation is not declared clear", () => {
    const out = aggregate(msg({ urlChecks: [urlCheck("unknown")], checks: ranChecks() }));
    expect(out.riskLevel).toBe("unable");
  });

  it("URLs present and a provider said no_match -> allowed", () => {
    const out = aggregate(msg({ urlChecks: [urlCheck("no_match")], checks: ranChecks() }));
    expect(out).toMatchObject({ riskLevel: "no_clear_warning", uiState: "likely_safe" });
  });

  it("ai unavailable (or missing) -> unable", () => {
    expect(aggregate(msg({ ai: null, checks: ranChecks({ ai: "unavailable", url_reputation: "not_applicable" }) })).riskLevel).toBe("unable");
    expect(aggregate(msg({ ai: null })).riskLevel).toBe("unable");
  });

  it("empty or too-short input -> unable", () => {
    const rules = runRules("   ");
    expect(aggregate(msg({ rules })).riskLevel).toBe("unable");
    expect(aggregate(msg({ rules: runRules("hi") })).riskLevel).toBe("unable");
  });

  it("indicators that already make it suspicious/high are kept even if checks failed", () => {
    const rules = { ...EMPTY_RULES, score: 70, indicators: [ind("a", 35), ind("b", 35)] };
    const out = aggregate(msg({ rules, ai: null, urlChecks: [urlCheck("unavailable")], checks: ranChecks({ ai: "unavailable", url_reputation: "unavailable" }) }));
    expect(out).toMatchObject({ riskLevel: "high", uiState: "potential_scam" });
    expect(out.evidenceConfidence).toBe("low");
  });

  it("end to end: a genuine OTP notice is likely_safe only with all checks, otherwise unable", () => {
    const rules = runRules("Your OTP for login is 482913. Do not share it with anyone.");
    expect(aggregate(msg({ rules })).uiState).toBe("likely_safe");
    expect(aggregate(msg({ rules, ai: null, checks: ranChecks({ ai: "unavailable", url_reputation: "not_applicable" }) })).uiState).toBe("unable");
  });
});

describe("aggregate hard rule (ii): APK", () => {
  const apk = (fc: FileCheck | undefined, extra: Partial<AggregateInput> = {}): AggregateInput => ({
    kind: "file",
    rules: EMPTY_RULES,
    urlChecks: [],
    fileCheck: fc,
    ai: null,
    checks: [{ id: "file_reputation", status: "ran" }],
    ...extra,
  });

  it("never likely_safe: no detections, not found, unavailable, missing -> unable", () => {
    for (const fc of [file("no_detections"), file("not_found"), file("unavailable"), undefined]) {
      const out = aggregate(apk(fc));
      expect(out.riskLevel).toBe("unable");
      expect(out.uiState).toBe("unable");
    }
  });

  it("1-2 malicious engines or any suspicious -> suspicious", () => {
    expect(aggregate(apk(file("suspicious", 1, 0))).riskLevel).toBe("suspicious");
    expect(aggregate(apk(file("malicious", 2, 0))).riskLevel).toBe("suspicious");
    expect(aggregate(apk(file("suspicious", 0, 1))).riskLevel).toBe("suspicious");
  });

  it(">=3 malicious engines -> high with high confidence and a file category", () => {
    const out = aggregate(apk(file("malicious", 3, 0)));
    expect(out).toMatchObject({ riskLevel: "high", uiState: "potential_scam", evidenceConfidence: "high" });
    expect(out.categories).toContain("malicious_file");
  });

  it("ai cannot lower an APK verdict and cannot clear a clean one", () => {
    expect(aggregate(apk(file("malicious", 5, 0), { ai: ai({ riskLevel: "low" }) })).riskLevel).toBe("high");
    expect(aggregate(apk(file("no_detections"), { ai: ai({ riskLevel: "low" }) })).riskLevel).toBe("unable");
  });
});

describe("aggregate hard rule (iii): phone", () => {
  it("no rule indicators is always unable", () => {
    for (const checks of [ranChecks(), []]) {
      const out = aggregate({ kind: "phone", rules: EMPTY_RULES, urlChecks: [], ai: ai(), checks });
      expect(out).toMatchObject({ riskLevel: "unable", uiState: "unable" });
    }
  });

  it("a described scam context can raise it", () => {
    const rules = runRules("The caller said he was from SBI and asked me to share my OTP immediately.");
    const out = aggregate({ kind: "phone", rules, urlChecks: [], ai: null, checks: [{ id: "rules", status: "ran" }] });
    expect(["suspicious", "high"]).toContain(out.riskLevel);
  });
});

describe("aggregate hard rule (iv): evidence confidence", () => {
  it("high for 3+ rule signals with evidence", () => {
    const rules = { ...EMPTY_RULES, score: 70, indicators: [ind("a", 35), ind("b", 25), ind("c", 10)] };
    expect(aggregate(msg({ rules })).evidenceConfidence).toBe("high");
  });

  it("low for weak signals only or when a check is unavailable", () => {
    expect(aggregate(msg({ rules: { ...EMPTY_RULES, score: 10, indicators: [ind("u", 10)] } })).evidenceConfidence).toBe("low");
    expect(
      aggregate(msg({ rules: { ...EMPTY_RULES, score: 35, indicators: [ind("a", 35)] }, ai: null, checks: ranChecks({ ai: "unavailable", url_reputation: "not_applicable" }) })).evidenceConfidence,
    ).toBe("low");
  });

  it("medium otherwise", () => {
    expect(aggregate(msg({ rules: { ...EMPTY_RULES, score: 45, indicators: [ind("a", 35), ind("b", 10)] } })).evidenceConfidence).toBe("medium");
  });
});

describe("guidance", () => {
  const cats = ["banking_kyc", "upi_payment", "government_impersonation", "delivery_customs", "utility_disconnection", "job_task", "investment", "loan_credit", "fake_support", "remote_access_apk", "family_emergency", "sextortion", "prize_lottery", "credential_theft", "malicious_file", "other"] as const;
  const levels = ["high", "suspicious", "no_clear_warning", "unable"] as const;

  it("every category/level combination: max 6, deduped, bilingual, always has never-share, never says click/open", () => {
    for (const c of cats) {
      for (const l of levels) {
        const list = actionsFor([c], l);
        expect(list.length, `${c}/${l}`).toBeGreaterThan(0);
        expect(list.length).toBeLessThanOrEqual(6);
        expect(new Set(list.map((a) => a.en)).size).toBe(list.length);
        expect(list.some((a) => /Do not share OTPs, UPI PINs, passwords or card details/.test(a.en)), `${c}/${l}`).toBe(true);
        for (const a of list) {
          expect(/[ऀ-ॿ]/.test(a.hi)).toBe(true);
          expect(a.en).not.toMatch(/\b(?:click|tap)\b/i);
          expect(a.en).not.toMatch(/(?<!not )(?<!ignore any )\bopen (?:the|this) link/i);
          expect(a.en).not.toMatch(/\bsafe\b/i);
        }
      }
    }
  });

  it("many categories still respect the cap and keep the never-share line", () => {
    const list = actionsFor([...cats], "high");
    expect(list.length).toBeLessThanOrEqual(6);
    expect(list.some((a) => /Do not share OTPs/.test(a.en))).toBe(true);
  });

  it("is tailored per category and handles an empty list", () => {
    expect(actionsFor(["upi_payment"], "high")[0].en).toMatch(/UPI PIN/);
    expect(actionsFor(["banking_kyc"], "high")[0].en).toMatch(/bank/i);
    expect(actionsFor([], "unable").length).toBeGreaterThan(0);
    expect(actionsFor(["upi_payment"], "high").some((a) => /1930/.test(a.en))).toBe(true);
  });

  it("base limitations are bilingual and say the standard things", () => {
    const l = baseLimitations();
    const en = l.map((x) => x.en).join(" ");
    expect(en).toMatch(/not a guarantee of safety/i);
    expect(en).toMatch(/sender has not been verified/i);
    expect(en).toMatch(/New scams may not be recognized/i);
    for (const x of l) expect(/[ऀ-ॿ]/.test(x.hi)).toBe(true);
  });
});
