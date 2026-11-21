/**
 * Deterministic, bilingual rule engine (spec 6 F01/F04/F07 and 7.3/7.7).
 *
 * Design notes:
 *  - Every signal is detected as a boolean and scored ONCE. Correlated signals share a group
 *    where only the strongest member scores fully (see GROUPS). A few meaningful combinations
 *    add a small bonus (see COMBOS).
 *  - Direction is judged per clause: "Never share your OTP" is advice, but "Never share your
 *    OTP. Reply with the OTP to confirm" still fires on the second sentence.
 *  - Matching is whole-word (Unicode aware, see match-utils.ts) and runs on the ORIGINAL text,
 *    so every `evidence` string is an exact substring of the input.
 *  - The text is untrusted data. Instructions aimed at the checker only add a small indicator.
 *  - Nothing here ever outputs a "safe" verdict. No match simply means no rule fired.
 */
import type { Indicator, RuleOutput, ScamCategory } from "@/lib/types";
import { LIMITS } from "@/lib/types";
import { extractEntities } from "@/lib/urls/extract";
import { findAll, firstOf, isNegated, splitClauses, splitSentences, wb, type Span } from "@/lib/analysis/match-utils";
import * as D from "@/lib/analysis/rule-data";

// ------------------------------------------------------------- compiled regexes

const compile = (patterns: string[]) => wb(patterns.join("|"));

const RE = {
  credential: compile(D.CREDENTIAL_PATTERNS),
  credObject: wb(D.CRED_OBJECT_ANY),
  kyc: compile(D.KYC_PATTERNS),
  payment: compile(D.PAYMENT_PATTERNS),
  advance: compile(D.ADVANCE_FEE_PATTERNS),
  urgency: compile(D.URGENCY_PATTERNS),
  urgencyExpires: wb(D.URGENCY_EXPIRES),
  threat: compile(D.THREAT_PATTERNS),
  prize: compile(D.PRIZE_PATTERNS),
  gambling: compile(D.GAMBLING_PATTERNS),
  shortlink: compile(D.SHORTLINK_PROMPT_PATTERNS),
  obfuscation: compile(D.OBFUSCATION_PATTERNS),
  refund: compile(D.REFUND_PATTERNS),
  installStrong: compile(D.INSTALL_STRONG_PATTERNS),
  installWeak: compile(D.INSTALL_WEAK_PATTERNS),
  secrecy: compile(D.SECRECY_PATTERNS),
  isolation: compile(D.ISOLATION_PATTERNS),
  job: compile(D.JOB_PATTERNS),
  investment: compile(D.INVESTMENT_PATTERNS),
  loan: compile(D.LOAN_PATTERNS),
  relative: wb(D.RELATIVE_WORDS),
  newNumber: compile(D.NEW_NUMBER_PATTERNS),
  emergency: compile(D.EMERGENCY_PATTERNS),
  sextortion: compile(D.SEXTORTION_PATTERNS),
  supportCta: wb(D.SUPPORT_CTA),
  supportWord: wb(D.SUPPORT_WORD),
  mobile: wb(D.MOBILE_NUMBER),
  checker: compile(D.CHECKER_PATTERNS),
  linkPrompt: compile(D.LINK_PROMPT_PATTERNS),
};

const IMPERSONATION_RE = (Object.keys(D.IMPERSONATION_PATTERNS) as D.OrgKind[]).map((kind) => ({
  kind,
  re: compile(D.IMPERSONATION_PATTERNS[kind]),
}));

// ------------------------------------------------------------------- scanning

type Ctx = { text: string; sentences: Span[]; clauses: Span[] };

type ClauseScan = { hit?: Span; adviceSeen: boolean };

/** Scan clause by clause; hits inside a clause that negates/warns are skipped (and noted). */
function scanClauses(
  ctx: Ctx,
  re: RegExp,
  opts: { negation?: boolean; skip?: (clause: Span, hit: Span) => boolean } = {},
): ClauseScan {
  let best: Span | undefined;
  let adviceSeen = false;
  for (const clause of ctx.clauses) {
    for (const hit of findAll(re, clause.text, clause.start)) {
      if (opts.skip && opts.skip(clause, hit)) continue;
      if (opts.negation && isNegated(clause.text)) {
        adviceSeen = true;
        continue;
      }
      if (!best || hit.start < best.start) best = hit;
    }
  }
  return { hit: best, adviceSeen };
}

function scanText(ctx: Ctx, re: RegExp): Span | undefined {
  return firstOf(findAll(re, ctx.text));
}

// ------------------------------------------------------------ scoring tables

