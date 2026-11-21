/**
 * Browser-side privacy pre-processing (spec 7.1 step 2). Pure TypeScript, no Node-only APIs.
 *
 * redactSensitive hides things that must never leave the device: OTPs / PINs / CVVs next to
 * their label (English, Hindi, Hinglish), card numbers, Aadhaar-like numbers and other long
 * digit runs. It deliberately keeps ordinary 10-digit Indian mobile numbers, amounts and URLs,
 * because the analysis needs them.
 */

export const HIDDEN_MARKER = "[hidden]";

const D = "[0-9\\u0966-\\u096F]";
/** An amount such as "Rs 5000" or "₹ 1,200.50", allowed inside the gap between a label and its code. */
const AMOUNT = "(?:rs\\.?|inr|\\u20B9|rupees)\\s*[0-9][0-9,]*(?:\\.[0-9]+)?";

const LABELS = [
  "one[- ]time[- ]pass(?:word|code)",
  "o\\.?t\\.?p",
  "(?:verification|security|authentication|auth|confirmation|login|sms) code",
  "code",
  "(?:upi |atm |card |debit card |credit card |net\\s*banking |transaction |secret )?m?pin(?!\\s*-?\\s*code)",
  "cvv2?",
  "cvc",
  "pass(?:word|code)",
  "ओटीपी", // ओटीपी
  "वन टाइम पासवर्ड", // वन टाइम पासवर्ड
  "(?:वेरिफिकेशन|सत्यापन|सिक्योरिटी) कोड", // वेरिफिकेशन/सत्यापन/सिक्योरिटी कोड
  "कोड", // कोड
  "(?:यूपीआई |एटीएम )?पिन(?!\\s*-?\\s*कोड)", // पिन
  "सीवीवी", // सीवीवी
  "पासवर्ड", // पासवर्ड
].map((l) => l.replace(/ /g, "\\s+"));

const LABEL_ALT = LABELS.join("|");

/** label ... code (e.g. "OTP is 482913", "OTP for login: 482913", "पिन 1234"). */
const LABEL_THEN_CODE = new RegExp(
  `(?:^|[^\\p{L}\\p{M}\\p{N}_])(?:${LABEL_ALT})(?![\\p{L}\\p{M}\\p{N}_])(?:${AMOUNT}|[^0-9\\u0966-\\u096F\\n]){0,25}?(?<code>${D}{4,8})(?!${D})`,
  "giu",
);

/** CVV / CVC codes are 3 or 4 digits. */
const CVV_THEN_CODE = new RegExp(
  `(?:^|[^\\p{L}\\p{M}\\p{N}_])(?:cvv2?|cvc|सीवीवी)(?![\\p{L}\\p{M}\\p{N}_])(?:[^0-9\\u0966-\\u096F\\n]){0,12}?(?<code>${D}{3,4})(?!${D})`,
  "giu",
);

/** code ... label (e.g. "482913 is your OTP", "482913 आपका ओटीपी है"). */
const CODE_THEN_LABEL = new RegExp(
  `(?<code>${D}{4,8})(?!${D})(?:\\s+(?:is|as|are)\\s+|\\s*[-:]?\\s*)(?:(?:your|the|ur|this|one)\\s+|\\u0906\\u092A\\u0915\\u093E\\s+|\\u0906\\u092A\\u0915\\u0940\\s+)?(?:${LABEL_ALT})(?![\\p{L}\\p{M}\\p{N}_])`,
  "giu",
);

/** Card numbers written in groups of four (13-19 digits) or the 4-6-5 layout used by some cards. */
const CARD_LIKE = new RegExp(`${D}{4}(?:[ -]${D}{4}){2,3}(?:[ -]${D}{1,3})?|${D}{4}[ -]${D}{6}[ -]${D}{5}`, "gu");
/** Aadhaar style 4-4-4. */
const AADHAAR_LIKE = new RegExp(`${D}{4}[ -]${D}{4}[ -]${D}{4}`, "gu");
/** Any plain run of 11 or more digits. */
const LONG_RUN = new RegExp(`${D}{11,}`, "gu");

type Range = { start: number; end: number };

function digitsOnly(s: string): string {
  return s.replace(/[०-९]/g, (c) => String(c.charCodeAt(0) - 0x0966)).replace(/\D/g, "");
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && /[0-9०-९]/.test(ch);
}

