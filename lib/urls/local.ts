/**
 * Offline URL checks. Nothing in this file makes a network request: it only parses the
 * string and looks at its shape (shortener, lookalike brand name, odd characters ...).
 *
 * HINDI REVIEW NOTE: the Hindi flag explanations below were written by the engine author and
 * should be reviewed by a fluent Hindi speaker before the demo.
 *
 * Registrable-domain heuristic (there is no public-suffix library): the registrable domain is
 * the last two labels ("example.com"), or the last three when the last two form a known
 * multi-part suffix such as "co.in" or "com.au" (see MULTI_PART_SUFFIXES). This is a small,
 * incomplete list. Unknown multi-part suffixes are treated as ordinary two-label domains.
 * Reserved demo domains (.example, .test, .invalid, example.com) are analyzed like any other.
 */
import type { UrlFlag } from "@/lib/types";
import { BRANDS, BRAND_AFFIXES, TRUSTED_SUFFIXES, type Brand } from "@/lib/urls/brands";

const MAX_URL_CHARS = 2048;

/** Schemes we refuse outright. */
const BLOCKED_SCHEMES = new Set([
  "javascript", "data", "file", "vbscript", "mailto", "tel", "sms", "blob", "about", "intent", "ftp", "market",
  "content", "chrome", "view-source", "ws", "wss", "smb", "ssh", "telnet", "sftp", "git", "gopher", "ldap",
]);

/** Common multi-part public suffixes (documented heuristic, not exhaustive). */
const MULTI_PART_SUFFIXES = new Set([
  "co.in", "org.in", "net.in", "gov.in", "nic.in", "ac.in", "res.in", "edu.in", "firm.in", "gen.in", "ind.in",
  "mil.in", "bank.in", "fin.in", "co.uk", "org.uk", "gov.uk", "ac.uk", "me.uk", "com.au", "net.au", "org.au",
  "gov.au", "edu.au", "co.nz", "co.za", "com.sg", "com.my", "com.br", "com.cn", "co.jp", "com.pk", "com.bd",
  "com.np", "com.lk", "co.id", "com.hk", "com.tr", "com.mx", "com.ng", "co.ke", "co.kr", "com.ph", "com.vn",
  "com.sa", "com.eg", "co.th", "or.jp", "ne.jp", "ac.jp",
]);

/** Link shorteners. wa.me is a WhatsApp chat link, not a shortener, and is deliberately absent. */
const SHORTENERS = new Set([
  "bit.ly", "bitly.com", "tinyurl.com", "cutt.ly", "rb.gy", "t.co", "goo.gl", "is.gd", "v.gd", "shorturl.at",
  "ow.ly", "buff.ly", "bl.ink", "t.ly", "tiny.cc", "s.id", "rebrand.ly", "shorte.st", "adf.ly", "clck.ru", "qr.ae",
  "tr.im", "ift.tt", "soo.gd", "1url.com", "shrtco.de", "trib.al", "shorturl.com", "short.io", "urlz.fr", "lnk.bio",
  "tinu.be", "u.to", "x.co", "mcaf.ee", "cli.re", "t2m.io", "bit.do", "j.mp", "han.gl", "kutt.it", "urlr.me",
]);

/** TLDs that scammers use a lot and honest sites use less. Weak signal only. */
const SUSPICIOUS_TLDS = new Set([
  "top", "xyz", "click", "icu", "vip", "shop", "live", "cfd", "sbs", "buzz", "rest", "monster", "gq", "ml", "tk",
  "cf", "ga", "work", "loan", "bid", "win", "cyou", "fun", "zip", "mov", "support", "men", "download", "stream",
]);

