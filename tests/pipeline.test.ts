import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AggregateInput,
  AggregateOutput,
  FileReputationResult,
  RuleOutput,
  UrlReputationResult,
  ValidatedAi,
} from "@/lib/types";

const m = vi.hoisted(() => ({
  extractEntities: vi.fn(),
  runRules: vi.fn(),
  localUrlFlags: vi.fn(),
  normalizeUrl: vi.fn(),
  aggregate: vi.fn(),
  actionsFor: vi.fn(),
  baseLimitations: vi.fn(),
  describePhone: vi.fn(),
  phoneGuidance: vi.fn(),
  analyzeWithAi: vi.fn(),
  checkUrlReputation: vi.fn(),
  checkFileHash: vi.fn(),
}));

vi.mock("@/lib/urls/extract", () => ({ extractEntities: m.extractEntities }));
vi.mock("@/lib/analysis/rules", () => ({ runRules: m.runRules }));
vi.mock("@/lib/urls/local", () => ({ localUrlFlags: m.localUrlFlags, normalizeUrl: m.normalizeUrl }));
vi.mock("@/lib/analysis/scoring", () => ({ aggregate: m.aggregate }));
vi.mock("@/lib/analysis/guidance", () => ({ actionsFor: m.actionsFor, baseLimitations: m.baseLimitations }));
vi.mock("@/lib/phone/describe", () => ({ describePhone: m.describePhone, phoneGuidance: m.phoneGuidance, toE164: () => null }));
vi.mock("@/lib/ai/provider", () => ({ analyzeWithAi: m.analyzeWithAi }));
vi.mock("@/lib/urls/providers", () => ({ checkUrlReputation: m.checkUrlReputation, checkFileHash: m.checkFileHash }));

import { InputError, analyzeFile, analyzeMessage, analyzePhone, analyzeUrl } from "@/lib/analysis/pipeline";

const bi = (en: string, hi = "सरल हिंदी वाक्य।") => ({ en, hi });
const SHA = "c".repeat(64);

const rep = (provider: string, status: UrlReputationResult["status"], detail?: string): UrlReputationResult => ({
  provider,
  status,
  threatTypes: [],
  checkedAt: new Date().toISOString(),
  ...(detail ? { detail } : {}),
});

const ruleOut = (over: Partial<RuleOutput> = {}): RuleOutput => ({
  indicators: [],
  categories: [],
  score: 0,
  signals: {},
  ...over,
});

function ai(over: Partial<ValidatedAi> = {}): ValidatedAi {
  return {
    categories: [],
    riskLevel: "low",
    evidenceConfidence: "medium",
    summary: bi("AI summary."),
    indicators: [],
    recommendedActions: [],
    limitations: [],
    ...over,
  };
}

