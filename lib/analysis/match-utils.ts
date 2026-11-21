/**
 * Matching helpers for the rule engine.
 *
 * Why this file exists (spec 7.7): ASCII `\b` does not understand Devanagari, so "pin" inside
 * "shipping" or a Hindi word followed by a vowel sign would be mis-bounded. We build our own
 * boundary from Unicode properties: a "word character" is any letter, combining mark (this
 * includes Devanagari vowel signs), digit or underscore.
 *
 * We deliberately avoid lookbehind (`(?<!...)`) because older Safari versions that are still
 * common on budget iPhones do not support it. Instead the leading boundary is a captured
 * prefix group `(^|[^word])`, and the real match is group 2.
 */

export const WORD = "\\p{L}\\p{M}\\p{N}_";

export type Span = { start: number; end: number; text: string };

/** Compile a pattern body with Unicode-aware whole-word boundaries (group 1 = prefix, group 2 = match). */
export function wb(source: string): RegExp {
  return new RegExp(`(^|[^${WORD}])(${source})(?![${WORD}])`, "giu");
}

/** Gap of up to `max` characters that never crosses a sentence end; ends on a non-word character. */
export function gapw(max: number): string {
  return `(?:[^.!?\\n\\u0964\\u0965]{0,${max}}?[^${WORD}.!?\\n\\u0964\\u0965])`;
}

/** Same as gapw but may be empty or end on a word character (used between multi-word phrases). */
export function gap(max: number): string {
  return `[^.!?\\n\\u0964\\u0965]{0,${max}}?`;
}

/** Turn "a b c" into a pattern where spaces match any run of whitespace. */
export function sp(phrase: string): string {
  return phrase.replace(/ /g, "\\s+");
}

/** Find all whole-word matches. Indices refer to `text` (plus an optional offset). */
export function findAll(re: RegExp, text: string, offset = 0): Span[] {
  const out: Span[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const lead = m[1] ? m[1].length : 0;
    let start = m.index + lead;
    const end = m.index + m[0].length;
    // Optional named group "ev": the evidence is only that trailing part of the match.
    const ev = m.groups?.ev;
    if (ev) start = end - ev.length;
    out.push({ start: start + offset, end: end + offset, text: text.slice(start, end) });
    if (m[0].length === 0) re.lastIndex++;
    else re.lastIndex = end;
  }
  return out;
}

export function firstOf(spans: Span[]): Span | undefined {
  let best: Span | undefined;
  for (const s of spans) {
    if (!best || s.start < best.start || (s.start === best.start && s.end - s.start > best.end - best.start)) best = s;
  }
  return best;
}

// ------------------------------------------------------------- sentences

const ABBREVIATIONS = new Set([
  "rs", "no", "mr", "mrs", "ms", "dr", "st", "vs", "etc", "inr", "ref", "approx", "sr", "jr",
  "ac", "eg", "ie", "pvt", "ltd", "co", "prof", "govt", "dept", "tel", "ph", "mob",
]);

/** Split text into sentences, keeping indices into the original string. */
export function splitSentences(text: string): Span[] {
  const out: Span[] = [];
  let start = 0;
  const push = (s: number, e: number) => {
    while (s < e && /\s/.test(text[s])) s++;
    while (e > s && /\s/.test(text[e - 1])) e--;
    if (e > s) out.push({ start: s, end: e, text: text.slice(s, e) });
  };
  const n = text.length;
  for (let i = 0; i < n; i++) {
    const c = text[i];
    if (c === "\n" || c === "\r") {
      push(start, i);
      start = i + 1;
    } else if (c === "।" || c === "॥") {
      push(start, i + 1);
      start = i + 1;
    } else if (c === "." || c === "!" || c === "?" || c === "…") {
      let j = i;
      while (j + 1 < n && /[.!?…]/.test(text[j + 1])) j++;
      const atEnd = j + 1 >= n || /\s/.test(text[j + 1]);
      if (atEnd) {
        if (c === "." && j === i) {
          const before = text.slice(Math.max(0, i - 8), i);
          const m = /([A-Za-z]+)$/.exec(before);
          if (m && (ABBREVIATIONS.has(m[1].toLowerCase()) || m[1].length === 1)) {
            i = j;
            continue;
          }
        }
        push(start, j + 1);
        start = j + 1;
      }
      i = j;
    }
  }
  push(start, n);
  return out;
}

