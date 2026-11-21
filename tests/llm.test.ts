import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateWithFallback, geminiModelIds, isLlmConfigured, llmProviderStatus, providerOrder, resetLlmCooldowns } from "@/lib/ai/llm";
import { analyzeWithAi } from "@/lib/ai/provider";
import { extractTextFromImage } from "@/lib/ocr/read-text";

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 1)]).toString("base64");

const gem = (text: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
const oai = (text: string) => new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 });
const fail = (status: number) => new Response(JSON.stringify({ error: { message: "x" } }), { status });

const REQ = {
  kind: "text" as const,
  system: "sys",
  user: "hello",
  maxTokens: 100,
  temperature: 0,
  budgetMs: 10_000,
  attemptMs: 5_000,
};

function setEnv(env: Record<string, string>) {
  for (const k of [
    "GEMINI_API_KEY", "GEMINI_MODEL", "OPENROUTER_API_KEY", "OPENROUTER_TEXT_MODEL", "OPENROUTER_VISION_MODEL",
    "OPENCODE_API_KEY", "OPENCODE_TEXT_MODEL", "OPENCODE_VISION_MODEL", "AI_PROVIDER_ORDER", "OPENROUTER_ALLOW_DATA_COLLECTION",
  ]) vi.stubEnv(k, env[k] ?? "");
}

const calls = (m: ReturnType<typeof vi.fn>) => m.mock.calls.map((c) => String(c[0]));

beforeEach(() => resetLlmCooldowns());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("configuration", () => {
  it("is not configured with no keys", () => {
    setEnv({});
    expect(isLlmConfigured("text")).toBe(false);
    expect(llmProviderStatus()).toEqual({ gemini: false, openrouter: false, opencode: false, vision: false });
  });
  it("needs both a key and a model for OpenRouter and OpenCode", () => {
    setEnv({ OPENROUTER_API_KEY: "k" });
    expect(isLlmConfigured("text")).toBe(false);
    setEnv({ OPENROUTER_API_KEY: "k", OPENROUTER_TEXT_MODEL: "a/b, c/d" });
    expect(isLlmConfigured("text")).toBe(true);
    expect(isLlmConfigured("vision")).toBe(false);
  });
  it("uses the default order and honors AI_PROVIDER_ORDER, ignoring junk", () => {
    setEnv({});
    expect(providerOrder()).toEqual(["gemini", "openrouter", "opencode"]);
    setEnv({ AI_PROVIDER_ORDER: "opencode, nope, openrouter, opencode" });
    expect(providerOrder()).toEqual(["opencode", "openrouter"]);
  });
  it("reads GEMINI_MODEL as a list: trims, drops junk and duplicates, caps at 5, and falls back to the default", () => {
    setEnv({});
    expect(geminiModelIds()).toEqual(["gemini-3.5-flash-lite"]);
    setEnv({ GEMINI_MODEL: " gemini-a , ../evil?x=1, gemini-b,gemini-a" });
    expect(geminiModelIds()).toEqual(["gemini-a", "gemini-b"]);
    setEnv({ GEMINI_MODEL: "../evil?x=1" });
    expect(geminiModelIds()).toEqual(["gemini-3.5-flash-lite"]);
    setEnv({ GEMINI_MODEL: "m1,m2,m3,m4,m5,m6,m7" });
    expect(geminiModelIds()).toEqual(["m1", "m2", "m3", "m4", "m5"]);
  });
});