/** Correlated signals: the strongest scores fully, the others at most 5 points. */
const GROUPS: string[][] = [
  ["credential_request", "kyc_request"],
  ["payment_request", "advance_fee"],
  ["prize_bait", "refund_bait"],
  ["install_request", "install_app_link"],
];
const SECONDARY_CAP = 5;
const COMBO_CAP = 30;

type Fired = { id: string; span?: Span; points: number };

function has(fired: Map<string, Fired>, ...ids: string[]): boolean {
  return ids.some((id) => fired.has(id));
}

/** Meaningful combinations only (spec 7.7). Each adds a small bonus once. */
function combos(
  fired: Map<string, Fired>,
  hasLink: boolean,
  amountAsked: boolean,
): Array<{ key: string; bonus: number }> {
  const out: Array<{ key: string; bonus: number }> = [];
  const link = hasLink || has(fired, "click_link_prompt");
  const cred = has(fired, "credential_request", "kyc_request");
  const pay = has(fired, "payment_request", "advance_fee");
  const bait = has(fired, "prize_bait", "refund_bait");
  const install = has(fired, "install_request", "install_app_link");
  const threat = has(fired, "threat");
  const urgency = has(fired, "urgency");
  const imp = has(fired, "impersonation");
  const cover = has(fired, "secrecy", "isolation");

  // A plain "pay online" reminder with a link is how genuine bills and premiums look, so a payment
  // request alone does not add the link bonus. Fees, urgency, threats, credentials, app installs
  // and bait still do.
  const advance = has(fired, "advance_fee");
  const lure = has(fired, "investment", "job_task", "loan_bait", "gambling_bait", "obfuscated_wording");
  if (link && (threat || urgency || advance || cred || install || bait || lure)) out.push({ key: "link_with_pressure", bonus: 10 });
  if (imp && cred) out.push({ key: "impersonation_credential", bonus: 10 });
  if (imp && (threat || pay || install)) out.push({ key: "impersonation_pressure", bonus: 5 });
  if (cred && (urgency || threat)) out.push({ key: "credential_pressure", bonus: 5 });
  if (cred && bait) out.push({ key: "credential_bait", bonus: 10 });
  // Being sent a link to install an app is the classic route for banking trojans.
  if (install && link) out.push({ key: "install_from_link", bonus: 20 });
  if (install && (bait || pay || threat)) out.push({ key: "install_bait", bonus: 15 });
  else if (install && (imp || urgency || cred)) out.push({ key: "install_pressure", bonus: 10 });
  if (has(fired, "family_emergency") && has(fired, "payment_request")) out.push({ key: "family_money", bonus: 15 });
  // "I need Rs 20,000 urgently": a relative-in-trouble message that names an amount is asking for money.
  else if (has(fired, "family_emergency") && amountAsked) out.push({ key: "family_money_amount", bonus: 15 });
  if (has(fired, "sextortion") && pay) out.push({ key: "sextortion_money", bonus: 10 });
  if (cover && (pay || cred || imp || threat || install)) out.push({ key: "cover_story", bonus: 10 });
  if (threat && pay) out.push({ key: "threat_payment", bonus: 5 });
  if (threat && cred) out.push({ key: "threat_verification", bonus: 10 });
  if (has(fired, "job_task") && has(fired, "advance_fee")) out.push({ key: "job_deposit", bonus: 15 });
  if (has(fired, "investment") && (pay || link || has(fired, "isolation"))) out.push({ key: "investment_push", bonus: 10 });

  // Cap the total.
  let total = 0;
  const capped: Array<{ key: string; bonus: number }> = [];
  for (const c of out) {
    if (total + c.bonus > COMBO_CAP) continue;
    total += c.bonus;
    capped.push(c);
  }
  return capped;
}

// ---------------------------------------------------------------- the engine

const SIGNAL_KEYS = [
  "link",
  "credential_request",
  "kyc_request",
  "payment_request",
  "advance_fee",
  "urgency",
  "threat",
  "prize_bait",
  "gambling_bait",
  "shortlink_prompt",
  "obfuscated_wording",
  "refund_bait",
  "install_request",
  "impersonation",
  "secrecy",
  "isolation",
  "job_task",
  "investment",
  "loan_bait",
  "family_emergency",
  "sextortion",
  "fake_support",
  "click_link_prompt",
  "checker_instruction",
  "safety_advice",
  "insufficient_content",
];

function alnumCount(text: string): number {
  const m = text.match(/[\p{L}\p{N}]/gu);
  return m ? m.length : 0;
}