const FLAG_TEXT = {
  shortener: {
    en: "This is a shortened link, so you cannot see where it really leads.",
    hi: "यह छोटा किया हुआ लिंक है, इसलिए आप देख नहीं सकते कि यह असल में कहां ले जाएगा।",
  },
  punycode: {
    en: "The web address uses special characters that can imitate a well-known site.",
    hi: "इस वेब पते में खास अक्षर हैं जो किसी जाने-पहचाने वेबसाइट की नकल कर सकते हैं।",
  },
  ip_host: {
    en: "The link uses a number address instead of a website name. Real banks and shops rarely do this.",
    hi: "लिंक में वेबसाइट के नाम की जगह नंबर वाला पता है। असली बैंक या दुकानें ऐसा बहुत कम करती हैं।",
  },
  http_only: {
    en: "The link does not use a secure connection (it starts with http, not https).",
    hi: "लिंक सुरक्षित कनेक्शन का इस्तेमाल नहीं करता (यह https की जगह http से शुरू होता है)।",
  },
  brand_lookalike: {
    en: "The web address uses the name of a well-known bank or service, but it is not that organization's official address.",
    hi: "वेब पते में किसी जाने-माने बैंक या सेवा का नाम है, लेकिन यह उस संस्था का आधिकारिक पता नहीं है।",
  },
  misleading_subdomain: {
    en: "A well-known name appears at the start of the address, but the site really belongs to a different domain. Look at the last part of the address.",
    hi: "पते की शुरुआत में किसी जाने-माने नाम का इस्तेमाल है, पर साइट असल में किसी दूसरे डोमेन की है। पते का आखिरी हिस्सा देखें।",
  },
  suspicious_tld: {
    en: "The address ends in a type (such as .top or .xyz) that scammers use a lot. Many honest sites use them too, so this is only a weak sign.",
    hi: "पते का अंत ऐसे प्रकार से होता है (जैसे .top या .xyz) जिसे ठग बहुत इस्तेमाल करते हैं। कई ईमानदार साइटें भी इन्हें इस्तेमाल करती हैं, इसलिए यह केवल हल्का संकेत है।",
  },
  userinfo_in_url: {
    en: "The address contains an '@' sign, which can hide the real website behind a familiar name.",
    hi: "पते में '@' का निशान है, जिससे असली वेबसाइट किसी जाने-पहचाने नाम के पीछे छिप सकती है।",
  },
} as const;

const FLAG_POINTS = {
  shortener: 10,
  punycode: 20,
  ip_host: 20,
  http_only: 3,
  brand_lookalike: 20,
  misleading_subdomain: 25,
  suspicious_tld: 5,
  userinfo_in_url: 25,
} as const;

function flag(id: keyof typeof FLAG_TEXT): UrlFlag {
  return { id, explanation: { ...FLAG_TEXT[id] }, points: FLAG_POINTS[id] };
}

// ------------------------------------------------------------- normalization

/**
 * Returns a normalized http(s) URL string, or null if the input is not a usable URL.
 * Adds https:// when missing, lowercases the host (via the URL parser), rejects other schemes.
 */
export function normalizeUrl(raw: string): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim().replace(/^[<"'“‘(]+/, "").replace(/[>"'”’)]+$/, "").trim();
  if (!s || s.length > MAX_URL_CHARS || /\s/.test(s)) return null;

  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(s);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    const rest = s.slice(schemeMatch[0].length);
    if (rest.startsWith("//")) {
      if (scheme !== "http" && scheme !== "https") return null;
    } else if (BLOCKED_SCHEMES.has(scheme)) {
      return null;
    } else if (/^[0-9]+(?:[/?#]|$)/.test(rest)) {
      // "example.com:8080/path" looks like a scheme but is host:port.
      s = `https://${s}`;
    } else {
      return null;
    }
  } else if (s.startsWith("//")) {
    s = `https:${s}`;
  } else {
    s = `https://${s}`;
  }

  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.replace(/\.$/, "");
  if (!host) return null;
  const isIp = isIpv4(host) || host.startsWith("[");
  if (!isIp && !host.includes(".")) return null;
  return u.href;
}

function isIpv4(host: string): boolean {
  return /^[0-9]{1,3}(?:\.[0-9]{1,3}){3}$/.test(host);
}

// ------------------------------------------------------ registrable domain

export type DomainParts = { hostname: string; suffix: string; registrable: string; sld: string; subLabels: string[] };

/** Heuristic split of a hostname into suffix / registrable domain / subdomain labels. */
export function domainParts(hostname: string): DomainParts {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const labels = host.split(".");
  if (labels.length < 2) return { hostname: host, suffix: host, registrable: host, sld: "", subLabels: [] };
  const last2 = labels.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(last2) && labels.length >= 3) {
    return {
      hostname: host,
      suffix: last2,
      registrable: labels.slice(-3).join("."),
      sld: labels[labels.length - 3],
      subLabels: labels.slice(0, -3),
    };
  }
  if (MULTI_PART_SUFFIXES.has(last2)) {
    return { hostname: host, suffix: last2, registrable: host, sld: "", subLabels: [] };
  }
  return {
    hostname: host,
    suffix: labels[labels.length - 1],
    registrable: last2,
    sld: labels[labels.length - 2],
    subLabels: labels.slice(0, -2),
  };
}

// ----------------------------------------------------------- brand matching

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "@": "a", "$": "s" };

