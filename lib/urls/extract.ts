/**
 * Entity extraction: URLs, Indian mobile numbers, UPI IDs and emails from pasted text.
 * Pure TypeScript, runs in the browser and on the server, never makes a network request.
 *
 * Returned formats:
 *  - urls: as written (trailing punctuation removed), deduplicated, at most 10.
 *  - phones: canonical "+91XXXXXXXXXX" (Indian mobile numbers only), deduplicated.
 *  - upiIds / emails: as written, deduplicated.
 */
import type { ExtractedEntities } from "@/lib/types";

const MAX_URLS = 10;

/** TLDs accepted for BARE domains (no scheme, no www). Kept explicit to avoid matching "e.g." or "file.pdf". */
const BARE_TLDS = [
  "com", "in", "org", "net", "co", "io", "app", "link", "me", "info", "biz", "xyz", "top", "click", "icu", "vip",
  "shop", "live", "cfd", "sbs", "online", "site", "store", "tech", "club", "cc", "ly", "gl", "gd", "tv", "ws",
  "us", "uk", "au", "ca", "de", "gov", "edu", "nic", "ac", "res", "sbi", "bank", "page", "dev", "cloud", "today",
  "work", "fun", "rest", "buzz", "monster", "digital", "support", "website", "space", "pro", "mobi", "ai", "pk",
  "bd", "np", "lk", "sg", "ae", "nz", "za", "jp", "kr", "cn", "ru", "tk", "ml", "ga", "cf", "gq", "cyou", "loan",
  "win", "bid", "download", "example", "test", "invalid",
];
const TLD_ALT = BARE_TLDS.sort((a, b) => b.length - a.length).join("|");

const LABEL = "[a-z0-9](?:[a-z0-9-]*[a-z0-9])?";
const PATH = "(?::[0-9]{2,5})?(?:[/?#][^\\s<>\"'“”]*)?";

const SCHEME_URL = new RegExp(`\\bhttps?:\\/\\/[^\\s<>"'“”‘’]+`, "gi");
const WWW_URL = new RegExp(`\\bwww\\.${LABEL}(?:\\.${LABEL})+${PATH}`, "gi");
const BARE_DOMAIN = new RegExp(`\\b(?:${LABEL}\\.)+(?:${TLD_ALT})(?![a-z0-9_-])${PATH}`, "gi");
const IPV4_URL = new RegExp(`\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}${PATH}`, "g");

const TRAILING = /[.,;:!?)\]}>'"’”।*_]+$/;

function stripTrailing(raw: string): string {
  let s = raw;
  for (;;) {
    const before = s;
    s = s.replace(TRAILING, "");
    // Keep a closing bracket when it balances an opening one inside the URL.
    if (s === before) break;
  }
  return s;
}