describe("generateWithFallback", () => {
  it("uses Gemini first and stops there", async () => {
    setEnv({ GEMINI_API_KEY: "g", OPENROUTER_API_KEY: "o", OPENROUTER_TEXT_MODEL: "m/x" });
    const f = vi.fn().mockResolvedValue(gem("hi"));
    vi.stubGlobal("fetch", f);
    expect(await generateWithFallback(REQ)).toEqual({ ok: true, text: "hi", provider: "gemini" });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("falls back to OpenRouter when Gemini is rate limited, then skips Gemini while it cools down", async () => {
    setEnv({ GEMINI_API_KEY: "g", OPENROUTER_API_KEY: "o", OPENROUTER_TEXT_MODEL: "m/x" });
    const f = vi.fn().mockImplementation(async (url: string) => (String(url).includes("googleapis") ? fail(429) : oai("from openrouter")));
    vi.stubGlobal("fetch", f);
    expect(await generateWithFallback(REQ)).toEqual({ ok: true, text: "from openrouter", provider: "openrouter" });
    f.mockClear();
    expect((await generateWithFallback(REQ)) as { provider: string }).toMatchObject({ provider: "openrouter" });
    expect(calls(f).some((u) => u.includes("googleapis"))).toBe(false); // cooled down, not retried
  });

  it("walks through several models of one provider, then on to the next provider", async () => {
    setEnv({
      OPENROUTER_API_KEY: "o", OPENROUTER_TEXT_MODEL: "free/one,paid/two",
      OPENCODE_API_KEY: "c", OPENCODE_TEXT_MODEL: "zen-model",
    });
    const f = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const model = JSON.parse(String(init.body)).model;
      return model === "zen-model" ? oai("from zen") : fail(404);
    });
    vi.stubGlobal("fetch", f);
    expect(await generateWithFallback(REQ)).toEqual({ ok: true, text: "from zen", provider: "opencode" });
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("tries the next Gemini model before leaving Gemini, and does not retry a failed model during its cooldown", async () => {
    setEnv({ GEMINI_API_KEY: "g", GEMINI_MODEL: "gem-one,gem-two", OPENROUTER_API_KEY: "o", OPENROUTER_TEXT_MODEL: "m/x" });
    const f = vi.fn().mockImplementation(async (url: string) =>
      String(url).includes("/models/gem-one:") ? fail(404) : String(url).includes("/models/gem-two:") ? gem("from gem-two") : oai("from openrouter"));
    vi.stubGlobal("fetch", f);
    expect(await generateWithFallback(REQ)).toEqual({ ok: true, text: "from gem-two", provider: "gemini" });
    expect(calls(f)).toHaveLength(2); // gem-one failed, gem-two answered, OpenRouter never called
    f.mockClear();
    await generateWithFallback(REQ);
    expect(calls(f).some((u) => u.includes("gem-one"))).toBe(false);
  });

  it("moves on to the next provider once every Gemini model has failed", async () => {
    setEnv({ GEMINI_API_KEY: "g", GEMINI_MODEL: "gem-one,gem-two", OPENROUTER_API_KEY: "o", OPENROUTER_TEXT_MODEL: "m/x" });
    const f = vi.fn().mockImplementation(async (url: string) => (String(url).includes("googleapis") ? fail(429) : oai("from openrouter")));
    vi.stubGlobal("fetch", f);
    expect(await generateWithFallback(REQ)).toEqual({ ok: true, text: "from openrouter", provider: "openrouter" });
    expect(calls(f).filter((u) => u.includes("googleapis"))).toHaveLength(2);
  });

  it("treats an empty OpenAI-style answer as a failure and moves on", async () => {
    setEnv({ OPENROUTER_API_KEY: "o", OPENROUTER_TEXT_MODEL: "a/one,b/two" });
    const f = vi.fn().mockImplementation(async (_u: string, init: RequestInit) =>
      JSON.parse(String(init.body)).model === "a/one" ? oai("") : oai("real answer"));
    vi.stubGlobal("fetch", f);
    expect(await generateWithFallback(REQ)).toMatchObject({ ok: true, text: "real answer" });
  });

  it("moves on when accept() rejects an answer", async () => {
    setEnv({ GEMINI_API_KEY: "g", OPENROUTER_API_KEY: "o", OPENROUTER_TEXT_MODEL: "m/x" });
    const f = vi.fn().mockImplementation(async (url: string) => (String(url).includes("googleapis") ? gem("garbage") : oai("{\"ok\":true}")));
    vi.stubGlobal("fetch", f);
    const out = await generateWithFallback({ ...REQ, accept: (t) => t.startsWith("{") });
    expect(out).toMatchObject({ ok: true, provider: "openrouter" });
  });

  it("fails cleanly when every provider fails, and never throws on network errors", async () => {
    setEnv({ GEMINI_API_KEY: "g", OPENCODE_API_KEY: "c", OPENCODE_TEXT_MODEL: "z" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect(await generateWithFallback(REQ)).toEqual({ ok: false });
  });

  it("returns ok:false immediately when nothing is configured", async () => {
    setEnv({});
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await generateWithFallback(REQ)).toEqual({ ok: false });
    expect(f).not.toHaveBeenCalled();
  });

  it("sends keys in headers only, and asks OpenRouter to deny data collection unless allowed", async () => {
    setEnv({ OPENROUTER_API_KEY: "or-secret", OPENROUTER_TEXT_MODEL: "m/x" });
    const f = vi.fn().mockResolvedValue(oai("ok"));
    vi.stubGlobal("fetch", f);
    await generateWithFallback(REQ);
    expect(String(f.mock.calls[0][0])).not.toContain("or-secret");
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer or-secret");
    expect(JSON.parse(f.mock.calls[0][1].body).provider).toEqual({ data_collection: "deny" });

    resetLlmCooldowns();
    setEnv({ OPENROUTER_API_KEY: "or-secret", OPENROUTER_TEXT_MODEL: "m/x", OPENROUTER_ALLOW_DATA_COLLECTION: "1" });
    f.mockClear();
    await generateWithFallback(REQ);
    expect(JSON.parse(f.mock.calls[0][1].body).provider).toBeUndefined();
  });

  it("sends a picture as an image_url data URI to OpenAI-style providers", async () => {
    setEnv({ OPENCODE_API_KEY: "c", OPENCODE_VISION_MODEL: "vl-model" });
    const f = vi.fn().mockResolvedValue(oai("text in picture"));
    vi.stubGlobal("fetch", f);
    const out = await generateWithFallback({ ...REQ, kind: "vision", image: { base64: PNG, mime: "image/png" } });
    expect(out).toMatchObject({ ok: true, provider: "opencode" });
    const content = JSON.parse(f.mock.calls[0][1].body).messages[1].content;
    expect(content[1].image_url.url).toBe(`data:image/png;base64,${PNG}`);
  });
});

describe("message analysis through the chain", () => {
  const entities = { urls: [], phones: [], upiIds: [], emails: [] };
  const rules = { indicators: [], categories: [], score: 0, signals: {} };
  const validJson = JSON.stringify({
    categories: ["banking_kyc"],
    riskLevel: "high",
    evidenceConfidence: "high",
    summary: { en: "Looks like a scam.", hi: "यह धोखाधड़ी लगती है।" },
    indicators: [],
    recommendedActions: [{ en: "Do not click.", hi: "क्लिक न करें।" }],
    limitations: [{ en: "Not a guarantee.", hi: "यह गारंटी नहीं है।" }],
  });

  it("falls back to OpenRouter and parses JSON wrapped in a code fence", async () => {
    setEnv({ GEMINI_API_KEY: "g", OPENROUTER_API_KEY: "o", OPENROUTER_TEXT_MODEL: "m/x" });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) =>
      String(url).includes("googleapis") ? fail(503) : oai("```json\n" + validJson + "\n```")));
    const out = await analyzeWithAi({ text: "Your account is blocked, update KYC", entities, rules });
    expect(out.status).toBe("ran");
    expect(out.ai?.riskLevel).toBe("high");
  });

  it("moves on from a provider whose answer is not valid JSON", async () => {
    setEnv({ GEMINI_API_KEY: "g", OPENROUTER_API_KEY: "o", OPENROUTER_TEXT_MODEL: "m/x" });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) =>
      String(url).includes("googleapis") ? gem("sorry I cannot") : oai(validJson)));
    expect((await analyzeWithAi({ text: "Your account is blocked, update KYC", entities, rules })).status).toBe("ran");
  });

  it("is skipped with no providers and unavailable when all fail", async () => {
    setEnv({});
    expect((await analyzeWithAi({ text: "hello there friend", entities, rules })).status).toBe("skipped");
    setEnv({ GEMINI_API_KEY: "g" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fail(500)));
    expect((await analyzeWithAi({ text: "hello there friend", entities, rules })).status).toBe("unavailable");
  });
});

describe("picture reading through the chain", () => {
  it("falls back to the OpenRouter vision model when Gemini is down", async () => {
    setEnv({ GEMINI_API_KEY: "g", OPENROUTER_API_KEY: "o", OPENROUTER_VISION_MODEL: "vl/x" });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async (url: string) =>
      String(url).includes("googleapis") ? fail(429) : oai("Your account is blocked")));
    expect(await extractTextFromImage(PNG, "image/png")).toEqual({ status: "ok", text: "Your account is blocked" });
  });
  it("reports unavailable when only text models are configured for the fallback", async () => {
    setEnv({ OPENROUTER_API_KEY: "o", OPENROUTER_TEXT_MODEL: "text/only" });
    expect(await extractTextFromImage(PNG, "image/png")).toEqual({ status: "unavailable" });
  });
});
