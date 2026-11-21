// VirusTotal API v3 adapter (URL lookup + file hash lookup). READ-ONLY lookups only: we never
// submit URLs or files for scanning.
//
// VERIFIED against https://docs.virustotal.com (reference/overview, url-info, url-object, file-info,
// files, errors) on 2026-11-21:
//  - Base https://www.virustotal.com/api/v3, API key in header `x-apikey`.
//  - GET /urls/{id}: id is the URL's base64url encoding WITHOUT padding (or its SHA-256).
//    The returned object's own id is the URL's SHA-256, which we use for the GUI link
//    https://www.virustotal.com/gui/url/<sha256> (only when the response gives a 64-hex id).
//  - GET /files/{sha256}: attributes last_analysis_stats, last_analysis_results (engine_name,
//    category, result), first_submission_date, last_analysis_date (UTC seconds). The docs page
//    does not list popular_threat_classification.suggested_threat_label, so it is read optionally.
//  - Errors: JSON {error:{code,message}}. 404 NotFoundError; 401/403 auth; 429 QuotaExceededError /
//    TooManyRequestsError; 503 TransientError; all of those other than 404 map to "unavailable".
//  - Free key: about 4 requests/minute, 500/day, non-commercial use only (hackathon prototype).
//    Items queried through the API may be visible to VirusTotal's community: disclose in the privacy
//    notice.
import type { FileReputationResult, UrlReputationResult } from "@/lib/types";
import { logEvent, startTimer } from "@/lib/privacy/safe-logging";
import { fetchJsonWithTimeout } from "@/lib/server/http";
import { TtlCache, sha256Hex } from "@/lib/server/cache";
import { createOutboundGuard } from "@/lib/server/rate-limit";
import {
  PROVIDER_TIMEOUT_MS,
  RESULT_CACHE_MAX,
  RESULT_TTL_MS,
  asRecord,
  toCount,
  unavailable,
  type UrlReputationProvider,
} from "@/lib/urls/providers/types";

const VT_BASE = "https://www.virustotal.com/api/v3";
const NAME = "virustotal";
export const SHA256_RE = /^[a-f0-9]{64}$/i;

// Free key budget is ~4/min; override with VIRUSTOTAL_REQUESTS_PER_MINUTE for a premium key.
const guard = createOutboundGuard({
  maxPerWindow: () => {
    const n = Number(process.env.VIRUSTOTAL_REQUESTS_PER_MINUTE);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 4;
  },
  windowMs: 60_000,
  maxConcurrent: 2,
});

const urlCache = new TtlCache<UrlReputationResult>(RESULT_TTL_MS, RESULT_CACHE_MAX);
const fileCache = new TtlCache<FileReputationResult>(RESULT_TTL_MS, RESULT_CACHE_MAX);

export function virusTotalConfigured(): boolean {
  return !!process.env.VIRUSTOTAL_API_KEY?.trim();
}

export function resetVirusTotalState(): void {
  guard.reset();
  urlCache.clear();
  fileCache.clear();
}

type VtOutcome =
  | { kind: "ok"; body: Record<string, unknown> }
  | { kind: "not_found" }
  | { kind: "unavailable"; reason: string };

async function vtGet(path: string): Promise<VtOutcome> {
  const key = process.env.VIRUSTOTAL_API_KEY?.trim();
  if (!key) return { kind: "unavailable", reason: "not configured" };
  const release = guard.tryAcquire();
  if (!release) return { kind: "unavailable", reason: "request budget used up, try again in a minute" };
  const elapsed = startTimer();
  try {
    const res = await fetchJsonWithTimeout(
      `${VT_BASE}${path}`,
      { method: "GET", headers: { "x-apikey": key, accept: "application/json" } },
      PROVIDER_TIMEOUT_MS,
    );
    logEvent("vt.response", { durationMs: elapsed(), httpStatus: res.status });
    if (res.status === 404) {
      const code = asRecord(asRecord(res.body)?.error)?.code;
      if (code === undefined || code === "NotFoundError") return { kind: "not_found" };
      return { kind: "unavailable", reason: "unexpected response" };
    }
    if (res.status === 429) return { kind: "unavailable", reason: "rate limited by provider" };
    if (res.status === 401 || res.status === 403) return { kind: "unavailable", reason: "provider rejected the request" };
    if (res.status !== 200) return { kind: "unavailable", reason: "provider error" };
    const body = asRecord(res.body);
    if (!res.parsed || !body) return { kind: "unavailable", reason: "malformed response" };
    return { kind: "ok", body };
  } catch {
    logEvent("vt.failed", { durationMs: elapsed(), status: "error" });
    return { kind: "unavailable", reason: "timeout or network error" };
  } finally {
    release();
  }
}

type Stats = { malicious: number; suspicious: number; harmless: number; undetected: number };

function readStats(attrs: Record<string, unknown> | null): Stats | null {
  const s = asRecord(attrs?.last_analysis_stats);
  if (!s) return null;
  return {
    malicious: toCount(s.malicious),
    suspicious: toCount(s.suspicious),
    harmless: toCount(s.harmless),
    undetected: toCount(s.undetected),
  };
}

function totalEngines(s: Stats): number {
  return s.malicious + s.suspicious + s.harmless + s.undetected;
}

function verdict(s: Stats): "malicious" | "suspicious" | "clean" {
  if (s.malicious >= 3) return "malicious";
  if (s.malicious >= 1 || s.suspicious >= 1) return "suspicious";
  return "clean";
}

