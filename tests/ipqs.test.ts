import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isIpqsConfigured, lookupPhoneReputation, mapIpqsResponse, resetIpqsState } from "@/lib/phone/providers/ipqs";
import { analyzePhone } from "@/lib/analysis/pipeline";

const OK = (over: Record<string, unknown> = {}) =>
  new Response(
    JSON.stringify({
      success: true,
      message: "Phone is valid.",
      valid: true,
      fraud_score: 20,
      recent_abuse: false,
      risky: false,
      spammer: false,
      VOIP: false,
      prepaid: false,
      line_type: "Wireless",
      carrier: "Jio",
      name: "Some Person",
      ...over,
    }),
    { status: 200 },
  );

beforeEach(() => {
  resetIpqsState();
  vi.stubEnv("IPQS_API_KEY", "ipqs-secret-key");
  for (const k of ["GEMINI_API_KEY", "OPENROUTER_API_KEY", "OPENCODE_API_KEY"]) vi.stubEnv(k, "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("mapIpqsResponse", () => {
  it("maps line type, carrier, VoIP and prepaid, and never keeps the owner name", () => {
    const r = mapIpqsResponse({ success: true, valid: true, line_type: "Wireless", carrier: "Jio", VOIP: true, prepaid: false, name: "Some Person" });
    expect(r).toMatchObject({ status: "ok", lineType: "mobile", carrier: "Jio", voip: true, prepaid: false, flags: [] });
    expect(JSON.stringify(r)).not.toContain("Some Person");
  });
  it("turns provider flags and a high fraud score into flags", () => {
    expect(mapIpqsResponse({ success: true, risky: true, recent_abuse: true, spammer: true, fraud_score: 90 }).flags).toEqual([
      "risky",
      "recent_abuse",
      "spammer",
      "high_fraud_score",
    ]);
    // Only IPQS's "risky" band (85 and up) counts as a flag.
    expect(mapIpqsResponse({ success: true, fraud_score: 84 }).flags).toEqual([]);
    expect(mapIpqsResponse({ success: true, fraud_score: 85 }).flags).toEqual(["high_fraud_score"]);
  });
  it("ignores null and N/A fields and understands other line types", () => {
    const r = mapIpqsResponse({ success: true, carrier: "N/A", line_type: "N/A", VOIP: null, risky: null });
    expect(r.carrier).toBeUndefined();
    expect(r.lineType).toBeUndefined();
    expect(r.voip).toBeUndefined();
    expect(mapIpqsResponse({ success: true, line_type: "Toll Free" }).lineType).toBe("toll_free");
    expect(mapIpqsResponse({ success: true, line_type: "Premium Rate" }).lineType).toBe("premium");
    expect(mapIpqsResponse({ success: true, line_type: "Landline" }).lineType).toBe("landline");
  });
  it("treats success:false or junk as unavailable", () => {
    expect(mapIpqsResponse({ success: false, message: "out of credits" }).status).toBe("unavailable");
    expect(mapIpqsResponse(null).status).toBe("unavailable");
    expect(mapIpqsResponse("nope").status).toBe("unavailable");
  });
});

describe("lookupPhoneReputation", () => {
  it("is null when no key is set (so the check is left out)", async () => {
    vi.stubEnv("IPQS_API_KEY", "");
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(isIpqsConfigured()).toBe(false);
    expect(await lookupPhoneReputation("+919876543210")).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
  it("calls the documented URL form with digits only and no plus sign", async () => {
    const f = vi.fn().mockResolvedValue(OK());
    vi.stubGlobal("fetch", f);
    const r = await lookupPhoneReputation("+919876543210");
    expect(r?.status).toBe("ok");
    expect(String(f.mock.calls[0][0])).toBe("https://www.ipqualityscore.com/api/json/phone/ipqs-secret-key/919876543210");
    expect(f.mock.calls[0][1].method).toBe("GET");
  });
  it("never leaks the key in the result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK()));
    expect(JSON.stringify(await lookupPhoneReputation("+919876543210"))).not.toContain("ipqs-secret-key");
  });
  it("caches definitive answers and does not cache failures", async () => {
    const f = vi.fn().mockResolvedValue(OK());
    vi.stubGlobal("fetch", f);
    await lookupPhoneReputation("+919876543210");
    await lookupPhoneReputation("+919876543210");
    expect(f).toHaveBeenCalledTimes(1);
    f.mockResolvedValue(new Response("{}", { status: 500 }));
    expect((await lookupPhoneReputation("+919876543211"))?.status).toBe("unavailable");
    expect((await lookupPhoneReputation("+919876543211"))?.status).toBe("unavailable");
    expect(f).toHaveBeenCalledTimes(3);
  });
  it("is unavailable on HTTP errors, network errors, success:false and bad numbers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    expect((await lookupPhoneReputation("+919876543210"))?.status).toBe("unavailable");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect((await lookupPhoneReputation("+919876543212"))?.status).toBe("unavailable");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK({ success: false })));
    expect((await lookupPhoneReputation("+919876543213"))?.status).toBe("unavailable");
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect((await lookupPhoneReputation("not a number"))?.status).toBe("unavailable");
    expect(f).not.toHaveBeenCalled();
  });
  it("simulateOutage never contacts the provider", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect((await lookupPhoneReputation("+919876543210", { simulateOutage: true }))?.status).toBe("unavailable");
    expect(f).not.toHaveBeenCalled();
  });
});