function leet(s: string): string {
  return s.replace(/[01345@$]/g, (c) => LEET[c] ?? c).replace(/rn/g, "m").replace(/vv/g, "w");
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/** Brands whose name is also an ordinary English word: require a "bank/login/kyc..." style word too. */
const AMBIGUOUS_BRANDS = new Set(["axis"]);

/** Does this DNS label contain / imitate the brand name? */
function labelMatchesBrand(brand: Brand, label: string): boolean {
  const tokens = label.toLowerCase().split(/[-_]+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const normTokens = tokens.map(leet);
  const stripped = tokens.map((t) => leet(t.replace(/[0-9]+$/, "")));
  const compact = normTokens.join("");
  const hasAffix = tokens.some((t) => BRAND_AFFIXES.has(t)) || tokens.length > 1;

  for (const key of brand.keys) {
    if (key.length >= 5) {
      if (compact.includes(key)) return true;
      if (key.length >= 6 && normTokens.some((t) => t.length >= 5 && editDistanceAtMostOne(t, key))) return true;
    } else {
      for (const t of [...normTokens, ...stripped]) {
        if (t === key) {
          if (!AMBIGUOUS_BRANDS.has(brand.id) || hasAffix) return true;
          continue;
        }
        for (const a of BRAND_AFFIXES) {
          if (t === key + a || t === a + key) return true;
        }
      }
    }
  }
  return false;
}

function isOfficial(brand: Brand, parts: DomainParts): boolean {
  if (TRUSTED_SUFFIXES.has(parts.suffix)) return true;
  if (brand.officialTlds?.includes(parts.suffix)) return true;
  return brand.official.includes(parts.registrable);
}

/** Find the first brand that the hostname imitates and how. */
function brandFlag(parts: DomainParts): "brand_lookalike" | "misleading_subdomain" | null {
  let sub = false;
  for (const brand of BRANDS) {
    if (isOfficial(brand, parts)) continue;
    if (parts.sld && labelMatchesBrand(brand, parts.sld)) return "brand_lookalike";
    if (parts.subLabels.some((l) => labelMatchesBrand(brand, l))) sub = true;
  }
  return sub ? "misleading_subdomain" : null;
}

// --------------------------------------------------------------- the checks

/** Local, offline URL analysis. Returns null when the URL cannot be parsed. */
export function localUrlFlags(raw: string): { url: string; hostname: string; flags: UrlFlag[] } | null {
  const url = normalizeUrl(raw);
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const hostname = u.hostname.toLowerCase().replace(/\.$/, "");
  const flags: UrlFlag[] = [];
  const isIp = isIpv4(hostname) || hostname.startsWith("[");

  if (u.username || u.password) flags.push(flag("userinfo_in_url"));
  if (isIp) {
    flags.push(flag("ip_host"));
  } else {
    const parts = domainParts(hostname);
    if (SHORTENERS.has(parts.registrable) || SHORTENERS.has(hostname)) flags.push(flag("shortener"));
    if (hostname.split(".").some((l) => l.startsWith("xn--"))) flags.push(flag("punycode"));
    const brand = brandFlag(parts);
    if (brand) flags.push(flag(brand));
    if (SUSPICIOUS_TLDS.has(parts.suffix.split(".").pop() ?? "")) flags.push(flag("suspicious_tld"));
  }
  if (u.protocol === "http:") flags.push(flag("http_only"));

  return { url, hostname, flags };
}
