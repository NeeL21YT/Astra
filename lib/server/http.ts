// Shared HTTP helpers for the API routes and provider adapters.
// Hindi strings here need review by a fluent speaker before release.
import type { z } from "zod";
import type { AnalysisResult, ApiErr, ApiErrorCode, Bilingual } from "@/lib/types";
import { logEvent, startTimer } from "@/lib/privacy/safe-logging";
import { checkRateLimit, clientIp } from "@/lib/server/rate-limit";

// ------------------------------------------------------------------ input errors

/**
 * Thrown by the pipeline for invalid user input. The message is a fixed bilingual string and
 * NEVER contains the user's input, so routes can show it safely.
 */
export class InputError extends Error {
  readonly code: "invalid_input" | "too_long";
  readonly userMessage: Bilingual;
  constructor(code: "invalid_input" | "too_long", userMessage: Bilingual) {
    super(code);
    this.name = "InputError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

// ------------------------------------------------------------------ responses

const NO_STORE = { "Cache-Control": "no-store" } as const;

const ERROR_MESSAGES: Record<ApiErrorCode, Bilingual> = {
  invalid_input: {
    en: "Please check what you entered and try again.",
    hi: "कृपया जो आपने भरा है उसे जाँचकर दोबारा कोशिश करें।",
  },
  too_long: {
    en: "That is too long. Please shorten it and try again.",
    hi: "यह बहुत लंबा है। कृपया इसे छोटा करके दोबारा कोशिश करें।",
  },
  rate_limited: {
    en: "Too many requests. Please wait a minute and try again.",
    hi: "बहुत ज़्यादा अनुरोध हो गए हैं। कृपया एक मिनट रुककर दोबारा कोशिश करें।",
  },
  server_error: {
    en: "Something went wrong on our side. Please try again.",
    hi: "हमारी तरफ़ से कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।",
  },
};

const STATUS_FOR: Record<ApiErrorCode, number> = {
  invalid_input: 400,
  too_long: 413,
  rate_limited: 429,
  server_error: 500,
};

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...extraHeaders } });
}

export function errorResponse(
  code: ApiErrorCode,
  opts: { message?: Bilingual; headers?: Record<string, string> } = {},
): Response {
  const body: ApiErr = { ok: false, error: { code, message: opts.message ?? ERROR_MESSAGES[code] } };
  return jsonResponse(body, STATUS_FOR[code], opts.headers);
}

// ------------------------------------------------------------------ outbound fetch

export type FetchJsonResult = { status: number; body: unknown; parsed: boolean };

/**
 * fetch + read + JSON.parse inside one timeout window. Throws on network error or timeout
 * (callers map that to "unavailable"). Only ever called with fixed provider hosts, never with
 * a user-submitted URL (SSRF).
 */
export async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<FetchJsonResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    const text = await res.text();
    try {
      return { status: res.status, body: text ? JSON.parse(text) : undefined, parsed: true };
    } catch {
      return { status: res.status, body: undefined, parsed: false };
    }
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------ request handling

export async function readBodyLimited(request: Request, maxBytes: number): Promise<string | null> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const n = Number(declared);
    if (Number.isFinite(n) && n > maxBytes) return null;
  }
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // ignore
      }
      return null;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(merged);
}

type RouteConfig<T> = {
  /** Event name for safe logs, e.g. "api.message". */
  event: string;
  /** Rate-limit bucket shared by all analysis routes of one family. */
  family: string;
  maxBodyBytes: number;
  schema: z.ZodType<T>;
  run: (input: T) => Promise<AnalysisResult>;
};

/**
 * Common POST pipeline: rate limit -> bounded body read -> JSON parse -> zod validation -> run.
 * Errors never echo user input.
 */
export async function handleAnalyzePost<T>(request: Request, cfg: RouteConfig<T>): Promise<Response> {
  const elapsed = startTimer();
  const finish = (res: Response, status: string) => {
    logEvent(cfg.event, { durationMs: elapsed(), httpStatus: res.status, status });
    return res;
  };
  try {
    const rl = checkRateLimit(`${cfg.family}:${clientIp(request)}`);
    if (!rl.allowed) {
      return finish(
        errorResponse("rate_limited", { headers: { "Retry-After": String(rl.retryAfterSec) } }),
        "rate_limited",
      );
    }

    const raw = await readBodyLimited(request, cfg.maxBodyBytes);
    if (raw === null) return finish(errorResponse("too_long"), "too_long");

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return finish(errorResponse("invalid_input"), "invalid_input");
    }

    const parsed = cfg.schema.safeParse(json);
    if (!parsed.success) {
      const tooLong = parsed.error.issues.some((i) => i.code === "too_big");
      const code: ApiErrorCode = tooLong ? "too_long" : "invalid_input";
      return finish(errorResponse(code), code);
    }

    try {
      const result = await cfg.run(parsed.data);
      return finish(jsonResponse({ ok: true, result }), "ok");
    } catch (err) {
      if (err instanceof InputError) {
        return finish(errorResponse(err.code, { message: err.userMessage }), err.code);
      }
      return finish(errorResponse("server_error"), "server_error");
    }
  } catch {
    return finish(errorResponse("server_error"), "server_error");
  }
}
