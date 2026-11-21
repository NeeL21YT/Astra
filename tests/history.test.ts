import { describe, expect, it } from "vitest";
import {
  HISTORY_MAX,
  HISTORY_TTL_MS,
  addEntry,
  parseHistory,
  pruneExpired,
  toEntry,
} from "@/lib/client/history";
import type { HistoryEntry } from "@/lib/client/history";
import type { AnalysisResult } from "@/lib/types";

const NOW = 1_800_000_000_000;

function result(over: Partial<AnalysisResult>): AnalysisResult {
  return {
    id: "r1",
    kind: "message",
    createdAt: new Date(NOW).toISOString(),
    riskLevel: "high",
    uiState: "potential_scam",
    score: 80,
    categories: ["banking_kyc"],
    summary: { en: "SECRET SUMMARY", hi: "SECRET" },
    indicators: [{ id: "x", type: "urgency", source: "rule", evidence: "send your OTP now", explanation: { en: "", hi: "" }, points: 5 }],
    urlChecks: [],
    recommendedActions: [],
    limitations: [],
    evidenceConfidence: "high",
    checks: [],
    aiUsed: false,
    ...over,
  };
}

const entry = (id: string, at: number): HistoryEntry => ({ id, at, kind: "url", uiState: "unable" });

describe("history entries", () => {
  it("keeps only a small summary and never message text, evidence or summaries", () => {
    const e = toEntry(result({}), NOW);
    expect(e).toEqual({ id: "r1", at: NOW, kind: "message", uiState: "potential_scam" });
    const json = JSON.stringify(e);
    expect(json).not.toContain("OTP");
    expect(json).not.toContain("SECRET");
  });
  it("labels a link by host name only, a number by its masked form, a file by a fingerprint prefix", () => {
    const url = result({
      kind: "url",
      urlChecks: [{ url: "https://evil.example/path?token=abc", hostname: "evil.example", flags: [], reputation: [] }],
    });
    expect(toEntry(url, NOW).label).toBe("evil.example");
    expect(JSON.stringify(toEntry(url, NOW))).not.toContain("token");

    const phone = result({
      kind: "phone",
      phone: { kind: "indian_mobile", masked: "+91 ••••• ••123", description: { en: "", hi: "" } },
    });
    expect(toEntry(phone, NOW).label).toBe("+91 ••••• ••123");

    const sha = "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f";
    const file = result({
      kind: "file",
      fileCheck: { sha256: sha, reputation: { provider: "virustotal", status: "not_found", checkedAt: "" } },
    });
    expect(toEntry(file, NOW).label).toBe("275a021b…");
  });
});

describe("expiry and caps", () => {
  it("drops entries older than the lifetime", () => {
    const kept = entry("new", NOW - HISTORY_TTL_MS + 1000);
    const gone = entry("old", NOW - HISTORY_TTL_MS - 1000);
    expect(pruneExpired([kept, gone], NOW).map((e) => e.id)).toEqual(["new"]);
  });
  it("puts the newest first, replaces a repeated id, and caps the list", () => {
    let list: HistoryEntry[] = [];
    for (let i = 0; i < HISTORY_MAX + 5; i++) list = addEntry(list, entry(`e${i}`, NOW), NOW);
    expect(list).toHaveLength(HISTORY_MAX);
    expect(list[0].id).toBe(`e${HISTORY_MAX + 4}`);
    const again = addEntry(list, entry("e10", NOW), NOW);
    expect(again.filter((e) => e.id === "e10")).toHaveLength(1);
    expect(again[0].id).toBe("e10");
  });
  it("prunes expired entries when adding", () => {
    const list = addEntry([entry("old", NOW - HISTORY_TTL_MS - 1)], entry("fresh", NOW), NOW);
    expect(list.map((e) => e.id)).toEqual(["fresh"]);
  });
});

describe("parseHistory", () => {
  it("is off and empty when nothing is stored", () => {
    expect(parseHistory(null, NOW)).toEqual({ enabled: false, entries: [] });
  });
  it("treats malformed or tampered JSON as off, never throws", () => {
    expect(parseHistory("{not json", NOW)).toEqual({ enabled: false, entries: [] });
    expect(parseHistory('{"enabled":"yes","entries":[]}', NOW).enabled).toBe(false);
  });
  it("discards invalid entries and expired ones, keeps good ones", () => {
    const good = entry("ok", NOW - 1000);
    const raw = JSON.stringify({
      enabled: true,
      entries: [good, { id: 1 }, { ...good, id: "bad-kind", kind: "other" }, entry("old", NOW - HISTORY_TTL_MS - 5)],
    });
    expect(parseHistory(raw, NOW)).toEqual({ enabled: true, entries: [good] });
  });
  it("ignores entries dated far in the future", () => {
    const raw = JSON.stringify({ enabled: true, entries: [entry("future", NOW + 10 * 60_000)] });
    expect(parseHistory(raw, NOW).entries).toEqual([]);
  });
});
