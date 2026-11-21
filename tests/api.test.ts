import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisResult } from "@/lib/types";

const m = vi.hoisted(() => ({
  analyzeMessage: vi.fn(),
  analyzeUrl: vi.fn(),
  analyzePhone: vi.fn(),
  analyzeFile: vi.fn(),
}));

vi.mock("@/lib/analysis/pipeline", async () => {
  const http = await import("@/lib/server/http");
  return { ...m, InputError: http.InputError };
});
vi.mock("next/server", () => ({ connection: async () => {} }));

import { InputError } from "@/lib/server/http";
import { resetRateLimits } from "@/lib/server/rate-limit";
import * as messageRoute from "@/app/api/analyze/message/route";
import * as urlRoute from "@/app/api/analyze/url/route";
import * as phoneRoute from "@/app/api/analyze/phone/route";
import * as fileRoute from "@/app/api/analyze/file/route";
import * as healthRoute from "@/app/api/health/route";

const RESULT = { id: "r1", kind: "message", riskLevel: "unable" } as unknown as AnalysisResult;
const SHA = "d".repeat(64);

let ipCounter = 0;
function post(path: string, body: unknown, opts: { ip?: string; raw?: string; headers?: Record<string, string> } = {}) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": opts.ip ?? `10.0.0.${++ipCounter}`, ...opts.headers },
    body: opts.raw ?? JSON.stringify(body),
  });
}
const msg = (text: string, extra: Record<string, unknown> = {}, opts = {}) =>
  messageRoute.POST(post("/api/analyze/message", { text, ...extra }, opts));

