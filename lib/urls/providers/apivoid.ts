// APIVoid Domain Reputation adapter (optional second URL reputation source).
//
// VERIFIED against https://www.apivoid.com/api/domain-reputation/ on 2026-11-21:
//  - POST https://api.apivoid.com/v2/domain-reputation, JSON body {"host": "<domain>"}.
//  - Auth: header `X-API-Key: <key>` (plus Content-Type: application/json).
//  - Response (documented sample): top-level `blacklists.detections` (int), `blacklists.engines_count`,
//    `blacklists.detection_rate`, `risk_score.result` (0-100), `security_checks.*`.
//    We also tolerate the same object nested under `data` / `data.report` in case the API wraps it.
//  - Free tier: the site offers a free trial with no credit card (documented as a 30-day trial; the
//    credit amount is not stated on that page). Each successful call costs credits; non-200 responses
//    cost none. So this is a trial, not a permanent free tier.
//  - We send ONLY the hostname, never the full URL path or query, to limit what leaves the server.
//    Hostnames sent to a third party must be disclosed in the privacy notice.
// Gated on APIVOID_API_KEY. Without it the provider is omitted (see providers/types.ts).
import type { UrlReputationResult } from "@/lib/types";
import { logEvent, startTimer } from "@/lib/privacy/safe-logging";
import { fetchJsonWithTimeout } from "@/lib/server/http";
import { TtlCache, sha256Hex } from "@/lib/server/cache";
import { createOutboundGuard } from "@/lib/server/rate-limit";
import {
  PROVIDER_TIMEOUT_MS,
  RESULT_CACHE_MAX,
  RESULT_TTL_MS,
  asRecord,
  unavailable,
  type UrlReputationProvider,
} from "@/lib/urls/providers/types";

const ENDPOINT = "https://api.apivoid.com/v2/domain-reputation";
const NAME = "apivoid";

// Trial credits are limited, so keep a modest local budget.
const guard = createOutboundGuard({ maxPerWindow: 30, windowMs: 60_000, maxConcurrent: 3 });
const cache = new TtlCache<UrlReputationResult>(RESULT_TTL_MS, RESULT_CACHE_MAX);

export function apivoidConfigured(): boolean {
  return !!process.env.APIVOID_API_KEY?.trim();
}

function isIpHost(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

function findReport(body: unknown): Record<string, unknown> | null {
  const root = asRecord(body);
  if (!root) return null;
  const candidates = [root, asRecord(root.data), asRecord(asRecord(root.data)?.report), asRecord(root.report)];
  for (const c of candidates) if (c && asRecord(c.blacklists)) return c;
  return null;
}

export const apivoidProvider: UrlReputationProvider = {
  name: NAME,
  isConfigured: apivoidConfigured,
  resetState() {
    guard.reset();
    cache.clear();
  },

  async check(url: string): Promise<UrlReputationResult> {
    const key = process.env.APIVOID_API_KEY?.trim();
    if (!key) return unavailable(NAME, "not configured");

    let host: string;
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      return unavailable(NAME, "invalid URL");
    }
    const checkedAt = new Date().toISOString();
    if (!host || isIpHost(host)) {
      return { provider: NAME, status: "unknown", threatTypes: [], checkedAt, detail: "domain reputation does not apply to IP addresses" };
    }

    const cacheKey = sha256Hex(host);
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const release = guard.tryAcquire();
    if (!release) return unavailable(NAME, "request budget used up, try again in a minute");
    const elapsed = startTimer();
    try {
      const res = await fetchJsonWithTimeout(
        ENDPOINT,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": key },
          body: JSON.stringify({ host }),
        },
        PROVIDER_TIMEOUT_MS,
      );
      logEvent("apivoid.response", { durationMs: elapsed(), httpStatus: res.status });
      if (res.status === 400) {
        return { provider: NAME, status: "unknown", threatTypes: [], checkedAt, detail: "domain not accepted by provider" };
      }
      if (res.status !== 200 || !res.parsed) return unavailable(NAME, "provider error");

      const report = findReport(res.body);
      const bl = asRecord(report?.blacklists);
      const detections = bl?.detections;
      if (!report || !bl || typeof detections !== "number" || !Number.isFinite(detections) || detections < 0) {
        return unavailable(NAME, "malformed response");
      }
      const engines = typeof bl.engines_count === "number" ? bl.engines_count : undefined;

      const names: string[] = [];
      const engineMap = asRecord(bl.engines);
      if (engineMap) {
        for (const e of Object.values(engineMap)) {
          const r = asRecord(e);
          if (r?.detected === true && typeof r.name === "string") {
            const n = r.name.replace(/[^\w .:/\-]/g, "").trim().slice(0, 50);
            if (n && !names.includes(n)) names.push(n);
          }
          if (names.length >= 3) break;
        }
      }

      const status: UrlReputationResult["status"] =
        detections >= 3 ? "malicious" : detections >= 1 ? "suspicious" : "no_match";
      const r: UrlReputationResult = {
        provider: NAME,
        status,
        // These are blocklist names (who flagged the domain), not threat categories.
        threatTypes: names,
        checkedAt,
        detail: `${detections} of ${engines ?? "several"} blocklists flagged this domain`,
      };
      cache.set(cacheKey, r);
      return r;
    } catch {
      logEvent("apivoid.failed", { durationMs: elapsed(), status: "error" });
      return unavailable(NAME, "timeout or network error");
    } finally {
      release();
    }
  },
};
