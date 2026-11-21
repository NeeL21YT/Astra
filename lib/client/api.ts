import type {
  AnalysisResult,
  ApiErr,
  ApiErrorCode,
  ApiResponse,
  FileRequest,
  MessageRequest,
  PhoneRequest,
  UrlRequest,
} from "@/lib/types";
import { bilingual } from "@/lib/i18n/ui";
import type { UiKey } from "@/lib/i18n/ui";

const TIMEOUT_MS = 40_000; // the server may try a second or third AI provider

function fail(code: ApiErrorCode, key: UiKey): ApiErr {
  return { ok: false, error: { code, message: bilingual(key) } };
}

/** Fill in anything a half-formed response might be missing so the UI never crashes. */
function normalize(raw: AnalysisResult): AnalysisResult {
  return {
    ...raw,
    categories: raw.categories ?? [],
    indicators: raw.indicators ?? [],
    urlChecks: (raw.urlChecks ?? []).map((u) => ({
      ...u,
      flags: u.flags ?? [],
      reputation: u.reputation ?? [],
    })),
    recommendedActions: raw.recommendedActions ?? [],
    limitations: raw.limitations ?? [],
    checks: raw.checks ?? [],
  };
}

function looksLikeResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<AnalysisResult>;
  return (
    typeof r.uiState === "string" &&
    typeof r.kind === "string" &&
    !!r.summary &&
    typeof r.summary === "object" &&
    typeof (r.summary as { en?: unknown }).en === "string"
  );
}

function looksLikeError(value: unknown): value is ApiErr {
  if (!value || typeof value !== "object") return false;
  const e = (value as { error?: { message?: { en?: unknown; hi?: unknown } } }).error;
  return typeof e?.message?.en === "string" && typeof e?.message?.hi === "string";
}

/** POST JSON to an analyze endpoint. Never throws: always resolves to an ApiResponse. */
async function post(path: string, body: unknown, signal?: AbortSignal): Promise<ApiResponse> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onOuterAbort, { once: true });
  }

  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (res.status === 429) return fail("rate_limited", "err.rate");

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return fail("server_error", res.ok ? "err.badResponse" : "err.server");
    }

    const ok = (json as { ok?: unknown } | null)?.ok;
    if (ok === true) {
      const result = (json as { result?: unknown }).result;
      if (looksLikeResult(result)) return { ok: true, result: normalize(result) };
      return fail("server_error", "err.badResponse");
    }
    if (ok === false && looksLikeError(json)) return json;
    return fail("server_error", res.ok ? "err.badResponse" : "err.server");
  } catch {
    if (timedOut) return fail("server_error", "err.timeout");
    return fail("server_error", "err.network");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onOuterAbort);
  }
}

export const analyzeMessage = (req: MessageRequest, signal?: AbortSignal) =>
  post("/api/analyze/message", req, signal);
export const analyzeUrl = (req: UrlRequest, signal?: AbortSignal) => post("/api/analyze/url", req, signal);
export const analyzePhone = (req: PhoneRequest, signal?: AbortSignal) => post("/api/analyze/phone", req, signal);
export const analyzeFile = (req: FileRequest, signal?: AbortSignal) => post("/api/analyze/file", req, signal);