function validIpv4(s: string): boolean {
  const host = s.split(/[/:?#]/)[0];
  const parts = host.split(".");
  return parts.length === 4 && parts.every((p) => /^[0-9]{1,3}$/.test(p) && Number(p) <= 255);
}

type Found = { start: number; end: number; value: string };

function collect(re: RegExp, text: string, filter?: (m: RegExpExecArray) => boolean): Found[] {
  const out: Found[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    if (filter && !filter(m)) {
      // Allow a later start inside this match (for example after a rejected prefix).
      re.lastIndex = m.index + 1;
      continue;
    }
    out.push({ start: m.index, end: m.index + m[0].length, value: m[0] });
  }
  return out;
}

export function extractUrls(text: string): string[] {
  const found: Found[] = [];
  found.push(...collect(SCHEME_URL, text));
  found.push(...collect(WWW_URL, text, (m) => !/[@.\w-]/.test(text[m.index - 1] ?? " ")));
  found.push(
    ...collect(BARE_DOMAIN, text, (m) => {
      const prev = text[m.index - 1] ?? " ";
      // Not inside an email / UPI id (preceded by "@"), a longer word, or a dotted token.
      return !/[@.\w/-]/.test(prev);
    }),
  );
  found.push(...collect(IPV4_URL, text, (m) => !/[@.\w/-]/.test(text[m.index - 1] ?? " ") && validIpv4(m[0])));

  // Earliest first; drop matches that sit inside an already accepted one.
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const accepted: Found[] = [];
  for (const f of found) {
    if (accepted.some((a) => f.start >= a.start && f.end <= a.end)) continue;
    accepted.push(f);
  }

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const f of accepted) {
    const cleaned = stripTrailing(f.value);
    if (cleaned.length < 4) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    urls.push(cleaned);
    if (urls.length >= MAX_URLS) break;
  }
  return urls;
}

// ------------------------------------------------------------------ phones

const PHONE = /(?:\(?\+?\s?(?:00)?91\)?[\s-]*|\b0[\s-]*)?[6-9](?:[\s-]?[0-9]){9}/g;

export function extractPhones(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  PHONE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PHONE.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    const prev = text[start - 1] ?? " ";
    const next = text[end] ?? " ";
    // Reject numbers that are part of a longer digit run (card, Aadhaar, order ids ...).
    if (/[0-9]/.test(prev) || /[0-9]/.test(next)) {
      PHONE.lastIndex = start + 1;
      continue;
    }
    const digits = m[0].replace(/\D/g, "");
    const national = digits.slice(-10);
    const canonical = `+91${national}`;
    if (!seen.has(canonical)) {
      seen.add(canonical);
      out.push(canonical);
    }
  }
  return out;
}

// ---------------------------------------------------------------- UPI ids

/** Known UPI handle suffixes (not exhaustive). A handle followed by ".com" etc. is an email, not a UPI id. */
const UPI_HANDLES = [
  "okaxis", "oksbi", "okicici", "okhdfcbank", "okbizaxis", "ybl", "ibl", "axl", "paytm", "ptyes", "pthdfc", "ptsbi",
  "ptaxis", "upi", "apl", "fbl", "sbi", "hdfcbank", "icici", "axisbank", "axisb", "kotak", "pnb", "boi", "cnrb",
  "barodampay", "aubank", "idfcbank", "idfcfirst", "indus", "yesbank", "unionbank", "federal", "rbl", "jupiter",
  "slice", "freecharge", "ikwik", "airtel", "jio", "postbank", "waicici", "wahdfcbank", "waaxis", "wasbi", "yapl",
  "abfspay", "tapicici", "pingpay", "dbs", "hsbc", "citi", "scb", "uboi", "iob", "centralbank", "cub", "kvb", "kbl",
  "dlb", "mahb", "psb", "sib", "tmb", "bandhan", "equitas", "esaf", "ujjivan", "utkarsh", "nsdl", "jkb", "vjb",
  "allbank", "andb", "corp", "lvb", "obc", "uco", "ubi", "naviaxis", "okbizicici", "mbk", "fam", "ezetap", "gpay",
  "phonepe", "amazonpay", "cmsidfc", "rajgovhdfcbank", "yespay", "kmbl", "kmb", "imobile", "eazypay", ].sort((a, b) => b.length - a.length);
const UPI_ID = new RegExp(`[a-z0-9][a-z0-9._-]{1,}@(?:${UPI_HANDLES.join("|")})(?![a-z0-9-])(?!\\.[a-z0-9])`, "gi");

export function extractUpiIds(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(UPI_ID)) {
    const idx = m.index ?? 0;
    if (/[a-z0-9@]/i.test(text[idx - 1] ?? " ")) continue;
    const v = m[0];
    const key = v.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

// ------------------------------------------------------------------ emails

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi;

export function extractEmails(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(EMAIL)) {
    const v = m[0].replace(/[.,;:!?)\]}]+$/, "");
    const key = v.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
    if (out.length >= MAX_URLS) break;
  }
  return out;
}

export function extractEntities(text: string): ExtractedEntities {
  const src = typeof text === "string" ? text : "";
  return {
    urls: extractUrls(src),
    phones: extractPhones(src),
    upiIds: extractUpiIds(src),
    emails: extractEmails(src),
  };
}