const CLAUSE_SPLIT = new RegExp(
  [
    "[,;\\u060C]\\s",
    ":\\s",
    "\\s[\\u2013\\u2014-]\\s",
    "\\s(?:but|however|instead|then|otherwise)\\s",
    "\\s(?:\\u0932\\u0947\\u0915\\u093F\\u0928|\\u092A\\u0930\\u0928\\u094D\\u0924\\u0941|\\u092A\\u0930\\u0902\\u0924\\u0941|\\u092E\\u0917\\u0930|\\u092B\\u093F\\u0930)\\s",
    "\\s(?:lekin|magar|phir)\\s",
  ].join("|"),
  "giu",
);

/** Split each sentence into clauses (comma, semicolon, colon, dash, "but"...). Negation is judged per clause. */
export function splitClauses(sentences: Span[]): Span[] {
  const out: Span[] = [];
  for (const s of sentences) {
    let last = 0;
    CLAUSE_SPLIT.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CLAUSE_SPLIT.exec(s.text)) !== null) {
      if (m.index > last) out.push({ start: s.start + last, end: s.start + m.index, text: s.text.slice(last, m.index) });
      last = m.index + m[0].length;
      if (m[0].length === 0) CLAUSE_SPLIT.lastIndex++;
    }
    if (last < s.text.length) out.push({ start: s.start + last, end: s.end, text: s.text.slice(last) });
  }
  return out.filter((c) => c.text.trim().length > 0);
}

// -------------------------------------------------------------- negation

const NEGATION_CUES = wb(
  [
    "not",
    "never",
    "no\\s+one",
    "nobody",
    "don['’]?t",
    "dont",
    "shouldn['’]t",
    "mustn['’]t",
    "can['’]t",
    "cannot",
    "won['’]t",
    "wouldn['’]t",
    // Hindi (Devanagari): na, naa, nahin, nahi, mat, kabhi
    "न",
    "ना",
    "नहीं",
    "नही",
    "मत",
    "कभी",
    // Hinglish
    "mat",
    "nahi",
    "nahin",
    "nhi",
    "kabhi",
    "na\\s+(?:kar|bata|de|den|dena|share|bhej|daal|dalo)\\w*",
  ].join("|"),
);

/** "if you do not pay ..." describes a demand, it is not advice to the reader. */
const CONDITIONAL_BEFORE = /(?:\b(?:if|unless|in\s+case)\s+(?:you|u|the\s+user|user|customer)\s+(?:still\s+|also\s+|have\s+|are\s+|do\s+|did\s+|fail\s+to\s+)*)$/i;

/** "If someone asks for your OTP..." / "Beware of callers who ask..." introduces a warning. */
const ADVICE_INTRO = wb(
  [
    "(?:if|when|whenever)\\s+(?:anyone|someone|somebody|any\\s+one|a\\s+caller|any\\s+caller|a\\s+stranger|a\\s+person|they)\\s+(?:asks?|calls?|says?|tells?|requests?|demands?|contacts?)",
    "(?:beware|be\\s+careful)",
    "(?:अगर|यदि|जब)\\s+कोई",
  ].join("|"),
);

/** True when the clause negates or warns against the action (safety advice). Evaluated per clause. */
export function isNegated(clause: string, extraCue?: RegExp): boolean {
  for (const cue of findAll(NEGATION_CUES, clause)) {
    if (CONDITIONAL_BEFORE.test(clause.slice(0, cue.start))) continue;
    return true;
  }
  if (findAll(ADVICE_INTRO, clause).length > 0) return true;
  if (extraCue && findAll(extraCue, clause).length > 0) return true;
  return false;
}
