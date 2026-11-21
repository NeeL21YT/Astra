import type { ApiErr, Bilingual, OcrRequest, OcrResponse } from "@/lib/types";
import { bilingual } from "@/lib/i18n/ui";

const TIMEOUT_MS = 40_000;

export type OcrClientResult = { ok: true; text: string; noText: boolean } | ApiErr;

function fail(code: ApiErr["error"]["code"], message: Bilingual): ApiErr {
  return { ok: false, error: { code, message } };
}

/** Send a prepared picture to /api/ocr. Never throws: always resolves. */
export async function readTextFromImage(req: OcrRequest, signal?: AbortSignal): Promise<OcrClientResult> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener("abort", onOuterAbort, { once: true });

  try {
    const res = await fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.status === 429) return fail("rate_limited", bilingual("err.rate"));
    let json: OcrResponse | null = null;
    try {
      json = (await res.json()) as OcrResponse;
    } catch {
      return fail("server_error", bilingual("msg.image.failed"));
    }
    if (json && json.ok === true && typeof json.text === "string") {
      return { ok: true, text: json.text, noText: json.noText === true };
    }
    if (json && json.ok === false && typeof json.error?.message?.en === "string") return json;
    return fail("server_error", bilingual("msg.image.failed"));
  } catch {
    return fail("server_error", bilingual(timedOut ? "err.timeout" : "err.network"));
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onOuterAbort);
  }
}
