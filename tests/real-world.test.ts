import { describe, expect, it } from "vitest";
import { runRules } from "@/lib/analysis/rules";
import { extractEntities } from "@/lib/urls/extract";
import { localUrlFlags } from "@/lib/urls/local";
import { aggregate } from "@/lib/analysis/scoring";
import type { CheckStatus, RiskLevel, UrlCheck } from "@/lib/types";
import { REAL_MESSAGES } from "./fixtures/real-world-messages";

/** Rules and local link checks only: no AI, no network (the same method as the evaluation set). */
function levelOf(text: string): { level: RiskLevel; ids: string[] } {
  const rules = runRules(text);
  const urlChecks: UrlCheck[] = extractEntities(text).urls.map((u) => {
    const l = localUrlFlags(u);
    return { url: l?.url ?? u, hostname: l?.hostname ?? "", flags: l?.flags ?? [], reputation: [] };
  });
  const checks: CheckStatus[] = [
    { id: "rules", status: "ran" },
    { id: "ai", status: "not_applicable" },
    ...(urlChecks.length ? [{ id: "url_reputation", status: "not_applicable" } as CheckStatus] : []),
  ];
  const agg = aggregate({ kind: "message", rules, urlChecks, ai: null, checks });
  return { level: agg.riskLevel, ids: rules.indicators.map((i) => i.id) };
}

const flagged = (l: RiskLevel) => l === "suspicious" || l === "high";

/**
 * Real spam and scam messages the rules still do not flag, and the one genuine message they flag.
 * Recorded so the file documents the gaps and any change shows up. Why each one slips through:
 *  - scam-credit-8, scam-tradelure-1: a shortened link with no click/view verb next to it, and no
 *    other wording the rules know ("Check now. bit.ly/...", "Net Ledger Balance : cutt.ly/...").
 *  - sus-uber-docs-1, sus-corp-pass-1: a loss-of-access / password-expiry threat scores 15 with no link
 *    or other signal, which is under the "suspicious" line (20). Genuine IT notices look the same.
 *  - sus-autopay-1: a huge debit alert for a small subscription; no rule looks at amounts.
 *  - bet-9, bet-33: betting promotions without bonus, free-spin or casino wording the rules know.
 *  - bet-19: a lottery draw promotion ("Emirates Draw ... MEGA7 tonight").
 *  - bet-36: a betting promotion from a brand the rules do not know, with no promo wording at all.
 *    Only a reputation lookup or the AI layer could catch it.
 * The false positive, gen-otp-14, is a real shop's code message that says "please share this OTP to
 * proceed" to its own staff. The wording is identical to a classic scam request, so rules cannot
 * tell them apart.
 */
const KNOWN_REAL_MISSES = [
  "bet-19",
  "bet-33",
  "bet-36",
  "bet-9",
  "scam-credit-8",
  "scam-tradelure-1",
  "sus-autopay-1",
  "sus-corp-pass-1",
  "sus-uber-docs-1",
];
const KNOWN_REAL_FALSE_POSITIVES = ["gen-otp-14"];

describe("real-world sample (anonymized messages from the author's own inbox)", () => {
  const rows = REAL_MESSAGES.map((m) => ({ m, ...levelOf(m.text) }));
  const bad = rows.filter((r) => r.m.label === "scam" || r.m.label === "spam" || r.m.label === "suspicious");
  const good = rows.filter((r) => r.m.label === "genuine");

  it("reports the numbers", () => {
    const caught = bad.filter((r) => flagged(r.level)).length;
    const high = bad.filter((r) => r.level === "high").length;
    const falseAlarms = good.filter((r) => flagged(r.level)).length;
    console.log(
      `Real-world sample (${rows.length} messages): spam/scam/suspicious flagged ${caught}/${bad.length} (${high} reach high); genuine wrongly flagged ${falseAlarms}/${good.length}`,
    );
    for (const label of ["scam", "spam", "suspicious"] as const) {
      const set = bad.filter((r) => r.m.label === label);
      console.log(`  ${label}: flagged ${set.filter((r) => flagged(r.level)).length}/${set.length}`);
    }
    expect(bad.length).toBe(62);
    expect(good.length).toBe(43);
    expect(rows.filter((r) => r.m.label === "unclear").length).toBe(7);
  });

  it("flags every spam and scam message except the recorded misses", () => {
    const misses = bad.filter((r) => !flagged(r.level)).map((r) => r.m.id).sort();
    expect(misses).toEqual([...KNOWN_REAL_MISSES].sort());
  });

  it("flags only the recorded genuine message by mistake", () => {
    expect(good.filter((r) => flagged(r.level)).map((r) => r.m.id)).toEqual(KNOWN_REAL_FALSE_POSITIVES);
  });

  it("flags nearly all of the sample (a regression guard, set below the measured value)", () => {
    expect(bad.filter((r) => flagged(r.level)).length / bad.length).toBeGreaterThanOrEqual(0.8);
    expect(good.filter((r) => flagged(r.level)).length / good.length).toBeLessThanOrEqual(0.05);
  });

  it("gives a clear reason for each family it catches", () => {
    const ids = (id: string) => rows.find((r) => r.m.id === id)!.ids;
    for (const id of ["bet-1", "bet-6", "bet-12", "bet-35", "bet-37", "bet-38"]) expect(ids(id)).toContain("gambling_bait");
    for (const id of ["scam-credit-1", "scam-credit-2", "scam-cashback-2"]) expect(ids(id)).toContain("prize_bait");
    for (const id of ["scam-order-1", "scam-order-3", "scam-credit-6"]) expect(ids(id)).toContain("shortlink_prompt");
    expect(ids("sus-social-reset-1")).toContain("obfuscated_wording");
    expect(ids("bet-24")).toContain("obfuscated_wording");
  });
});