beforeEach(() => {
  resetRateLimits();
  vi.clearAllMocks();
  vi.spyOn(console, "info").mockImplementation(() => {});
  m.analyzeMessage.mockResolvedValue(RESULT);
  m.analyzeUrl.mockResolvedValue({ ...RESULT, kind: "url" });
  m.analyzePhone.mockResolvedValue({ ...RESULT, kind: "phone" });
  m.analyzeFile.mockResolvedValue({ ...RESULT, kind: "file" });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/analyze/message", () => {
  it("returns ok with the result and no-store caching", async () => {
    const res = await msg("Your account will be blocked, click now");
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: true, result: RESULT });
    expect(m.analyzeMessage).toHaveBeenCalledWith("Your account will be blocked, click now", { simulateOutage: false });
  });

  it("is POST only", () => {
    expect((messageRoute as Record<string, unknown>).GET).toBeUndefined();
    expect(typeof messageRoute.POST).toBe("function");
    // With Cache Components these must not be exported.
    expect((messageRoute as Record<string, unknown>).dynamic).toBeUndefined();
    expect((messageRoute as Record<string, unknown>).runtime).toBeUndefined();
  });

  it.each([
    ["invalid JSON", { raw: "{nope" }],
    ["JSON that is not an object", { raw: "[1,2]" }],
    ["empty body", { raw: "" }],
  ])("400 invalid_input for %s with a bilingual message", async (_n, o) => {
    const res = await messageRoute.POST(post("/api/analyze/message", null, o));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.ok).toBe(false);
    expect(j.error.code).toBe("invalid_input");
    expect(j.error.message.en).toBeTruthy();
    expect(j.error.message.hi).toBeTruthy();
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("400 for missing, wrong-typed or too-short text", async () => {
    for (const body of [{}, { text: 123 }, { text: "short" }, { text: "           " }, { text: "valid text here", lang: "fr" }, { text: "valid text here", simulateOutage: "yes" }]) {
      const res = await messageRoute.POST(post("/api/analyze/message", body));
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("invalid_input");
    }
    expect(m.analyzeMessage).not.toHaveBeenCalled();
  });

  it("accepts exactly 5000 chars and rejects 5001 with 413 too_long", async () => {
    expect((await msg("a".repeat(5000))).status).toBe(200);
    const res = await msg("a".repeat(5001));
    expect(res.status).toBe(413);
    expect((await res.json()).error.code).toBe("too_long");
  });

  it("rejects oversized bodies early using Content-Length, without reading them", async () => {
    const res = await messageRoute.POST(
      post("/api/analyze/message", { text: "ok text here" }, { headers: { "content-length": "9999999" } }),
    );
    expect(res.status).toBe(413);
    expect((await res.json()).error.code).toBe("too_long");
  });

  it("rejects oversized bodies even without a Content-Length (streamed)", async () => {
    const big = JSON.stringify({ text: "ok text here", pad: "z".repeat(200_000) });
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(big));
        c.close();
      },
    });
    const req = new Request("http://localhost/api/analyze/message", {
      method: "POST",
      headers: { "x-forwarded-for": "10.9.9.9" },
      body: stream,
      // @ts-expect-error duplex is required for streamed bodies in Node
      duplex: "half",
    });
    expect((await messageRoute.POST(req)).status).toBe(413);
  });

  it("never echoes user input in error responses", async () => {
    const secret = "SECRET-OTP-123456-xyz";
    const res = await messageRoute.POST(post("/api/analyze/message", { text: 42, extra: secret }));
    expect(await res.text()).not.toContain(secret);

    m.analyzeMessage.mockRejectedValue(new Error(`boom ${secret}`));
    const res2 = await msg(`please check this ${secret}`);
    expect(res2.status).toBe(500);
    const body = await res2.text();
    expect(body).not.toContain(secret);
    expect(JSON.parse(body).error.code).toBe("server_error");
  });

  it("maps InputError to 400/413 with its own fixed message", async () => {
    m.analyzeMessage.mockRejectedValue(new InputError("invalid_input", { en: "Bad.", hi: "गलत।" }));
    let res = await msg("valid text here");
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toEqual({ en: "Bad.", hi: "गलत।" });
    m.analyzeMessage.mockRejectedValue(new InputError("too_long", { en: "Long.", hi: "लंबा।" }));
    res = await msg("valid text here");
    expect(res.status).toBe(413);
  });

  it("rate limits to 60 requests per minute per IP and sets Retry-After", async () => {
    for (let i = 0; i < 60; i++) expect((await msg("valid text here", {}, { ip: "1.2.3.4" })).status).toBe(200);
    const res = await msg("valid text here", {}, { ip: "1.2.3.4" });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
    const j = await res.json();
    expect(j.error.code).toBe("rate_limited");
    expect(j.error.message.hi).toBeTruthy();
    // another client is unaffected
    expect((await msg("valid text here", {}, { ip: "5.6.7.8" })).status).toBe(200);
  });

  it("shares the rate-limit bucket across the analysis routes of a family", async () => {
    for (let i = 0; i < 60; i++) await msg("valid text here", {}, { ip: "9.9.9.9" });
    const res = await fileRoute.POST(post("/api/analyze/file", { sha256: SHA }, { ip: "9.9.9.9" }));
    expect(res.status).toBe(429);
  });

  describe("simulateOutage (the demo switch on the page)", () => {
    it("is off unless the request asks for it", async () => {
      await msg("valid text here");
      expect(m.analyzeMessage).toHaveBeenLastCalledWith("valid text here", { simulateOutage: false });
      await msg("valid text here", { simulateOutage: false });
      expect(m.analyzeMessage).toHaveBeenLastCalledWith("valid text here", { simulateOutage: false });
    });
    it("is honored when the request sets it to true, on every route that supports it", async () => {
      await msg("valid text here", { simulateOutage: true });
      expect(m.analyzeMessage).toHaveBeenLastCalledWith("valid text here", { simulateOutage: true });
      await urlRoute.POST(post("/api/analyze/url", { url: "https://a.example", simulateOutage: true }));
      expect(m.analyzeUrl).toHaveBeenLastCalledWith("https://a.example", { simulateOutage: true });
      await fileRoute.POST(post("/api/analyze/file", { sha256: SHA, simulateOutage: true }));
      expect(m.analyzeFile).toHaveBeenLastCalledWith(SHA, { simulateOutage: true });
      await phoneRoute.POST(post("/api/analyze/phone", { number: "9876543210", simulateOutage: true }));
      expect(m.analyzePhone).toHaveBeenLastCalledWith("9876543210", undefined, { simulateOutage: true });
    });
    it("only an exact boolean true counts", async () => {
      expect((await msg("valid text here", { simulateOutage: "yes" as unknown as boolean })).status).toBe(400);
    });
  });
});

