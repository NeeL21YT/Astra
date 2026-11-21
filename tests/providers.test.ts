import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkFileHash, checkUrlReputation, resetProviderState } from "@/lib/urls/providers";
import { vtUrlId } from "@/lib/urls/providers/virustotal";

const SHA = "a".repeat(64);
const URL1 = "http://secure-bank-kyc.example/login?id=1";

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}
function mockFetch(...responses: Array<Response | Error | ((u: string, i: RequestInit) => Response | Promise<Response>)>) {
  const queue = [...responses];
  const f = vi.fn(async (u: string, i: RequestInit) => {
    const next = queue.length > 1 ? queue.shift()! : queue[0];
    if (next instanceof Error) throw next;
    if (typeof next === "function") return next(u, i);
    return next.clone();
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const urlObj = (stats: Record<string, number>, results: Record<string, unknown> = {}) => ({
  data: { id: "b".repeat(64), type: "url", attributes: { last_analysis_stats: stats, last_analysis_results: results } },
});
const stats = (m: number, s: number, h = 60, u = 10) => ({ malicious: m, suspicious: s, harmless: h, undetected: u });

beforeEach(() => {
  resetProviderState();
  vi.stubEnv("VIRUSTOTAL_API_KEY", "vt-key");
  vi.stubEnv("APIVOID_API_KEY", "");
  vi.stubEnv("VIRUSTOTAL_REQUESTS_PER_MINUTE", "");
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("VirusTotal URL lookup", () => {
  it("does a read-only GET on the base64url (no padding) id with the x-apikey header", async () => {
    const f = mockFetch(jsonRes(urlObj(stats(5, 0), { A: { category: "malicious", result: "phishing" }, B: { category: "malicious", result: "Phishing" }, C: { category: "suspicious", result: "malware" } })));
    const [r] = await checkUrlReputation(URL1);
    const [calledUrl, init] = f.mock.calls[0];
    expect(String(calledUrl)).toBe(`https://www.virustotal.com/api/v3/urls/${vtUrlId(URL1)}`);
    expect(String(calledUrl)).not.toContain("=");
    expect(Buffer.from(vtUrlId(URL1), "base64url").toString()).toBe(URL1);
    expect(init.method).toBe("GET");
    expect((init.headers as Record<string, string>)["x-apikey"]).toBe("vt-key");
    expect(r.provider).toBe("virustotal");
    expect(r.status).toBe("malicious");
    expect(r.threatTypes).toEqual(["phishing", "malware"]);
    expect(r.referenceUrl).toBe(`https://www.virustotal.com/gui/url/${"b".repeat(64)}`);
    expect(r.detail).toContain("5 malicious");
  });

  it.each([
    [stats(3, 0), "malicious"],
    [stats(2, 0), "suspicious"],
    [stats(1, 0), "suspicious"],
    [stats(0, 1), "suspicious"],
    [stats(0, 0), "no_match"],
    [{ malicious: 0, suspicious: 0, harmless: 0, undetected: 0 }, "unknown"],
  ])("maps stats %j to %s", async (st, expected) => {
    mockFetch(jsonRes(urlObj(st)));
    expect((await checkUrlReputation(URL1))[0].status).toBe(expected);
  });

  it("maps 404 NotFoundError to unknown (not safe)", async () => {
    mockFetch(jsonRes({ error: { code: "NotFoundError", message: "x" } }, 404));
    const [r] = await checkUrlReputation(URL1);
    expect(r.status).toBe("unknown");
    expect(r.referenceUrl).toBeUndefined();
  });

  it.each([401, 403, 429, 500, 503])("maps HTTP %s to unavailable", async (code) => {
    mockFetch(jsonRes({ error: { code: "X", message: "x" } }, code));
    expect((await checkUrlReputation(URL1))[0].status).toBe("unavailable");
  });

  it("maps malformed JSON, unexpected shapes and network errors to unavailable", async () => {
    mockFetch(new Response("{not json", { status: 200 }));
    expect((await checkUrlReputation(URL1))[0].status).toBe("unavailable");
    resetProviderState();
    mockFetch(jsonRes({ data: { attributes: {} } }));
    expect((await checkUrlReputation(URL1))[0].status).toBe("unavailable");
    resetProviderState();
    mockFetch(new Error("ECONNRESET"));
    expect((await checkUrlReputation(URL1))[0].status).toBe("unavailable");
  });

  it("times out after about 6 seconds as unavailable", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_u: string, init: RequestInit) =>
          new Promise((_res, rej) => init.signal?.addEventListener("abort", () => rej(new DOMException("Aborted", "AbortError")))),
      ),
    );
    const p = checkUrlReputation(URL1);
    await vi.advanceTimersByTimeAsync(6200);
    expect((await p)[0].status).toBe("unavailable");
  });

  it("caches definitive results for an hour (second call does not fetch)", async () => {
    const f = mockFetch(jsonRes(urlObj(stats(0, 0))));
    await checkUrlReputation(URL1);
    const again = await checkUrlReputation(URL1);
    expect(f).toHaveBeenCalledTimes(1);
    expect(again[0].status).toBe("no_match");
  });

  it("does not cache unavailable results", async () => {
    const f = mockFetch(jsonRes({}, 429), jsonRes(urlObj(stats(0, 0))));
    expect((await checkUrlReputation(URL1))[0].status).toBe("unavailable");
    expect((await checkUrlReputation(URL1))[0].status).toBe("no_match");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("refuses locally once the request budget (4 per minute) is used, without calling VirusTotal", async () => {
    const f = mockFetch(jsonRes(urlObj(stats(0, 0))));
    const out = [];
    for (let i = 0; i < 5; i++) out.push((await checkUrlReputation(`http://site${i}.example/`))[0]);
    expect(f).toHaveBeenCalledTimes(4);
    expect(out.slice(0, 4).every((r) => r.status === "no_match")).toBe(true);
    expect(out[4].status).toBe("unavailable");
  });

  it("simulateOutage makes no request and reports every provider unavailable", async () => {
    const f = mockFetch(jsonRes(urlObj(stats(5, 0))));
    const out = await checkUrlReputation(URL1, { simulateOutage: true });
    expect(f).not.toHaveBeenCalled();
    expect(out.length).toBeGreaterThanOrEqual(1);
    expect(out.every((r) => r.status === "unavailable" && /simulated/.test(r.detail ?? ""))).toBe(true);
  });

  it("with no provider configured returns one unavailable 'not configured' entry and makes no request", async () => {
    vi.stubEnv("VIRUSTOTAL_API_KEY", "");
    const f = mockFetch(jsonRes({}));
    const out = await checkUrlReputation(URL1);
    expect(f).not.toHaveBeenCalled();
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ provider: "virustotal", status: "unavailable", detail: "not configured" });
  });

  it("only ever calls fixed provider hosts (never the submitted URL)", async () => {
    vi.stubEnv("APIVOID_API_KEY", "av-key");
    const f = mockFetch((u) =>
      u.startsWith("https://api.apivoid.com") ? jsonRes({ blacklists: { detections: 0, engines_count: 40 } }) : jsonRes(urlObj(stats(0, 0))),
    );
    await checkUrlReputation("http://169.254.169.254/latest/meta-data");
    await checkUrlReputation("http://internal.corp.local/admin");
    for (const [u] of f.mock.calls) {
      expect(String(u)).toMatch(/^https:\/\/(www\.virustotal\.com\/api\/v3|api\.apivoid\.com\/v2)\//);
    }
  });
});

describe("VirusTotal file lookup", () => {
  it("rejects an invalid sha256 without any network call", async () => {
    const f = mockFetch(jsonRes({}));
    for (const bad of ["", "abc", "a".repeat(63), "a".repeat(65), "g".repeat(64), "../etc/passwd", ` ${"a".repeat(64)}`]) {
      expect((await checkFileHash(bad)).status).toBe("unavailable");
    }
    expect(f).not.toHaveBeenCalled();
  });

  it("maps 404 to not_found", async () => {
    const f = mockFetch(jsonRes({ error: { code: "NotFoundError", message: "x" } }, 404));
    const r = await checkFileHash(SHA);
    expect(String(f.mock.calls[0][0])).toBe(`https://www.virustotal.com/api/v3/files/${SHA}`);
    expect(r.status).toBe("not_found");
  });

  it("maps a flagged file: counts, top threat names, ISO dates, reference link", async () => {
    mockFetch(
      jsonRes({
        data: {
          attributes: {
            last_analysis_stats: stats(12, 2, 40, 10),
            last_analysis_results: {
              E1: { category: "malicious", result: "Trojan.Banker" },
              E2: { category: "malicious", result: "Trojan.Banker" },
              E3: { category: "malicious", result: "Android.Spy.X" },
              E4: { category: "malicious", result: "Riskware.Y" },
              E5: { category: "suspicious", result: "Generic.Z" },
              E6: { category: "undetected", result: null },
            },
            popular_threat_classification: { suggested_threat_label: "trojan.banker/androidos" },
            first_submission_date: 1700000000,
            last_analysis_date: 1700086400,
          },
        },
      }),
    );
    const r = await checkFileHash(SHA);
    expect(r.status).toBe("malicious");
    expect(r.engineCounts).toEqual({ malicious: 12, suspicious: 2, harmless: 40, undetected: 10 });
    // suggested label first, then the top 3 distinct engine result strings (by frequency, then name)
    expect(r.topThreatNames).toEqual(["trojan.banker/androidos", "Trojan.Banker", "Android.Spy.X", "Generic.Z"]);
    expect(r.firstSeen).toBe(new Date(1700000000 * 1000).toISOString());
    expect(r.lastAnalyzed).toBe(new Date(1700086400 * 1000).toISOString());
    expect(r.referenceUrl).toBe(`https://www.virustotal.com/gui/file/${SHA}`);
  });

  it.each([
    [stats(1, 0), "suspicious"],
    [stats(0, 2), "suspicious"],
    [stats(3, 0), "malicious"],
    [stats(0, 0), "no_detections"],
  ])("maps stats %j to %s", async (st, expected) => {
    mockFetch(jsonRes({ data: { attributes: { last_analysis_stats: st } } }));
    expect((await checkFileHash(SHA)).status).toBe(expected);
  });

  it("normalizes uppercase hashes and caches by hash", async () => {
    const f = mockFetch(jsonRes({ data: { attributes: { last_analysis_stats: stats(0, 0) } } }));
    await checkFileHash(SHA.toUpperCase());
    await checkFileHash(SHA);
    expect(f).toHaveBeenCalledTimes(1);
    expect(String(f.mock.calls[0][0])).toContain(SHA);
  });

  it.each([429, 401, 503])("maps HTTP %s to unavailable and does not cache it", async (code) => {
    const f = mockFetch(jsonRes({}, code), jsonRes({ data: { attributes: { last_analysis_stats: stats(0, 0) } } }));
    expect((await checkFileHash(SHA)).status).toBe("unavailable");
    expect((await checkFileHash(SHA)).status).toBe("no_detections");
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("maps malformed JSON, missing stats and network errors to unavailable", async () => {
    mockFetch(new Response("garbage", { status: 200 }));
    expect((await checkFileHash(SHA)).status).toBe("unavailable");
    resetProviderState();
    mockFetch(jsonRes({ data: { attributes: {} } }));
    expect((await checkFileHash(SHA)).status).toBe("unavailable");
    resetProviderState();
    mockFetch(new Error("boom"));
    expect((await checkFileHash(SHA)).status).toBe("unavailable");
  });

  it("simulateOutage makes no request", async () => {
    const f = mockFetch(jsonRes({}));
    expect((await checkFileHash(SHA, { simulateOutage: true })).status).toBe("unavailable");
    expect(f).not.toHaveBeenCalled();
  });

  it("is unavailable without a key and makes no request", async () => {
    vi.stubEnv("VIRUSTOTAL_API_KEY", "");
    const f = mockFetch(jsonRes({}));
    expect((await checkFileHash(SHA)).status).toBe("unavailable");
    expect(f).not.toHaveBeenCalled();
  });
});

describe("APIVoid (optional second provider)", () => {
  beforeEach(() => vi.stubEnv("APIVOID_API_KEY", "av-key"));

  const avBody = (detections: number) => ({
    host: "evil.example",
    blacklists: { detections, engines_count: 42, engines: { "0": { name: "EngineA", detected: detections > 0 } } },
    risk_score: { result: 90 },
  });

  it("runs next to VirusTotal in parallel, sending only the hostname with X-API-Key", async () => {
    const f = mockFetch((u) => (u.includes("apivoid") ? jsonRes(avBody(4)) : jsonRes(urlObj(stats(0, 0)))));
    const out = await checkUrlReputation("https://evil.example/path?q=secret#frag");
    expect(out.map((r) => r.provider).sort()).toEqual(["apivoid", "virustotal"]);
    expect(out.find((r) => r.provider === "apivoid")).toMatchObject({ status: "malicious", threatTypes: ["EngineA"] });
    const call = f.mock.calls.find(([u]) => String(u).includes("apivoid"))!;
    expect(String(call[0])).toBe("https://api.apivoid.com/v2/domain-reputation");
    expect(call[1].method).toBe("POST");
    expect((call[1].headers as Record<string, string>)["X-API-Key"]).toBe("av-key");
    expect(JSON.parse(String(call[1].body))).toEqual({ host: "evil.example" });
  });

  it("maps detections 0 / 1-2 / 3+ and tolerates one provider being down", async () => {
    mockFetch((u) => (u.includes("apivoid") ? jsonRes(avBody(1)) : jsonRes({}, 429)));
    const out = await checkUrlReputation("https://evil.example/");
    expect(out.find((r) => r.provider === "apivoid")?.status).toBe("suspicious");
    expect(out.find((r) => r.provider === "virustotal")?.status).toBe("unavailable");
  });

  it("treats malformed responses and IP hosts safely", async () => {
    vi.stubEnv("VIRUSTOTAL_API_KEY", "");
    mockFetch(jsonRes({ unexpected: true }));
    expect((await checkUrlReputation("https://evil.example/"))[0].status).toBe("unavailable");
    const f = mockFetch(jsonRes(avBody(0)));
    expect((await checkUrlReputation("http://203.0.113.9/x"))[0].status).toBe("unknown");
    expect(f).not.toHaveBeenCalled();
  });

  it("is omitted when its key is not set", async () => {
    vi.stubEnv("APIVOID_API_KEY", "");
    mockFetch(jsonRes(urlObj(stats(0, 0))));
    const out = await checkUrlReputation("https://evil.example/");
    expect(out.map((r) => r.provider)).toEqual(["virustotal"]);
  });
});
