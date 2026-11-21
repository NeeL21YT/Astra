// Small in-memory TTL cache (per server instance; serverless instances do not share memory,
// so this is a best-effort optimization, not a source of truth). Never persisted.
import { createHash } from "node:crypto";

export class TtlCache<V> {
  private store = new Map<string, { value: V; expires: number }>();

  constructor(
    private readonly ttlMs: number = 60 * 60 * 1000,
    private readonly maxEntries: number = 500,
  ) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expires <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    this.store.delete(key); // refresh insertion order
    if (this.store.size >= this.maxEntries) {
      const now = Date.now();
      for (const [k, e] of this.store) if (e.expires <= now) this.store.delete(k);
      while (this.store.size >= this.maxEntries) {
        const oldest = this.store.keys().next().value;
        if (oldest === undefined) break;
        this.store.delete(oldest);
      }
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/** SHA-256 hex digest. Used to key caches so raw URLs are not kept as map keys. */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