describe("POST /api/analyze/url", () => {
  it("validates and runs", async () => {
    expect((await urlRoute.POST(post("/api/analyze/url", { url: "https://a.example/x" }))).status).toBe(200);
    expect((await urlRoute.POST(post("/api/analyze/url", {}))).status).toBe(400);
    expect((await urlRoute.POST(post("/api/analyze/url", { url: "  " }))).status).toBe(400);
  });
  it("413 when longer than 2048 chars", async () => {
    const res = await urlRoute.POST(post("/api/analyze/url", { url: "https://a.example/" + "a".repeat(2100) }));
    expect(res.status).toBe(413);
    expect((await res.json()).error.code).toBe("too_long");
  });
});

describe("POST /api/analyze/phone", () => {
  it("accepts a number alone, or with channel and description", async () => {
    expect((await phoneRoute.POST(post("/api/analyze/phone", { number: "9876543210" }))).status).toBe(200);
    expect(m.analyzePhone).toHaveBeenLastCalledWith("9876543210", undefined, { simulateOutage: false });
    await phoneRoute.POST(post("/api/analyze/phone", { number: "9876543210", context: { channel: "sms", description: "asked for OTP" } }));
    expect(m.analyzePhone).toHaveBeenLastCalledWith("9876543210", { channel: "sms", description: "asked for OTP" }, { simulateOutage: false });
  });
  it("validates number, channel and description limits", async () => {
    expect((await phoneRoute.POST(post("/api/analyze/phone", { number: "" }))).status).toBe(400);
    expect((await phoneRoute.POST(post("/api/analyze/phone", { number: "9876543210", context: { channel: "fax" } }))).status).toBe(400);
    expect((await phoneRoute.POST(post("/api/analyze/phone", { number: "1".repeat(41) }))).status).toBe(413);
    const res = await phoneRoute.POST(post("/api/analyze/phone", { number: "9876543210", context: { description: "x".repeat(1001) } }));
    expect(res.status).toBe(413);
    expect((await res.json()).error.code).toBe("too_long");
  });
});

describe("POST /api/analyze/file", () => {
  it("accepts a 64-hex hash only", async () => {
    expect((await fileRoute.POST(post("/api/analyze/file", { sha256: SHA }))).status).toBe(200);
    for (const bad of ["", "abc", "g".repeat(64), "d".repeat(65), SHA + "\n"]) {
      const res = await fileRoute.POST(post("/api/analyze/file", { sha256: bad }));
      expect(res.status).toBe(400);
    }
    expect((await fileRoute.POST(post("/api/analyze/file", {}))).status).toBe(400);
  });
});

describe("GET /api/health", () => {
  it("reports configured providers as booleans and never leaks keys", async () => {
    vi.stubEnv("GEMINI_API_KEY", "gem-secret-key");
    vi.stubEnv("VIRUSTOTAL_API_KEY", "vt-secret-key");
    vi.stubEnv("APIVOID_API_KEY", "");
    const res = await healthRoute.GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    expect(text).not.toContain("secret");
    expect(JSON.parse(text)).toMatchObject({ ok: true, providers: { ai: true, virustotal: true, apivoid: false } });
  });
  it("reports false when nothing is configured", async () => {
    for (const name of ["GEMINI_API_KEY", "OPENROUTER_API_KEY", "OPENCODE_API_KEY", "VIRUSTOTAL_API_KEY", "APIVOID_API_KEY", "IPQS_API_KEY"]) {
      vi.stubEnv(name, "");
    }
    const j = await (await healthRoute.GET()).json();
    expect(j.providers).toEqual({
      ai: false,
      gemini: false,
      openrouter: false,
      opencode: false,
      aiVision: false,
      virustotal: false,
      apivoid: false,
      ipqs: false,
    });
  });
});
