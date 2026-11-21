// Privacy-safe logging. Logs ONLY: an event name, durations, numeric counts and short status tokens.
// It deliberately cannot log message text, URLs, hashes, phone numbers or provider responses:
// every field is whitelisted by name and type, and anything else is dropped.

type SafeFields = {
  durationMs?: number;
  /** HTTP status code from a provider or from our own response. */
  httpStatus?: number;
  /** Short lowercase token, e.g. "ran", "unavailable", "high". Anything else is dropped. */
  status?: string;
  count?: number;
  /** AI model id (a public identifier, never user data). Only plain ids are kept. */
  model?: string;
};

const EVENT_RE = /^[a-z0-9_.:-]{1,64}$/;
const TOKEN_RE = /^[a-z_]{1,32}$/;
const MODEL_RE = /^[A-Za-z0-9._:/-]{1,100}$/;

function sanitize(fields: SafeFields | undefined): Record<string, number | string> {
  const out: Record<string, number | string> = {};
  if (!fields) return out;
  for (const key of ["durationMs", "httpStatus", "count"] as const) {
    const v = fields[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = Math.round(v);
  }
  if (typeof fields.status === "string" && TOKEN_RE.test(fields.status)) out.status = fields.status;
  if (typeof fields.model === "string" && MODEL_RE.test(fields.model)) out.model = fields.model;
  return out;
}

export function logEvent(event: string, fields?: SafeFields): void {
  if (!EVENT_RE.test(event)) return;
  try {
    console.info(JSON.stringify({ event, ...sanitize(fields) }));
  } catch {
    // logging must never break a request
  }
}

/** Returns a function that reports elapsed milliseconds. */
export function startTimer(): () => number {
  const t0 = Date.now();
  return () => Date.now() - t0;
}