/** Distinct, lightly sanitized engine result strings for engines that flagged the item. */
function flaggedResultNames(attrs: Record<string, unknown>): string[] {
  const results = asRecord(attrs.last_analysis_results);
  if (!results) return [];
  const counts = new Map<string, { n: number; label: string }>();
  for (const v of Object.values(results)) {
    const r = asRecord(v);
    if (!r) continue;
    if (r.category !== "malicious" && r.category !== "suspicious") continue;
    if (typeof r.result !== "string") continue;
    const label = r.result.replace(/[^\w .:/\-!@#]/g, "").trim().slice(0, 60);
    if (!label) continue;
    const k = label.toLowerCase();
    const cur = counts.get(k);
    if (cur) cur.n += 1;
    else counts.set(k, { n: 1, label });
  }
  return [...counts.values()]
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label))
    .map((x) => x.label);
}

function isoFromUnix(x: unknown): string | undefined {
  if (typeof x !== "number" || !Number.isFinite(x) || x <= 0) return undefined;
  const d = new Date(x * 1000);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

// ------------------------------------------------------------------------------- URLs

export function vtUrlId(url: string): string {
  return Buffer.from(url, "utf8").toString("base64url"); // base64url, no padding
}

export const virusTotalUrlProvider: UrlReputationProvider = {
  name: NAME,
  isConfigured: virusTotalConfigured,
  resetState: resetVirusTotalState,

  async check(url: string): Promise<UrlReputationResult> {
    const cacheKey = sha256Hex(url);
    const cached = urlCache.get(cacheKey);
    if (cached) return cached;

    const out = await vtGet(`/urls/${vtUrlId(url)}`);
    const checkedAt = new Date().toISOString();

    if (out.kind === "unavailable") return unavailable(NAME, out.reason);
    if (out.kind === "not_found") {
      // Not found is NOT "safe": VirusTotal simply has no report for this URL.
      const r: UrlReputationResult = {
        provider: NAME,
        status: "unknown",
        threatTypes: [],
        checkedAt,
        detail: "VirusTotal has no record of this link",
      };
      urlCache.set(cacheKey, r);
      return r;
    }

    const data = asRecord(out.body.data);
    const attrs = asRecord(data?.attributes);
    const stats = readStats(attrs);
    if (!data || !attrs || !stats) return unavailable(NAME, "malformed response");

    const total = totalEngines(stats);
    const id = typeof data.id === "string" && SHA256_RE.test(data.id) ? data.id.toLowerCase() : undefined;
    const referenceUrl = id ? `https://www.virustotal.com/gui/url/${id}` : undefined;

    let status: UrlReputationResult["status"];
    if (total === 0) status = "unknown";
    else {
      const v = verdict(stats);
      status = v === "malicious" ? "malicious" : v === "suspicious" ? "suspicious" : "no_match";
    }
    const threatTypes = flaggedResultNames(attrs).slice(0, 3);
    const detail =
      total === 0
        ? "VirusTotal has no completed scan of this link"
        : `${stats.malicious} malicious and ${stats.suspicious} suspicious out of ${total} security engines`;

    const r: UrlReputationResult = { provider: NAME, status, threatTypes, checkedAt, detail };
    if (referenceUrl) r.referenceUrl = referenceUrl;
    urlCache.set(cacheKey, r);
    return r;
  },
};

// ------------------------------------------------------------------------------- files

export async function virusTotalFileLookup(sha256Input: string): Promise<FileReputationResult> {
  const unavail = (): FileReputationResult => ({
    provider: NAME,
    status: "unavailable",
    checkedAt: new Date().toISOString(),
  });
  // Validate BEFORE any network call.
  if (typeof sha256Input !== "string" || !SHA256_RE.test(sha256Input)) return unavail();
  const sha256 = sha256Input.toLowerCase();

  const cached = fileCache.get(sha256);
  if (cached) return cached;

  const out = await vtGet(`/files/${sha256}`);
  const checkedAt = new Date().toISOString();
  if (out.kind === "unavailable") return unavail();

  const referenceUrl = `https://www.virustotal.com/gui/file/${sha256}`;
  if (out.kind === "not_found") {
    const r: FileReputationResult = { provider: NAME, status: "not_found", checkedAt };
    fileCache.set(sha256, r);
    return r;
  }

  const attrs = asRecord(asRecord(out.body.data)?.attributes);
  const stats = attrs ? readStats(attrs) : null;
  if (!attrs || !stats || totalEngines(stats) === 0) return unavail();

  const v = verdict(stats);
  const status: FileReputationResult["status"] =
    v === "malicious" ? "malicious" : v === "suspicious" ? "suspicious" : "no_detections";

  const names: string[] = [];
  const label = asRecord(attrs.popular_threat_classification)?.suggested_threat_label;
  if (typeof label === "string" && label.trim()) names.push(label.replace(/[^\w .:/\-!@#]/g, "").trim().slice(0, 60));
  // label (optional) + top 3 distinct engine result strings
  let engineNames = 0;
  for (const n of flaggedResultNames(attrs)) {
    if (engineNames >= 3) break;
    if (names.some((x) => x.toLowerCase() === n.toLowerCase())) continue;
    names.push(n);
    engineNames += 1;
  }

  const r: FileReputationResult = {
    provider: NAME,
    status,
    engineCounts: { ...stats },
    topThreatNames: names.filter(Boolean),
    checkedAt,
    referenceUrl,
  };
  const first = isoFromUnix(attrs.first_submission_date);
  const last = isoFromUnix(attrs.last_analysis_date);
  if (first) r.firstSeen = first;
  if (last) r.lastAnalyzed = last;
  fileCache.set(sha256, r);
  return r;
}
