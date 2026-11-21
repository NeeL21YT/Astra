import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkImagePayload, cleanOcrText, extractTextFromImage } from "@/lib/ocr/read-text";
import { resetRateLimits } from "@/lib/server/rate-limit";
import { resetLlmCooldowns } from "@/lib/ai/llm";
import { POST } from "@/app/api/ocr/route";

// Tiny but real file headers, padded to a plausible base64 length.
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 1)]).toString("base64");
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(44, 1)]).toString("base64");
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([1, 2, 3, 4]), Buffer.from("WEBP"), Buffer.alloc(40, 1)]).toString("base64");

function geminiText(text: string) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
}

function req(body: unknown, ip = "9.9.9.9") {
  return new Request("http://localhost/api/ocr", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("checkImagePayload", () => {
  it("accepts real PNG, JPEG and WebP signatures", () => {
    expect(checkImagePayload(PNG, "image/png").ok).toBe(true);
    expect(checkImagePayload(JPEG, "image/jpeg").ok).toBe(true);
    expect(checkImagePayload(WEBP, "image/webp").ok).toBe(true);
  });
  it("rejects a file whose bytes do not match the declared type", () => {
    expect(checkImagePayload(PNG, "image/jpeg")).toEqual({ ok: false, reason: "bad_signature" });
    expect(checkImagePayload(JPEG, "image/webp")).toEqual({ ok: false, reason: "bad_signature" });
  });
  it("rejects text that is not base64", () => {
    const text = Buffer.from("hello this is not an image at all").toString("base64");
    expect(checkImagePayload(text, "image/png")).toEqual({ ok: false, reason: "bad_signature" });
    expect(checkImagePayload("not base64!!", "image/png")).toEqual({ ok: false, reason: "bad_base64" });
  });
  it("rejects an image over the size limit", () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(3_100_000, 1)]).toString("base64");
    expect(checkImagePayload(big, "image/jpeg")).toEqual({ ok: false, reason: "too_big" });
  });
});

describe("cleanOcrText", () => {
  it("removes code fences and control characters and trims", () => {
    expect(cleanOcrText("```\nHello\u0007 world\n```")).toBe("Hello world");
  });
  it("caps the length", () => {
    expect(cleanOcrText("a".repeat(9000)).length).toBe(5000);
  });
});

describe("extractTextFromImage", () => {
  beforeEach(() => {
    resetLlmCooldowns();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns the copied text and sends the picture as inline data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(geminiText("Your account will be blocked"));
    vi.stubGlobal("fetch", fetchMock);
    const out = await extractTextFromImage(PNG, "image/png");
    expect(out).toEqual({ status: "ok", text: "Your account will be blocked" });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.contents[0].parts[0].inlineData.mimeType).toBe("image/png");
    // The key goes in a header, never in the URL.
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("test-key");
    expect(fetchMock.mock.calls[0][1].headers["x-goog-api-key"]).toBe("test-key");
  });
  it("maps NO_TEXT to no_text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiText("NO_TEXT")));
    expect(await extractTextFromImage(PNG, "image/png")).toEqual({ status: "no_text" });
  });
  it("is unavailable without a key, on HTTP errors and on network errors", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(await extractTextFromImage(PNG, "image/png")).toEqual({ status: "unavailable" });
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 429 })));
    expect(await extractTextFromImage(PNG, "image/png")).toEqual({ status: "unavailable" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect(await extractTextFromImage(PNG, "image/png")).toEqual({ status: "unavailable" });
  });
});

describe("POST /api/ocr", () => {
  beforeEach(() => {
    resetRateLimits();
    resetLlmCooldowns();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns the text for a valid picture", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(geminiText("Hello")));
    const res = await POST(req({ image: PNG, mimeType: "image/png" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, text: "Hello", noText: false });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
  it("rejects a wrong mime type, a bad signature and junk input without calling Gemini", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await POST(req({ image: PNG, mimeType: "image/gif" }))).status).toBe(400);
    expect((await POST(req({ image: PNG, mimeType: "image/jpeg" }))).status).toBe(400);
    expect((await POST(req({ nope: 1 }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("shows a friendly message when no key is set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const res = await POST(req({ image: PNG, mimeType: "image/png" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.message.en).toMatch(/type or paste/);
  });
  it("rate limits after 20 pictures a minute", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => geminiText("x")));
    for (let i = 0; i < 20; i++) expect((await POST(req({ image: PNG, mimeType: "image/png" }, "5.5.5.5"))).status).toBe(200);
    const res = await POST(req({ image: PNG, mimeType: "image/png" }, "5.5.5.5"));
    expect(res.status).toBe(429);
  });
});
