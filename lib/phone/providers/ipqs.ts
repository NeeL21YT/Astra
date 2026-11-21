// Number reputation from IPQualityScore (IPQS), server-side only, never throws.
//
// VERIFIED against IPQS's documentation on 2026-11-21, section "Using the API" of
// https://www.ipqualityscore.com/documentation/phone-number-validation-api/overview :
//  - Request: GET https://www.ipqualityscore.com/api/json/phone/YOUR_API_KEY/PHONE
//    (the API key is part of the URL path, which is the documented form).
//  - Phone format: digits with the country code and no plus sign (for example 919876543210).
//    With a country code, no country hint is needed.
//  - Another page mentions an `IPQS-KEY` header on a key-free endpoint, but it shows no complete
//    example, so this code uses the documented path form. Never log the URL: it contains the key
//    (this module logs only event names, timings and status codes).
//  - Fields used: success, valid, fraud_score (0-100), recent_abuse, risky, spammer, VOIP,
//    prepaid, line_type, carrier. Fields that are null or "N/A" are ignored.
//  - NOT used, on purpose: `name` (owner name) and any other personal data. ASTRA must not
//    accuse or identify a person from a phone number.
//  - Documented failure shape: `success: false` with a message (for example no credits or an
//    invalid number). HTTP status codes are not documented, so any non-200 answer or
//    `success: false` is reported as "unavailable".
//
// PRIVACY: the number being checked is sent to IPQS. IPQS's terms say it may use submitted data
// to improve its risk models and do not state a retention period. This must be disclosed in the
// privacy notice (it is). The number is never logged here.
//
// TERMS: IPQS requires an account with a business email and treats trial or proof-of-concept use
// as covered by its agreement; its free credits may be a one-time grant. Read the terms before
// any public launch.
import type { PhoneFlag, PhoneLineType, PhoneReputationResult } from "@/lib/types";
import { logEvent, startTimer } from "@/lib/privacy/safe-logging";
import { TtlCache, sha256Hex } from "@/lib/server/cache";
import { createOutboundGuard } from "@/lib/server/rate-limit";

const ENDPOINT = "https://www.ipqualityscore.com/api/json/phone";
const TIMEOUT_MS = 6_000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// IPQS documents these bands for fraud_score: 75+ suspicious, 85+ risky, 90+ high risk. We only
// count the "risky" band (85+), to avoid flagging genuine numbers on a borderline score.
const HIGH_FRAUD_SCORE = 85;

const cache = new TtlCache<PhoneReputationResult>(CACHE_TTL_MS, 500);
const guard = createOutboundGuard({ maxPerWindow: 20, windowMs: 60_000, maxConcurrent: 4 });

export function isIpqsConfigured(): boolean {
  return !!process.env.IPQS_API_KEY?.trim();
}

export function resetIpqsState(): void {
  cache.clear();
  guard.reset();
}

function unavailable(): PhoneReputationResult {
  return { provider: "ipqualityscore", status: "unavailable", flags: [], checkedAt: new Date().toISOString() };
}

const bool = (v: unknown): boolean | undefined => (typeof v === "boolean" ? v : undefined);

function lineType(v: unknown): PhoneLineType | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.toLowerCase().replace(/[^a-z]/g, "");
  if (t === "wireless" || t === "mobile") return "mobile";
  if (t === "landline") return "landline";
  if (t === "voip") return "voip";
  if (t === "tollfree") return "toll_free";
  if (t === "premiumrate" || t === "premium") return "premium";
  if (t === "na" || t === "") return undefined;
  return "other";
}

/** Turn IPQS's JSON into our result. Exported for tests. */
export function mapIpqsResponse(body: unknown): PhoneReputationResult {
  const j = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (j.success !== true) return unavailable();

  const flags: PhoneFlag[] = [];
  if (j.risky === true) flags.push("risky");
  if (j.recent_abuse === true) flags.push("recent_abuse");
  if (j.spammer === true) flags.push("spammer");
  if (typeof j.fraud_score === "number" && j.fraud_score >= HIGH_FRAUD_SCORE) flags.push("high_fraud_score");

  const carrierRaw = typeof j.carrier === "string" ? j.carrier.trim() : "";
  const carrier = carrierRaw && carrierRaw.toUpperCase() !== "N/A" ? carrierRaw.slice(0, 80) : undefined;

  return {
    provider: "ipqualityscore",
    status: "ok",
    valid: bool(j.valid),
    lineType: lineType(j.line_type),
    carrier,
    voip: bool(j.VOIP),
    prepaid: bool(j.prepaid),
    flags,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Look up a phone number (E.164, for example "+919876543210"). Returns null when IPQS is not
 * set up, so the caller can leave the check out; "unavailable" when it is set up but failed.
 */
export async function lookupPhoneReputation(
  e164: string,
  opts: { simulateOutage?: boolean } = {},
): Promise<PhoneReputationResult | null> {
  const key = process.env.IPQS_API_KEY?.trim();
  if (!key) return null;
  if (opts.simulateOutage) return unavailable();
  if (!/^\+[0-9]{7,15}$/.test(e164)) return unavailable();

  const cacheKey = sha256Hex(e164); // the number itself is never kept as a map key
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const release = guard.tryAcquire();
  if (!release) return unavailable(); // local budget used up: do not hammer the provider

  const elapsed = startTimer();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ENDPOINT}/${encodeURIComponent(key)}/${e164.slice(1)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = undefined;
    }
    if (res.status !== 200 || json === undefined) {
      logEvent("ipqs.failed", { durationMs: elapsed(), httpStatus: res.status, status: "http_error" });
      return unavailable();
    }
    const out = mapIpqsResponse(json);
    logEvent(out.status === "ok" ? "ipqs.ran" : "ipqs.failed", { durationMs: elapsed(), status: out.status });
    if (out.status === "ok") cache.set(cacheKey, out); // only definitive answers are cached
    return out;
  } catch {
    logEvent("ipqs.failed", { durationMs: elapsed(), status: "error" });
    return unavailable();
  } finally {
    clearTimeout(timer);
    release();
  }
}
