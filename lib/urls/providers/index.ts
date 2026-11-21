// Reputation provider registry. Runs every configured URL provider in parallel with a timeout,
// and routes file-hash lookups to VirusTotal. Unconfigured/omitted-provider policy: see types.ts.
import type { FileReputationResult, UrlReputationResult } from "@/lib/types";
import { PROVIDER_TIMEOUT_MS, unavailable, type UrlReputationProvider } from "@/lib/urls/providers/types";
import { virusTotalUrlProvider, virusTotalFileLookup, virusTotalConfigured } from "@/lib/urls/providers/virustotal";
import { apivoidProvider, apivoidConfigured } from "@/lib/urls/providers/apivoid";

const PROVIDERS: UrlReputationProvider[] = [virusTotalUrlProvider, apivoidProvider];

const SIMULATED = "simulated outage (demo)";

async function runOne(p: UrlReputationProvider, url: string): Promise<UrlReputationResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // Hard ceiling in case an adapter hangs; adapters also enforce their own fetch timeout.
    return await Promise.race([
      p.check(url),
      new Promise<UrlReputationResult>((resolve) => {
        timer = setTimeout(() => resolve(unavailable(p.name, "timeout")), PROVIDER_TIMEOUT_MS + 500);
      }),
    ]);
  } catch {
    return unavailable(p.name, "error");
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** `url` must already be a normalized http(s) URL (the pipeline normalizes first). */
export async function checkUrlReputation(
  url: string,
  opts: { simulateOutage?: boolean } = {},
): Promise<UrlReputationResult[]> {
  if (opts.simulateOutage) return PROVIDERS.map((p) => unavailable(p.name, SIMULATED));
  const active = PROVIDERS.filter((p) => p.isConfigured());
  if (active.length === 0) return [unavailable(virusTotalUrlProvider.name, "not configured")];
  return Promise.all(active.map((p) => runOne(p, url)));
}

export async function checkFileHash(
  sha256: string,
  opts: { simulateOutage?: boolean } = {},
): Promise<FileReputationResult> {
  if (opts.simulateOutage) {
    return { provider: "virustotal", status: "unavailable", checkedAt: new Date().toISOString() };
  }
  try {
    return await virusTotalFileLookup(sha256);
  } catch {
    return { provider: "virustotal", status: "unavailable", checkedAt: new Date().toISOString() };
  }
}

/** Which providers have keys configured (booleans only, for /api/health). */
export function configuredProviders(): { virustotal: boolean; apivoid: boolean } {
  return { virustotal: virusTotalConfigured(), apivoid: apivoidConfigured() };
}

/** Test helper: clear caches and rate guards. */
export function resetProviderState(): void {
  for (const p of PROVIDERS) p.resetState();
}
