// In-memory rate limiting. BEST-EFFORT ONLY: Vercel serverless instances do not share memory, so
// a determined client can exceed the limit across instances and a cold start resets counters.
// For production use a shared store such as Upstash Redis (@upstash/ratelimit, sliding window).

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;
const MAX_TRACKED_KEYS = 5000;

const hits = new Map<string, number[]>();

/** Sliding-window log limiter. `key` should combine route family and client IP. */
export function checkRateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): RateLimitResult {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const now = Date.now();
  const cutoff = now - windowMs;

  if (hits.size > MAX_TRACKED_KEYS) {
    for (const [k, list] of hits) {
      if (list.length === 0 || list[list.length - 1] <= cutoff) hits.delete(k);
    }
    // Still too big (a flood of distinct keys): drop the oldest entries.
    while (hits.size > MAX_TRACKED_KEYS) {
      const first = hits.keys().next().value;
      if (first === undefined) break;
      hits.delete(first);
    }
  }

  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= limit) {
    hits.set(key, recent);
    const retryAfterSec = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
    return { allowed: false, retryAfterSec };
  }
  recent.push(now);
  hits.set(key, recent);
  return { allowed: true, retryAfterSec: 0 };
}

export function resetRateLimits(): void {
  hits.clear();
}

/**
 * Best-effort client IP. On Vercel, x-real-ip / x-forwarded-for are set by the platform edge.
 * Outside a trusted proxy these headers can be spoofed, which is acceptable for a best-effort limiter.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return "unknown";
}

// ---------------------------------------------------------------------------------------------
// Outbound guard: protects third-party quotas (e.g. VirusTotal free key: ~4 requests/minute).
// A burst beyond the budget is refused locally so the caller reports "unavailable" instead of
// hammering the provider and getting HTTP 429.

export type OutboundGuard = {
  /** Returns a release function when a call may proceed, or null when the budget is used up. */
  tryAcquire(): (() => void) | null;
  reset(): void;
};

export function createOutboundGuard(opts: {
  maxPerWindow: number | (() => number);
  windowMs: number;
  maxConcurrent: number;
}): OutboundGuard {
  let stamps: number[] = [];
  let inFlight = 0;
  return {
    tryAcquire() {
      const now = Date.now();
      stamps = stamps.filter((t) => t > now - opts.windowMs);
      const max = typeof opts.maxPerWindow === "function" ? opts.maxPerWindow() : opts.maxPerWindow;
      if (stamps.length >= max || inFlight >= opts.maxConcurrent) return null;
      stamps.push(now);
      inFlight += 1;
      let released = false;
      return () => {
        if (!released) {
          released = true;
          inFlight = Math.max(0, inFlight - 1);
        }
      };
    },
    reset() {
      stamps = [];
      inFlight = 0;
    },
  };
}
