// POST /api/ocr: read the text out of a screenshot or photo of a message.
// The picture is never stored or logged. The text goes back to the browser, where the person
// can check and correct it before anything is analyzed.
import { z } from "zod";
import type { Bilingual, OcrResponse } from "@/lib/types";
import { logEvent, startTimer } from "@/lib/privacy/safe-logging";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";
import { errorResponse, jsonResponse, readBodyLimited } from "@/lib/server/http";
import { OCR_MIME_TYPES, checkImagePayload, extractTextFromImage, isOcrConfigured } from "@/lib/ocr/read-text";

export const maxDuration = 30;

// JSON with base64 is about 4/3 of the image size; Vercel caps request bodies near 4.5 MB.
const MAX_BODY_BYTES = 4_200_000;

const schema = z.object({
  image: z.string().min(16).max(4_100_000),
  mimeType: z.enum(OCR_MIME_TYPES),
});

const UNAVAILABLE: Bilingual = {
  en: "Reading pictures is not available right now. Please type or paste the message instead.",
  hi: "अभी तस्वीर से पढ़ना उपलब्ध नहीं है। कृपया संदेश टाइप करें या पेस्ट करें।",
};
const BAD_IMAGE: Bilingual = {
  en: "We could not use this picture. Please choose a screenshot or photo (JPG, PNG or WebP).",
  hi: "हम इस तस्वीर का उपयोग नहीं कर सके। कृपया स्क्रीनशॉट या फोटो (JPG, PNG या WebP) चुनें।",
};

export async function POST(request: Request): Promise<Response> {
  const elapsed = startTimer();
  const finish = (res: Response, status: string) => {
    logEvent("api.ocr", { durationMs: elapsed(), httpStatus: res.status, status });
    return res;
  };
  try {
    // Pictures cost more than text, so this limit is lower than the text checkers.
    const rl = checkRateLimit(`ocr:${clientIp(request)}`, { limit: 20 });
    if (!rl.allowed) {
      return finish(errorResponse("rate_limited", { headers: { "Retry-After": String(rl.retryAfterSec) } }), "rate_limited");
    }

    const raw = await readBodyLimited(request, MAX_BODY_BYTES);
    if (raw === null) return finish(errorResponse("too_long"), "too_long");

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return finish(errorResponse("invalid_input", { message: BAD_IMAGE }), "invalid_input");
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success) return finish(errorResponse("invalid_input", { message: BAD_IMAGE }), "invalid_input");

    const check = checkImagePayload(parsed.data.image, parsed.data.mimeType);
    if (!check.ok) {
      const code = check.reason === "too_big" ? "too_long" : "invalid_input";
      return finish(errorResponse(code, { message: BAD_IMAGE }), check.reason);
    }

    if (!isOcrConfigured()) return finish(errorResponse("server_error", { message: UNAVAILABLE }), "not_configured");

    const out = await extractTextFromImage(parsed.data.image, parsed.data.mimeType);
    if (out.status === "unavailable") return finish(errorResponse("server_error", { message: UNAVAILABLE }), "unavailable");

    const body: OcrResponse = out.status === "ok" ? { ok: true, text: out.text, noText: false } : { ok: true, text: "", noText: true };
    return finish(jsonResponse(body), out.status);
  } catch {
    return finish(errorResponse("server_error"), "server_error");
  }
}