describe("analyzePhone with number reputation", () => {
  it("adds provider facts but stays 'unable' (never likely safe) when there is no flag", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK()));
    const r = await analyzePhone("+91 98765 43210", { channel: "call" });
    expect(r.phoneReputation?.status).toBe("ok");
    expect(r.phoneReputation?.carrier).toBe("Jio");
    expect(r.uiState).toBe("unable");
    expect(r.checks.find((c) => c.id === "phone_reputation")?.status).toBe("ran");
    expect(r.limitations.some((l) => /not necessarily genuine/.test(l.en))).toBe(true);
    expect(r.indicators).toEqual([]);
    expect(JSON.stringify(r)).not.toContain("Some Person");
  });
  it("shows a single flag with its source but does not change the verdict", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK({ spammer: true, fraud_score: 40 })));
    const r = await analyzePhone("+91 98765 43210");
    expect(r.phoneReputation?.flags).toEqual(["spammer"]);
    expect(r.uiState).toBe("unable");
    expect(r.riskLevel).toBe("unable");
    const ind = r.indicators.find((i) => i.source === "phone_provider")!;
    expect(ind.explanation.en).toMatch(/IPQualityScore/);
    expect(r.recommendedActions.some((a) => /Do not answer, call back or reply/.test(a.en))).toBe(false);
  });
  it("moves to 'suspicious' (not higher) when two or more provider flags agree", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(OK({ spammer: true, risky: true, fraud_score: 80 })));
    const r = await analyzePhone("+91 98765 43210");
    expect(r.phoneReputation?.flags).toEqual(["risky", "spammer"]);
    expect(r.uiState).toBe("suspicious");
    expect(r.riskLevel).toBe("suspicious");
    const ind = r.indicators.find((i) => i.source === "phone_provider")!;
    expect(ind.explanation.en).toMatch(/another company's record/);
    expect(ind.explanation.hi.length).toBeGreaterThan(0);
    expect(r.recommendedActions[0].en).toMatch(/Do not answer, call back or reply/);
  });
  it("shows 'unavailable' honestly and keeps working when the provider fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const r = await analyzePhone("+91 98765 43210");
    expect(r.phoneReputation?.status).toBe("unavailable");
    expect(r.checks.find((c) => c.id === "phone_reputation")?.status).toBe("unavailable");
    expect(r.uiState).toBe("unable");
  });
  it("leaves the check out entirely when no key is set, and skips sender names and junk", async () => {
    vi.stubEnv("IPQS_API_KEY", "");
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const r = await analyzePhone("+91 98765 43210");
    expect(r.phoneReputation).toBeUndefined();
    expect(r.checks.some((c) => c.id === "phone_reputation")).toBe(false);
    vi.stubEnv("IPQS_API_KEY", "ipqs-secret-key");
    await analyzePhone("AX-HDFCBK"); // a sender name is not a phone number: nothing is looked up
    expect(f).not.toHaveBeenCalled();
  });
});