/** True when the digits look like an Indian mobile number with country / trunk prefix (should stay visible). */
function looksLikeIndianMobile(digits: string): boolean {
  return (
    (digits.length === 12 && /^91[6-9]/.test(digits)) ||
    (digits.length === 11 && /^0[6-9]/.test(digits)) ||
    (digits.length === 14 && /^0091[6-9]/.test(digits))
  );
}

function collect(re: RegExp, text: string, ranges: Range[], pick?: (m: RegExpExecArray) => Range | null): void {
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].length === 0) {
      re.lastIndex++;
      continue;
    }
    if (pick) {
      const r = pick(m);
      if (r) ranges.push(r);
    } else {
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
  }
}

/** Range of the named group "code" inside a match (works without the `d` flag). */
function codeRange(m: RegExpExecArray, side: "end" | "start"): Range | null {
  const code = m.groups?.code;
  if (!code) return null;
  if (side === "end") {
    const end = m.index + m[0].length;
    return { start: end - code.length, end };
  }
  return { start: m.index, end: m.index + code.length };
}

export function redactSensitive(text: string): { text: string; redactions: number } {
  if (typeof text !== "string" || text.length === 0) return { text: typeof text === "string" ? text : "", redactions: 0 };
  const ranges: Range[] = [];

  collect(LABEL_THEN_CODE, text, ranges, (m) => codeRange(m, "end"));
  collect(CVV_THEN_CODE, text, ranges, (m) => codeRange(m, "end"));
  collect(CODE_THEN_LABEL, text, ranges, (m) => (isDigit(text[m.index - 1]) ? null : codeRange(m, "start")));

  collect(CARD_LIKE, text, ranges, (m) => {
    const start = m.index;
    const end = start + m[0].length;
    if (isDigit(text[start - 1]) || isDigit(text[end])) return null;
    const digits = digitsOnly(m[0]);
    if (digits.length < 13 || digits.length > 19) return null;
    return { start, end };
  });

  collect(AADHAAR_LIKE, text, ranges, (m) => {
    const start = m.index;
    const end = start + m[0].length;
    if (isDigit(text[start - 1]) || isDigit(text[end])) return null;
    // "+91 9876 543210"-style phone numbers written 4-4-4 stay visible.
    if (text[start - 1] === "+" || looksLikeIndianMobile(digitsOnly(m[0]))) return null;
    return { start, end };
  });

  collect(LONG_RUN, text, ranges, (m) => {
    const start = m.index;
    const end = start + m[0].length;
    if (isDigit(text[start - 1]) || isDigit(text[end])) return null;
    if (looksLikeIndianMobile(digitsOnly(m[0]))) return null;
    return { start, end };
  });

  if (ranges.length === 0) return { text, redactions: 0 };

  // Merge overlapping ranges, then replace from the end so indices stay valid.
  ranges.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else merged.push({ ...r });
  }
  let out = text;
  for (let i = merged.length - 1; i >= 0; i--) {
    out = out.slice(0, merged[i].start) + HIDDEN_MARKER + out.slice(merged[i].end);
  }
  return { text: out, redactions: merged.length };
}

/**
 * Mask a phone-like string, keeping only the last 3 digits.
 * Indian numbers become "+91 ••••• ••123". Other numbers become bullets plus the last 3 digits.
 */
export function maskPhone(input: string): string {
  const raw = typeof input === "string" ? input.trim() : "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return "•••";
  const last3 = digits.slice(-3);
  if (digits.length < 4) return digits.length <= 3 ? "•".repeat(digits.length) : last3;

  let national: string | null = null;
  const plus = raw.startsWith("+") || raw.startsWith("00");
  if (digits.length === 12 && digits.startsWith("91")) national = digits.slice(2);
  else if (digits.length === 14 && digits.startsWith("0091")) national = digits.slice(4);
  else if (digits.length === 11 && digits.startsWith("0")) national = digits.slice(1);
  else if (digits.length === 10 && !plus) national = digits;
  if (national && national.length === 10) return `+91 ••••• ••${national.slice(-3)}`;

  return `${plus ? "+" : ""}${"•".repeat(Math.max(3, digits.length - 3))}${last3}`;
}