/** Plausible stand-in for the engine's aggregate: provider malicious => high, rules score drives the rest. */
function fakeAggregate(input: AggregateInput): AggregateOutput {
  const statuses = [
    ...input.urlChecks.flatMap((c) => c.reputation.map((r) => r.status as string)),
    ...(input.fileCheck ? [input.fileCheck.reputation.status as string] : []),
  ];
  let riskLevel: AggregateOutput["riskLevel"] = "unable";
  if (statuses.includes("malicious") || input.rules.score >= 60) riskLevel = "high";
  else if (statuses.includes("suspicious") || input.rules.score >= 30) riskLevel = "suspicious";
  else if (input.checks.every((c) => c.status !== "unavailable")) riskLevel = "no_clear_warning";
  return {
    riskLevel,
    uiState: riskLevel === "high" ? "potential_scam" : riskLevel === "suspicious" ? "suspicious" : riskLevel === "no_clear_warning" ? "likely_safe" : "unable",
    score: input.rules.score,
    categories: input.rules.categories,
    evidenceConfidence: "medium",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  m.extractEntities.mockImplementation((text: string) => ({
    urls: text.match(/https?:\/\/\S+/g) ?? [],
    phones: [],
    upiIds: [],
    emails: [],
  }));
  m.runRules.mockReturnValue(ruleOut());
  m.localUrlFlags.mockImplementation((u: string) => {
    try {
      return { url: u, hostname: new URL(u).hostname, flags: [] };
    } catch {
      return null;
    }
  });
  m.normalizeUrl.mockImplementation((u: string) => (/^https?:\/\//.test(u) ? u : /^[\w.-]+\.[a-z]{2,}/i.test(u) ? `http://${u}` : null));
  m.aggregate.mockImplementation(fakeAggregate);
  m.actionsFor.mockReturnValue([bi("Never share your OTP.")]);
  m.baseLimitations.mockReturnValue([bi("This is not proof that a message is genuine.")]);
  m.describePhone.mockReturnValue({ kind: "indian_mobile", masked: "+91 ••••• ••123", description: bi("An Indian mobile number.") });
  m.phoneGuidance.mockReturnValue([bi("End the call and call back on an official number.")]);
  m.analyzeWithAi.mockResolvedValue({ status: "ran", ai: ai() });
  m.checkUrlReputation.mockResolvedValue([rep("virustotal", "no_match")]);
  m.checkFileHash.mockResolvedValue({ provider: "virustotal", status: "no_detections", checkedAt: new Date().toISOString() } satisfies FileReputationResult);
});

const MSG = "Your SBI KYC is pending, update at http://sbi-kyc.example/login today";
const checkOf = (r: { checks: { id: string }[] }, id: string) => r.checks.find((c) => c.id === id) as { id: string; status: string; note?: { en: string } };

describe("analyzeMessage", () => {
  it("builds a full result and marks every check honestly when everything ran", async () => {
    const r = await analyzeMessage(MSG);
    expect(r.kind).toBe("message");
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(checkOf(r, "rules").status).toBe("ran");
    expect(checkOf(r, "ai").status).toBe("ran");
    expect(checkOf(r, "url_reputation").status).toBe("ran");
    expect(r.aiUsed).toBe(true);
    expect(r.summary.en).toBe("AI summary.");
    expect(r.urlChecks).toHaveLength(1);
    expect(m.aggregate.mock.calls[0][0].kind).toBe("message");
    expect(m.analyzeWithAi.mock.calls[0][0].text).toBe(MSG);
  });

  it("returns a result with url_reputation 'unavailable' when every provider is down", async () => {
    m.checkUrlReputation.mockResolvedValue([rep("virustotal", "unavailable", "provider error")]);
    const r = await analyzeMessage(MSG);
    expect(checkOf(r, "url_reputation").status).toBe("unavailable");
    expect(checkOf(r, "url_reputation").note?.en).toMatch(/could not check/i);
    expect(r.limitations.some((l) => /could not check the link's reputation/i.test(l.en))).toBe(true);
    expect(r.limitations.every((l) => l.hi.length > 0)).toBe(true);
    expect(checkOf(r, "ai").status).toBe("ran"); // the other checks still ran
    expect(r.riskLevel).not.toBe("no_clear_warning"); // never reads as clean
  });

  it("treats a thrown provider call as unavailable and still returns a result", async () => {
    m.checkUrlReputation.mockRejectedValue(new Error("boom"));
    const r = await analyzeMessage(MSG);
    expect(checkOf(r, "url_reputation").status).toBe("unavailable");
  });

  it("counts partial provider coverage as ran, with a note", async () => {
    m.checkUrlReputation.mockResolvedValue([rep("virustotal", "no_match"), rep("apivoid", "unavailable")]);
    const r = await analyzeMessage(MSG);
    expect(checkOf(r, "url_reputation").status).toBe("ran");
    expect(checkOf(r, "url_reputation").note?.en).toMatch(/some link-checking services/i);
  });

  it("marks url_reputation unavailable when only some of several links got a definitive answer", async () => {
    m.checkUrlReputation.mockImplementation(async (u: string) => [rep("virustotal", u.includes("two") ? "unavailable" : "no_match")]);
    const r = await analyzeMessage("see http://one.example/a and http://two.example/b now");
    expect(checkOf(r, "url_reputation").status).toBe("unavailable");
  });

  it("is not_applicable without links, and checks only the first 5 links", async () => {
    m.extractEntities.mockReturnValue({ urls: [], phones: [], upiIds: [], emails: [] });
    expect(checkOf(await analyzeMessage("no links here at all"), "url_reputation").status).toBe("not_applicable");
    expect(m.checkUrlReputation).not.toHaveBeenCalled();

    m.extractEntities.mockReturnValue({ urls: Array.from({ length: 7 }, (_, i) => `http://s${i}.example/`), phones: [], upiIds: [], emails: [] });
    const r = await analyzeMessage("many links");
    expect(m.checkUrlReputation).toHaveBeenCalledTimes(5);
    expect(r.urlChecks).toHaveLength(5);
    expect(checkOf(r, "url_reputation").status).toBe("unavailable");
    expect(r.limitations.some((l) => /first 5 links/.test(l.en))).toBe(true);
  });

  it("passes simulateOutage to the URL reputation layer and says it is simulated", async () => {
    m.checkUrlReputation.mockResolvedValue([rep("virustotal", "unavailable", "simulated outage (demo)")]);
    const r = await analyzeMessage(MSG, { simulateOutage: true });
    expect(m.checkUrlReputation).toHaveBeenCalledWith(expect.any(String), { simulateOutage: true });
    expect(checkOf(r, "url_reputation").note?.en).toMatch(/simulated/i);
    expect(checkOf(r, "ai").status).toBe("ran");
  });

  it("reports AI skipped / unavailable honestly and falls back to a rule-derived summary", async () => {
    m.analyzeWithAi.mockResolvedValue({ status: "skipped", ai: null });
    let r = await analyzeMessage(MSG);
    expect(checkOf(r, "ai").status).toBe("skipped");
    expect(r.aiUsed).toBe(false);
    expect(r.summary.en.length).toBeGreaterThan(10);
    expect(r.summary.hi.length).toBeGreaterThan(10);

    m.analyzeWithAi.mockResolvedValue({ status: "unavailable", ai: null });
    r = await analyzeMessage(MSG);
    expect(checkOf(r, "ai").status).toBe("unavailable");
    expect(r.limitations.some((l) => /AI explanation was not available/.test(l.en))).toBe(true);

    m.analyzeWithAi.mockRejectedValue(new Error("never happens, but must not crash"));
    r = await analyzeMessage(MSG);
    expect(checkOf(r, "ai").status).toBe("unavailable");
  });

  it("uses the rule-derived summary when the validator dropped the AI summary", async () => {
    m.analyzeWithAi.mockResolvedValue({ status: "ran", ai: ai({ summary: { en: "", hi: "" } }) });
    const r = await analyzeMessage(MSG);
    expect(r.summary.en).not.toBe("");
    expect(r.aiUsed).toBe(true);
  });

  it("turns provider findings and URL flags into indicators with bilingual explanations", async () => {
    m.localUrlFlags.mockImplementation((u: string) => ({
      url: u,
      hostname: "sbi-kyc.example",
      flags: [{ id: "brand_lookalike", explanation: bi("The address imitates a bank name."), points: 15 }],
    }));
    m.checkUrlReputation.mockResolvedValue([rep("virustotal", "malicious", "5 malicious and 0 suspicious out of 70 security engines")]);
    const r = await analyzeMessage(MSG);
    const prov = r.indicators.find((i) => i.type === "url_reputation")!;
    expect(prov.source).toBe("url_provider");
    expect(prov.explanation.en).toMatch(/VirusTotal reported this link as malicious/);
    expect(prov.explanation.hi).toMatch(/VirusTotal/);
    expect(prov.evidence).toBe("http://sbi-kyc.example/login");
    expect(r.indicators.find((i) => i.type === "link_risk")?.explanation.en).toMatch(/imitates/);
  });

  it("merges guidance with AI actions (deduped, max 6) and limitations", async () => {
    m.actionsFor.mockReturnValue([bi("Never share your OTP."), bi("A"), bi("B")]);
    m.analyzeWithAi.mockResolvedValue({
      status: "ran",
      ai: ai({
        recommendedActions: [bi("never share your otp!"), bi("C"), bi("D"), bi("E"), bi("F")],
        limitations: [bi("Sender not verified.")],
      }),
    });
    const r = await analyzeMessage(MSG);
    expect(r.recommendedActions.map((a) => a.en)).toEqual(["Never share your OTP.", "A", "B", "C", "D", "E"]);
    expect(r.limitations.map((l) => l.en)).toEqual(
      expect.arrayContaining(["This is not proof that a message is genuine.", "Sender not verified."]),
    );
  });

  it("does not duplicate an AI indicator that repeats a rule finding on the same evidence", async () => {
    m.runRules.mockReturnValue(
      ruleOut({ indicators: [{ id: "urgency", type: "urgency", source: "rule", evidence: "today", explanation: bi("Urgent."), points: 10 }] }),
    );
    m.analyzeWithAi.mockResolvedValue({
      status: "ran",
      ai: ai({ indicators: [{ id: "ai_urgency", type: "urgency", source: "ai", evidence: "today", explanation: bi("Again."), points: 0 }] }),
    });
    const r = await analyzeMessage(MSG);
    expect(r.indicators.filter((i) => i.type === "urgency")).toHaveLength(1);
  });

  it("AI output can never lower a provider-confirmed malicious result (even if aggregate misbehaves)", async () => {
    m.checkUrlReputation.mockResolvedValue([rep("virustotal", "malicious")]);
    m.analyzeWithAi.mockResolvedValue({ status: "ran", ai: ai({ riskLevel: "low", summary: bi("This looks fine and safe.") }) });
    // A buggy/AI-swayed aggregate that ignores the provider:
    m.aggregate.mockReturnValue({ riskLevel: "no_clear_warning", uiState: "likely_safe", score: 3, categories: [], evidenceConfidence: "high" });
    const r = await analyzeMessage(MSG);
    expect(r.riskLevel).toBe("high");
    expect(r.uiState).toBe("potential_scam");
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.summary.en).not.toBe("This looks fine and safe."); // contradicting AI summary is not shown

    // And with the fake (well-behaved) aggregate, the AI's low opinion changes nothing.
    m.aggregate.mockImplementation(fakeAggregate);
    const r2 = await analyzeMessage(MSG);
    expect(r2.riskLevel).toBe("high");
  });

  it("raises a provider 'suspicious' to at least suspicious", async () => {
    m.checkUrlReputation.mockResolvedValue([rep("virustotal", "suspicious")]);
    m.aggregate.mockReturnValue({ riskLevel: "no_clear_warning", uiState: "likely_safe", score: 0, categories: [], evidenceConfidence: "low" });
    expect((await analyzeMessage(MSG)).riskLevel).toBe("suspicious");
  });
});

describe("analyzeUrl", () => {
  it("throws InputError for an invalid URL", async () => {
    await expect(analyzeUrl("not a url")).rejects.toBeInstanceOf(InputError);
    await expect(analyzeUrl("   ")).rejects.toBeInstanceOf(InputError);
    await expect(analyzeUrl("x".repeat(3000))).rejects.toMatchObject({ code: "too_long" });
    const e = await analyzeUrl("not a url").catch((x) => x);
    expect(e.userMessage.en).not.toContain("not a url"); // never echoes input
  });

  it("builds a url result, runs rules on the URL text, and has no AI check", async () => {
    const r = await analyzeUrl("sbi-kyc.example/login");
    expect(r.kind).toBe("url");
    expect(m.runRules).toHaveBeenCalledWith("sbi-kyc.example/login");
    expect(checkOf(r, "ai").status).toBe("not_applicable");
    expect(checkOf(r, "url_reputation").status).toBe("ran");
    expect(m.aggregate.mock.calls[0][0].kind).toBe("url");
    expect(r.urlChecks[0].url).toBe("http://sbi-kyc.example/login");
    expect(r.aiUsed).toBe(false);
  });

  it("an outage gives 'unavailable' and not a clean state", async () => {
    m.checkUrlReputation.mockResolvedValue([rep("virustotal", "unavailable")]);
    const r = await analyzeUrl("https://sbi-kyc.example/login", { simulateOutage: true });
    expect(checkOf(r, "url_reputation").status).toBe("unavailable");
    expect(r.uiState).not.toBe("likely_safe");
    expect(r.limitations.some((l) => /could not check the link's reputation/i.test(l.en))).toBe(true);
  });

  it("a malicious provider result produces a high-risk result with a provider indicator", async () => {
    m.checkUrlReputation.mockResolvedValue([rep("virustotal", "malicious")]);
    const r = await analyzeUrl("https://sbi-kyc.example/login");
    expect(r.riskLevel).toBe("high");
    expect(r.indicators.some((i) => i.type === "url_reputation")).toBe(true);
  });
});

describe("analyzePhone", () => {
  it("with no description is 'unable' with format description and guidance, and no verdict", async () => {
    const r = await analyzePhone("+91 98765 43123", { channel: "call" });
    expect(r.kind).toBe("phone");
    expect(r.riskLevel).toBe("unable");
    expect(r.uiState).toBe("unable");
    expect(r.phone?.masked).toBe("+91 ••••• ••123");
    expect(r.recommendedActions.map((a) => a.en)).toContain("End the call and call back on an official number.");
    expect(r.indicators).toEqual([]);
    expect(m.aggregate).not.toHaveBeenCalled();
    expect(m.analyzeWithAi).not.toHaveBeenCalled();
    expect(m.phoneGuidance).toHaveBeenCalledWith("call", expect.objectContaining({ kind: "indian_mobile" }));
    for (const text of [r.summary, ...r.limitations]) expect(text.hi.length).toBeGreaterThan(0);
  });

  it("whitespace-only description counts as none", async () => {
    expect((await analyzePhone("9876543123", { description: "   " })).riskLevel).toBe("unable");
  });

  it("runs the description through the message analysis and keeps a scam verdict", async () => {
    m.runRules.mockReturnValue(ruleOut({ score: 80, categories: ["government_impersonation"] }));
    const r = await analyzePhone("9876543123", { channel: "call", description: "Caller said he is from CBI and asked me to transfer money." });
    expect(r.kind).toBe("phone");
    expect(r.riskLevel).toBe("high");
    expect(r.phone).toBeDefined();
    expect(m.runRules).toHaveBeenCalledWith("Caller said he is from CBI and asked me to transfer money.");
    expect(r.recommendedActions[0].en).toContain("End the call");
  });

  it("never reports 'likely safe' for a phone contact, even when the description looks harmless", async () => {
    const r = await analyzePhone("9876543123", { description: "He asked about my delivery time." });
    expect(r.uiState).toBe("unable");
    expect(r.riskLevel).toBe("unable");
    expect(r.summary.en).toMatch(/cannot judge the number/);
  });

  it("rejects an over-long description and an empty number", async () => {
    await expect(analyzePhone("9876543123", { description: "x".repeat(1001) })).rejects.toMatchObject({ code: "too_long" });
    await expect(analyzePhone("  ")).rejects.toBeInstanceOf(InputError);
  });
});

describe("analyzeFile", () => {
  const vt = (over: Partial<FileReputationResult>): FileReputationResult => ({
    provider: "virustotal",
    status: "no_detections",
    checkedAt: new Date().toISOString(),
    referenceUrl: `https://www.virustotal.com/gui/file/${SHA}`,
    ...over,
  });

  it("rejects invalid hashes before any lookup", async () => {
    for (const bad of ["", "abc", "z".repeat(64), "a".repeat(63)]) {
      await expect(analyzeFile(bad)).rejects.toBeInstanceOf(InputError);
    }
    expect(m.checkFileHash).not.toHaveBeenCalled();
  });

  it("malicious: high risk, file indicator naming the engine count, specific actions", async () => {
    m.checkFileHash.mockResolvedValue(
      vt({ status: "malicious", engineCounts: { malicious: 14, suspicious: 1, harmless: 30, undetected: 20 }, topThreatNames: ["Trojan.Banker"] }),
    );
    const r = await analyzeFile(SHA.toUpperCase(), { fileType: "app" });
    expect(m.checkFileHash).toHaveBeenCalledWith(SHA, { simulateOutage: undefined });
    expect(r.kind).toBe("file");
    expect(r.riskLevel).toBe("high");
    expect(r.uiState).toBe("potential_scam");
    expect(r.fileCheck?.sha256).toBe(SHA);
    expect(r.fileCheck?.reputation.status).toBe("malicious");
    const ind = r.indicators.find((i) => i.type === "file_reputation")!;
    expect(ind.source).toBe("file_provider");
    expect(ind.explanation.en).toMatch(/14 security engines on VirusTotal flagged this file as malicious/);
    expect(ind.explanation.hi).toContain("14");
    expect(r.categories).toContain("malicious_file");
    const actions = r.recommendedActions.map((a) => a.en).join(" | ");
    expect(actions).toMatch(/Do not open or run this file/);
    expect(actions).toMatch(/Google Play Store/);
    expect(actions).toMatch(/Lost money/);
    expect(m.aggregate.mock.calls[0][0].kind).toBe("file");
    expect(m.aggregate.mock.calls[0][0].fileCheck.sha256).toBe(SHA);
    expect(checkOf(r, "file_reputation").status).toBe("ran");
  });

  it("tailors the advice to the kind of file and says nothing type-specific for unknown types", async () => {
    m.checkFileHash.mockResolvedValue(vt({ status: "not_found" }));
    const advice = async (fileType?: "app" | "program" | "archive" | "document" | "other") =>
      (await analyzeFile(SHA, { fileType })).recommendedActions.map((a) => a.en).join(" | ");
    expect(await advice("app")).toMatch(/Google Play Store/);
    expect(await advice("program")).toMatch(/official website/);
    expect(await advice("archive")).toMatch(/hide a program/);
    expect(await advice("document")).toMatch(/Enable editing/);
    for (const t of [undefined, "other" as const]) {
      const a = await advice(t);
      expect(a).not.toMatch(/Play Store|official website|hide a program|Enable editing/);
      expect(a).toMatch(/Do not open or run this file/);
    }
    // Every piece of advice has Hindi too.
    const r = await analyzeFile(SHA, { fileType: "archive" });
    expect(r.recommendedActions.every((a) => a.hi.length > 0)).toBe(true);
  });

  it("is never likely_safe, whatever the file report and aggregate say", async () => {
    for (const status of ["no_detections", "not_found", "unavailable"] as const) {
      m.checkFileHash.mockResolvedValue(vt({ status }));
      m.aggregate.mockReturnValue({ riskLevel: "no_clear_warning", uiState: "likely_safe", score: 0, categories: [], evidenceConfidence: "high" });
      const r = await analyzeFile(SHA);
      expect(r.uiState).not.toBe("likely_safe");
      expect(r.indicators).toEqual([]);
    }
  });

  it("not found and unavailable say so honestly", async () => {
    m.checkFileHash.mockResolvedValue(vt({ status: "not_found" }));
    let r = await analyzeFile(SHA);
    expect(r.summary.en).toMatch(/not a sign that it is safe/);
    expect(r.limitations.some((l) => /does not mean the file is safe/.test(l.en))).toBe(true);
    expect(r.limitations.every((l) => l.hi.length > 0)).toBe(true);

    m.checkFileHash.mockResolvedValue(vt({ status: "unavailable" }));
    r = await analyzeFile(SHA, { simulateOutage: true });
    expect(m.checkFileHash).toHaveBeenLastCalledWith(SHA, { simulateOutage: true });
    expect(checkOf(r, "file_reputation").status).toBe("unavailable");
    expect(r.riskLevel).not.toBe("no_clear_warning");
    expect(r.summary.en).toMatch(/cannot check this file right now/);
  });
});

describe("a likely-safe result", () => {
  it("carries no scam categories and no AI warning notes", async () => {
    m.aggregate.mockReturnValue({
      riskLevel: "no_clear_warning",
      uiState: "likely_safe",
      score: 0,
      categories: ["credential_theft"],
      evidenceConfidence: "medium",
    });
    m.analyzeWithAi.mockResolvedValue({
      status: "ran",
      ai: ai({
        riskLevel: "low",
        categories: ["credential_theft"],
        indicators: [
          { id: "ai_credential_request", type: "credential_request", source: "ai", inferred: true, explanation: bi("Mentions a code."), points: 0 },
        ],
      }),
    });
    const r = await analyzeMessage("Your verification code is 413549. Never share it.");
    expect(r.uiState).toBe("likely_safe");
    expect(r.categories).toEqual([]);
    expect(r.indicators.filter((i) => i.source === "ai")).toEqual([]);
  });
  it("keeps categories and AI notes on a flagged result", async () => {
    m.aggregate.mockReturnValue({
      riskLevel: "suspicious",
      uiState: "suspicious",
      score: 30,
      categories: ["gambling_spam"],
      evidenceConfidence: "medium",
    });
    m.analyzeWithAi.mockResolvedValue({
      status: "ran",
      ai: ai({
        indicators: [
          { id: "ai_prize_bait", type: "prize_bait", source: "ai", inferred: true, explanation: bi("Promises free spins."), points: 0 },
        ],
      }),
    });
    const r = await analyzeMessage(MSG);
    expect(r.categories).toEqual(["gambling_spam"]);
    expect(r.indicators.filter((i) => i.source === "ai")).toHaveLength(1);
  });
});