describe("betting-promotion and disguised-wording rules", () => {
  const ids = (t: string) => runRules(t).indicators.map((i) => i.id);

  it("detects betting and casino promotions", () => {
    for (const t of [
      "10 FREE spins on Lucky Slots! Win up to 5000X. Deposit Rs100 now.",
      "Welcome to 1win: get an exclusive bonus on your first deposit.",
      "Join the casino today and claim cashback up to Rs 5000",
      "आज ही सट्टा खेलें और बोनस पाएं",
    ]) {
      expect(ids(t)).toContain("gambling_bait");
    }
    expect(runRules("Free bet and exclusive bonus: https://bet.example/a").categories).toContain("gambling_spam");
  });

  it("does not flag ordinary uses of the same words", () => {
    for (const t of [
      "Appointment slots are available on Monday at the clinic.",
      "Your annual bonus has been credited to your salary account.",
      "Rummy night at the club on Friday, bring snacks.",
      "Your OTP for login is 482913. Do not share it with anyone.",
    ]) {
      expect(ids(t)).not.toContain("gambling_bait");
    }
  });

  it("detects disguised spelling in words spam filters look for, and not plain spelling", () => {
    for (const t of ["Tap to re_set your passw0rd", "Verify your acc0unt now", "Your l0gin is locked: https://x.example"]) {
      expect(ids(t)).toContain("obfuscated_wording");
    }
    for (const t of ["Tap to reset your password", "Your account is verified", "Please log in to continue"]) {
      expect(ids(t)).not.toContain("obfuscated_wording");
    }
  });
});

describe("rules added after the larger real-world sample", () => {
  const ids = (t: string) => runRules(t).indicators.map((i) => i.id);

  it("flags 'click / view / track' followed by a shortened link", () => {
    for (const t of [
      "Your order is out for delivery today. Track live status Click bit.ly/AbC1234",
      "Click to view full statement: bit.ly/AbC1234",
      "Details: View details https://tinyurl.com/AbC1234",
    ]) {
      expect(ids(t)).toContain("shortlink_prompt");
    }
  });
  it("does not flag a shortened link that nothing asks you to open, or a click on a normal link", () => {
    expect(ids("Thanks for your order. Reference: bit.ly/AbC1234")).not.toContain("shortlink_prompt");
    expect(ids("Click https://www.example-shop.example/orders/1234 to view your order")).not.toContain("shortlink_prompt");
  });

  it("flags fake 'credited, withdraw today' messages and 'cash back' written as two words", () => {
    expect(ids("Account(123***7890) credited Rs.10214 Withdraw process @9pm today Click now")).toContain("prize_bait");
    expect(ids("Your cash back of Rs.7893 is ready")).toContain("prize_bait");
  });
  it("leaves ordinary credit alerts alone", () => {
    expect(ids("Rs 5,000 credited to your account XX1234 on 12-Nov. Avl bal Rs 20,000. Thank you.")).not.toContain("prize_bait");
  });

  it("recognizes free-spin and free-bet shorthand, but not Facebook", () => {
    expect(ids("Grab 10 FS on the Lucky Wheel! Top up from 500 INR")).toContain("gambling_bait");
    expect(ids("100 FB has been credited to your game, activate them")).toContain("gambling_bait");
    expect(ids("123456 is your Facebook code")).not.toContain("gambling_bait");
    expect(ids("Your Facebook verification code is 529503")).not.toContain("gambling_bait");
  });

  it("flags 'earn thousands daily' lures and an unsolicited investment-program callback", () => {
    expect(ids("He earned Rs 11,777 daily with calm setups")).toContain("investment");
    expect(ids("You've registered for our investment program. Call your account manager on 0123456789")).toContain("investment");
  });
});