export function runRules(text: string): RuleOutput {
  const src = typeof text === "string" ? text : "";
  const sentences = splitSentences(src);
  const ctx: Ctx = { text: src, sentences, clauses: splitClauses(sentences) };
  const entities = extractEntities(src);
  const hasLink = entities.urls.length > 0;

  const fired = new Map<string, Fired>();
  const fire = (id: string, span: Span | undefined) => {
    if (!span || fired.has(id)) return;
    fired.set(id, { id, span, points: D.RULE_META[id].points });
  };

  // 1. Credential request (direction aware).
  const cred = scanClauses(ctx, RE.credential, {
    negation: true,
    skip: (clause, hit) => D.OTP_DELIVERED.test(clause.text) && D.ENTRY_VERB.test(hit.text),
  });
  fire("credential_request", cred.hit);

  // 2. KYC / verification request.
  const kyc = scanClauses(ctx, RE.kyc, { negation: true });
  fire("kyc_request", kyc.hit);

  // 3. Payment request: needs a requested action, never just "UPI" or an amount.
  fire("payment_request", scanClauses(ctx, RE.payment, { negation: true }).hit);

  // 4. Advance fee.
  fire(
    "advance_fee",
    scanClauses(ctx, RE.advance, {
      negation: true,
      skip: (clause) => !D.FEE_REQUESTED.test(clause.text) || D.FEE_NEGATION.test(clause.text),
    }).hit,
  );

  // 5. Urgency (an "expires in 10 minutes" next to an OTP is normal wording).
  {
    const spans: Span[] = [];
    for (const s of sentences) {
      spans.push(...findAll(RE.urgency, s.text, s.start));
      if (!D.OTP_WORDS.test(s.text)) spans.push(...findAll(RE.urgencyExpires, s.text, s.start));
    }
    fire("urgency", firstOf(spans));
  }

  // 6. Threat.
  const threatSpan = scanText(ctx, RE.threat);
  fire("threat", threatSpan);

  // 7. Prize and refund bait.
  fire("prize_bait", scanText(ctx, RE.prize));
  fire("gambling_bait", scanText(ctx, RE.gambling));
  fire("shortlink_prompt", scanText(ctx, RE.shortlink));
  fire("obfuscated_wording", scanText(ctx, RE.obfuscation));
  fire("refund_bait", scanText(ctx, RE.refund));

  // 8. Install / remote access.
  const installStrong = scanClauses(ctx, RE.installStrong, { negation: true });
  fire("install_request", installStrong.hit);
  if (!installStrong.hit) fire("install_app_link", scanClauses(ctx, RE.installWeak, { negation: true }).hit);

  // 9. Impersonation (also tells us what kind of organization is claimed).
  const orgKinds = new Set<D.OrgKind>();
  {
    const spans: Span[] = [];
    for (const { kind, re } of IMPERSONATION_RE) {
      const hits = findAll(re, src);
      if (hits.length > 0) orgKinds.add(kind);
      spans.push(...hits);
    }
    fire("impersonation", firstOf(spans));
  }

  // 10. Secrecy and isolation. Skip secrecy phrases that are really OTP safety advice.
  fire(
    "secrecy",
    scanClauses(ctx, RE.secrecy, { skip: (clause) => findAll(RE.credObject, clause.text).length > 0 }).hit,
  );
  fire("isolation", scanText(ctx, RE.isolation));

  // 11. Job, investment, loan.
  fire("job_task", scanText(ctx, RE.job));
  fire("investment", scanText(ctx, RE.investment));
  fire("loan_bait", scanText(ctx, RE.loan));

  // 12. Family emergency: a relative word plus a new number / emergency, or a new number plus a payment ask.
  {
    const relative = scanText(ctx, RE.relative);
    const newNumber = scanText(ctx, RE.newNumber);
    const emergency = scanText(ctx, RE.emergency);
    if ((relative && (newNumber || emergency)) || (newNumber && fired.has("payment_request"))) {
      fire("family_emergency", newNumber ?? emergency);
    }
  }

  // 13. Sextortion.
  fire("sextortion", scanText(ctx, RE.sextortion));

  // 14. Fake support number: a call-to-action, a support word and a mobile number in one sentence.
  for (const s of sentences) {
    const cta = firstOf(findAll(RE.supportCta, s.text, s.start));
    const word = firstOf(findAll(RE.supportWord, s.text, s.start));
    const phone = firstOf(findAll(RE.mobile, s.text, s.start));
    if (cta && word && phone && !isNegated(s.text)) {
      const start = Math.min(cta.start, word.start, phone.start);
      const end = Math.max(cta.end, word.end, phone.end);
      fire("fake_support_number", { start, end, text: src.slice(start, end) });
      break;
    }
  }

  // 15. Instructions aimed at the checker (low weight; the text is analyzed like any other).
  fire("checker_instruction", scanText(ctx, RE.checker));

  // 16. Call to action on a link.
  fire("click_link_prompt", scanClauses(ctx, RE.linkPrompt, { negation: true }).hit);

  // ------------------------------------------------------------------ points

  const linkish = hasLink || fired.has("click_link_prompt");
  const f = fired.get("threat");
  if (f) f.points = linkish || has(fired, "kyc_request", "credential_request", "payment_request", "advance_fee") ? 25 : 15;

  for (const group of GROUPS) {
    const members = group.filter((id) => fired.has(id)).sort((a, b) => fired.get(b)!.points - fired.get(a)!.points);
    members.slice(1).forEach((id) => {
      const m = fired.get(id)!;
      m.points = Math.min(m.points, SECONDARY_CAP);
    });
  }

  const amountAsked = /(?:rs\.?|₹|inr)\s*[0-9]|[0-9][0-9,]*\s*(?:rs\b|rupees|inr|₹|रुपये|रुपए)/iu.test(src);
  const comboList = combos(fired, hasLink, amountAsked);
  const comboTotal = comboList.reduce((n, c) => n + c.bonus, 0);
  const indicatorTotal = Array.from(fired.values()).reduce((n, x) => n + x.points, 0);
  const score = Math.max(0, Math.min(100, indicatorTotal + comboTotal));

  // ----------------------------------------------------------------- signals

  const signals: Record<string, boolean> = {};
  for (const k of SIGNAL_KEYS) signals[k] = false;
  signals.link = hasLink;
  for (const id of fired.keys()) signals[D.RULE_META[id].signal] = true;
  signals.safety_advice =
    cred.adviceSeen ||
    kyc.adviceSeen ||
    ctx.clauses.some((c) => isNegated(c.text) && findAll(RE.credObject, c.text).length > 0);
  signals.insufficient_content = src.trim().length < LIMITS.messageMinChars || alnumCount(src) < 4;
  for (const c of comboList) signals[`combo_${c.key}`] = true;

  // -------------------------------------------------------------- indicators

  const indicators: Indicator[] = Array.from(fired.values())
    .sort((a, b) => b.points - a.points || (a.span!.start - b.span!.start))
    .map((x) => {
      const meta = D.RULE_META[x.id];
      return {
        id: x.id,
        type: meta.type,
        source: "rule" as const,
        evidence: x.span!.text,
        explanation: meta.explanation,
        points: x.points,
      };
    });

  // -------------------------------------------------------------- categories

  const cats = new Set<ScamCategory>();
  const sig = signals;
  const threatText = threatSpan?.text ?? "";
  if (sig.sextortion) cats.add("sextortion");
  if (sig.family_emergency) cats.add("family_emergency");
  if (sig.install_request) cats.add("remote_access_apk");
  if (orgKinds.has("gov") || (sig.threat && D.GOVISH.test(threatText))) cats.add("government_impersonation");
  if (sig.kyc_request || orgKinds.has("bank") || (sig.threat && D.BANKISH.test(threatText) && !D.UTILITYISH.test(threatText))) {
    cats.add("banking_kyc");
  }
  if ((sig.credential_request || sig.payment_request || sig.refund_bait) && D.UPI_CONTEXT.test(src)) cats.add("upi_payment");
  const parcelContext = D.PARCEL_CONTEXT.test(src);
  if (orgKinds.has("delivery") || (parcelContext && (sig.payment_request || sig.advance_fee || sig.threat || sig.click_link_prompt || sig.urgency))) {
    cats.add("delivery_customs");
  }
  if (orgKinds.has("utility") || (sig.threat && D.UTILITYISH.test(threatText))) cats.add("utility_disconnection");
  if (sig.job_task) cats.add("job_task");
  if (sig.investment) cats.add("investment");
  if (sig.loan_bait) cats.add("loan_credit");
  if (sig.fake_support || orgKinds.has("support")) cats.add("fake_support");
  if (sig.prize_bait) cats.add("prize_lottery");
  if (sig.gambling_bait) cats.add("gambling_spam");
  if (sig.credential_request && !cats.has("banking_kyc") && !cats.has("upi_payment") && !cats.has("government_impersonation")) {
    cats.add("credential_theft");
  }
  if (cats.size === 0 && score >= 20) cats.add("other");

  return { indicators, categories: Array.from(cats), score, signals };
}
