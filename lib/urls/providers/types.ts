// Provider adapter interfaces (spec 8.6). Providers are swappable behind these.
//
// POLICY for unconfigured providers: an unconfigured provider is OMITTED from checkUrlReputation()
// results. If NO provider is configured, checkUrlReputation() returns a single VirusTotal entry
// with status "unavailable" and detail "not configured", so the UI/pipeline always see an honest
// "could not check" instead of an empty list. When simulateOutage is on, every registered provider
// is reported "unavailable" with detail "simulated outage (demo)", configured or not.
//
// PRIVACY: URLs (or their hostnames) sent to third-party providers leave our server. Providers may
// retain them and show them to their community or customers. This must be disclosed in the privacy
// notice. The server only ever calls fixed provider hosts, never the user-submitted URL itself.
import type { UrlReputationResult } from "@/lib/types";

export interface UrlReputationProvider {
  /** Stable lowercase id, used in results and cache keys. */
  readonly name: string;
  isConfigured(): boolean;
  /** Must not throw for expected failures; return status "unavailable" instead. */
  check(normalizedUrl: string): Promise<UrlReputationResult>;
  /** Clears in-memory caches / guards (tests). */
  resetState(): void;
}

export const PROVIDER_TIMEOUT_MS = 6000;
export const RESULT_TTL_MS = 60 * 60 * 1000;
export const RESULT_CACHE_MAX = 500;

export function unavailable(provider: string, detail: string): UrlReputationResult {
  return { provider, status: "unavailable", threatTypes: [], checkedAt: new Date().toISOString(), detail };
}

// ---- tolerant JSON helpers shared by adapters (provider responses are untrusted input)
export function asRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : null;
}
export function toCount(x: unknown): number {
  return typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
}
