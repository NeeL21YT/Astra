/**
 * Opt-in, on-device check history.
 *
 * What is saved (only when the person turns it on): the type of check, the result state, the
 * time, and a short non-sensitive label (a link's host name, a masked phone number, the first
 * characters of a file fingerprint). Message text and pictures are NEVER saved, and nothing here
 * is ever sent to a server. Entries expire after HISTORY_TTL_MS and the list is capped.
 *
 * The pure helpers (toEntry, pruneExpired, addEntry, parseHistory) are separate from the browser
 * storage code so they can be unit-tested without a DOM.
 */
import type { AnalysisKind, AnalysisResult, UiState } from "@/lib/types";

export const HISTORY_TTL_DAYS = 7;
export const HISTORY_TTL_MS = HISTORY_TTL_DAYS * 24 * 60 * 60 * 1000;
export const HISTORY_MAX = 30;
const STORAGE_KEY = "astra-history-v1";

export type HistoryEntry = {
  id: string;
  /** Epoch milliseconds when the check finished. */
  at: number;
  kind: AnalysisKind;
  uiState: UiState;
  /** Host name, masked number, or fingerprint prefix. Absent for messages. */
  label?: string;
};

export type HistoryData = { enabled: boolean; entries: HistoryEntry[] };

const KINDS: readonly AnalysisKind[] = ["message", "url", "phone", "file"];
const STATES: readonly UiState[] = ["potential_scam", "suspicious", "likely_safe", "unable"];

// ------------------------------------------------------------------ pure helpers

/** Builds the small, non-sensitive record kept for a result. */
export function toEntry(result: AnalysisResult, now: number): HistoryEntry {
  let label: string | undefined;
  if (result.kind === "url") label = result.urlChecks[0]?.hostname;
  else if (result.kind === "phone") label = result.phone?.masked;
  else if (result.kind === "file" && result.fileCheck) label = `${result.fileCheck.sha256.slice(0, 8)}…`;
  return {
    id: result.id,
    at: now,
    kind: result.kind,
    uiState: result.uiState,
    ...(label ? { label: label.slice(0, 80) } : {}),
  };
}

export function pruneExpired(entries: HistoryEntry[], now: number): HistoryEntry[] {
  return entries.filter((e) => now - e.at < HISTORY_TTL_MS && e.at <= now + 60_000);
}

/** Newest first, de-duplicated by id, capped at HISTORY_MAX, expired entries dropped. */
export function addEntry(entries: HistoryEntry[], entry: HistoryEntry, now: number): HistoryEntry[] {
  const rest = pruneExpired(entries, now).filter((e) => e.id !== entry.id);
  return [entry, ...rest].slice(0, HISTORY_MAX);
}

function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.at === "number" &&
    Number.isFinite(v.at) &&
    KINDS.includes(v.kind as AnalysisKind) &&
    STATES.includes(v.uiState as UiState) &&
    (v.label === undefined || typeof v.label === "string")
  );
}

/** Reads stored JSON defensively: anything malformed becomes "off and empty". Expired entries are dropped. */
export function parseHistory(raw: string | null, now: number): HistoryData {
  if (!raw) return { enabled: false, entries: [] };
  try {
    const data = JSON.parse(raw) as { enabled?: unknown; entries?: unknown };
    if (data.enabled !== true) return { enabled: false, entries: [] };
    const entries = Array.isArray(data.entries) ? data.entries.filter(isEntry) : [];
    return { enabled: true, entries: pruneExpired(entries, now).slice(0, HISTORY_MAX) };
  } catch {
    return { enabled: false, entries: [] };
  }
}

// ------------------------------------------------------------------ browser storage

const OFF: HistoryData = { enabled: false, entries: [] };
let current: HistoryData | null = null;
const listeners = new Set<() => void>();

function load(): HistoryData {
  try {
    return parseHistory(window.localStorage.getItem(STORAGE_KEY), Date.now());
  } catch {
    return OFF; // storage blocked: history simply stays off
  }
}

function save(next: HistoryData) {
  current = next;
  try {
    if (!next.enabled) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore: the list just will not persist.
  }
  listeners.forEach((l) => l());
}

export function getHistorySnapshot(): HistoryData {
  if (!current) current = load();
  return current;
}

export const HISTORY_SERVER_SNAPSHOT: HistoryData = OFF;

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      current = load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Turning history off deletes everything that was saved. */
export function setHistoryEnabled(enabled: boolean) {
  save(enabled ? { enabled: true, entries: load().entries } : OFF);
}

export function clearHistory() {
  const data = load();
  if (data.enabled) save({ enabled: true, entries: [] });
}

export function removeHistoryEntry(id: string) {
  const data = load();
  if (data.enabled) save({ enabled: true, entries: data.entries.filter((e) => e.id !== id) });
}

/** Called after every successful check. Does nothing unless the person opted in. */
export function recordCheck(result: AnalysisResult) {
  if (typeof window === "undefined") return;
  const data = load();
  if (!data.enabled) return;
  const now = Date.now();
  save({ enabled: true, entries: addEntry(data.entries, toEntry(result, now), now) });
}
