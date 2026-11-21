# Rule-engine evaluation

This report measures ASTRA's deterministic rule engine on a small synthetic dataset, following the spec's requirement (section 16) to test both catching scams and not accusing genuine messages. Read the limitations, and the note on rule changes below, before quoting any number.

## What was measured

- Rules (`lib/analysis/rules.ts`), local URL flags (`lib/urls/local.ts`), and `aggregate()` (`lib/analysis/scoring.ts`).
- Not measured: the AI layer, link-reputation providers, OCR, phone and file checks. The AI check is set to `not_applicable` and no reputation provider results are supplied. No network is used.
- Predicted class comes from `riskLevel` only: `high` = scam, `suspicious` = suspicious, `no_clear_warning` or `unable` = not flagged. (Without the AI check, `aggregate()` returns `unable` instead of `no_clear_warning`.)

## Dataset

86 messages in `tests/fixtures/eval-messages.ts`, all written by the project team. Names, numbers, UPI IDs, and domains are fictional (`.example`, `example.com`, `98765 43210`-style placeholders, one TEST-NET IP address). Nothing was copied from real people or real malicious sites.

| Label | English | Hindi (Devanagari) | Hinglish | Total |
|---|---|---|---|---|
| scam | 35 | 8 | 6 | 49 |
| suspicious (ambiguous) | 4 | 0 | 0 | 4 |
| genuine | 26 | 2 | 5 | 33 |

The scam set covers bank/KYC, UPI, government and police, delivery, electricity, job, investment, loan, fake support, remote access, family emergency, sextortion, and prize messages, 6 scams with no link, and 4 prompt-injection attempts. The genuine set includes OTP messages, bank alerts, delivery updates, payment reminders, marketing, appointments, security advisories that warn about scams, and chat messages containing words such as "KYC", "urgent", and "OTP" harmlessly. About a third of the genuine messages were written to be hard for a keyword filter. Each message has a group and a note explaining its label.

This is not a statistically valid sample. The same project wrote both the rules and the messages, so the messages reflect what the authors expected scams to look like. Several slices are tiny (Hindi has 2 genuine messages).

## How to rerun

```
npx vitest run tests/evaluation.test.ts
```

The test prints the confusion matrix, the metrics, and every misclassified message. It also asserts some invariants (all prompt-injection messages are flagged, safety advice and OTP messages are never `high`, no genuine message is `high`, every evidence string is an exact substring of the text) and that the miss lists in the fixture file match what is observed.

## A note on rule changes (read this first)

The first run of this evaluation found two false positives on genuine messages. The rules were then changed to fix them, **and the same 86 messages were used to check the fix**. That means the figures below are no longer an independent test: the two fixed errors are partly the result of tuning to this set. The changes were:

- A secret word (OTP, password, PIN) followed by an ordinary noun such as "spreadsheet", "report" or "policy" is no longer read as a request for the secret ("send the OTP spreadsheet").
- A plain "pay online" request with a link no longer gets the link-plus-pressure bonus on its own. Fees, urgency, threats, credential requests, app installs, bait, and investment, job or loan lures still do. This is a precision-for-recall trade-off: a bare "pay at this link" scam now scores lower.
- Hinglish "Rs 3500 fee jama karo" style fee wording is matched as a payment request.
- A relative-in-trouble message that names an amount now adds a money-request bonus.

Results before these changes: genuine false positives 6.1% (2/33), scams reaching `high` 46.9% (23/49), precision of `high` 100% (23/23), flagged at all 94.3% (50/53). A fresh, independent set is needed to know whether the fixes generalize.

## Results

Confusion matrix (rows = true label):

| True \ predicted | high | suspicious | not flagged |
|---|---|---|---|
| scam (49) | 24 | 25 | 0 |
| suspicious (4) | 0 | 1 | 3 |
| genuine (33) | 0 | 0 | 33 |

| Slice | n | Scam or suspicious flagged at all | Scams labeled high | Precision of `high` | Genuine flagged (FPR) |
|---|---|---|---|---|---|
| Overall | 86 | 94.3% (50/53) | 49.0% (24/49) | 100% (24/24) | 0.0% (0/33) |
| English | 65 | 92.3% (36/39) | 45.7% (16/35) | 100% (16/16) | 0.0% (0/26) |
| Hindi | 10 | 100% (8/8) | 62.5% (5/8) | 100% (5/5) | 0% (0/2) |
| Hinglish | 11 | 100% (6/6) | 50.0% (3/6) | 100% (3/3) | 0% (0/5) |

Reading these numbers: the engine is conservative. It flagged every scam, but only about half reach `high`; the rest show as `suspicious`. No genuine message was flagged at all in this set after the fixes above. With 33 genuine messages, one error moves the false-positive rate by about 3 points, and the 100% precision means only that no false `high` occurred in this set.

## Known misses

Flag-level errors (listed with reasons in `KNOWN_MISSES`). There are no false positives left on the genuine messages in this set; the two that existed (`gen-words-3`, `gen-reminder-3`) were fixed as described above:

| Id | Group | What happens |
|---|---|---|
| `amb-1` | ambiguous | Cold outreach, no rule applies. Arguably the right outcome; labeled suspicious. |
| `amb-3` | ambiguous | "Update your details" with a link; no rule matches without KYC or pressure words. |
| `amb-4` | ambiguous | Unsolicited job opener; only a weak "move to WhatsApp" signal fires. |

25 scams are shown as `suspicious` instead of `high` (listed in `KNOWN_UNDER_CALLS`). Typical causes: only one strong signal fires (an OTP request alone scores 35, and `high` needs 55); the engine misses some wording in Hindi and Hinglish (for example, fee requests and family-emergency money asks); and several scams stop 5 points short. The user still sees a warning for these.


## Real-world sample (anonymized messages from the author's own phone)

The synthetic set above was written by the same people who wrote the rules. To test against messages nobody wrote for that purpose, 112 real SMS messages were taken from the author's own inbox (an export of about 280, chosen to cover each kind seen) and anonymized. They are in `tests/fixtures/real-world-messages.ts`, and the test is `tests/real-world.test.ts`.

**What is in it:** 38 betting and casino promotions ("spam"), 18 scams (mostly fake "cash back credited, withdraw today" and fake "your order is out for delivery, track live" messages with a shortened link, plus an investment-program callback), 6 "suspicious" messages, 43 genuine messages (one-time codes from large and small senders, several with scary-sounding or "share this code" wording, plus advisories in Assamese and Arabic), and 7 "unclear" messages that are not scored.

**How it was anonymized:** account, phone and customer numbers, names and email addresses were replaced with placeholders; private websites became `.example` addresses (public link-shortener domains and a few big-brand domains were kept, with a made-up path, because detection depends on them); ordinary company names became "Example ...". Names of well-known betting brands were kept because spammers use them. The labels are the author's own judgment and were not checked with the senders. About 280 messages were read to pick the sample; many near-duplicates (the same bank welcome message appears over 30 times, for example) were left out.

**Results, first look (14 of these messages, rules as they were):** only 1 of 6 spam or scam messages was flagged (the cashback one). No genuine message was flagged. The engine had no idea about betting promotions at all, which turned out to be the biggest share of real spam.

**Results on all 112, before new rules for this sample:** spam, scam and suspicious messages flagged 23 of 62; genuine messages wrongly flagged 1 of 43.

**New rules added after seeing the sample:** betting and casino wording (bonus, free spins and free bets including the "FS" and "FB" shorthand, welcome bonus, deposit-for-bonus, known betting brand names, Hindi and Hinglish wording), disguised spelling (digits or symbols inside words), "click / view / track" followed by a shortened link, fake "credited ... withdraw" wording, "earn thousands daily" and unsolicited investment-program wording, and a few loss-of-access and password-expiry threats.

**Results on all 112, after those rules:**

| Slice | Flagged (suspicious or high) |
|---|---|
| Scams | 16 of 18 |
| Spam (betting and casino) | 34 of 38 |
| Suspicious | 3 of 6 |
| **All spam, scam and suspicious** | **53 of 62 (7 reach `high`)** |
| Genuine wrongly flagged | 1 of 43 (2.3%) |

**These numbers are not an independent test.** The rules were written while looking at these same messages, so the "after" figures are tuned to this sample and will be lower on messages from another person's inbox. The sample is also one person's phone, small, and heavily weighted to betting spam and to one-time codes.

**What it still misses (9):** a fake-statement message whose shortened link has no "click" next to it (`scam-credit-8`, `scam-tradelure-1`); loss-of-access and password-expiry notices that score just under the "suspicious" line (`sus-uber-docs-1`, `sus-corp-pass-1`); a huge UPI AutoPay debit alert (`sus-autopay-1`); betting promotions without any of the bonus, free-spin or casino wording the rules know (`bet-9`, `bet-33`) or from a brand the rules do not know (`bet-36`); and a lottery-draw promotion (`bet-19`).

**The one false positive:** `gen-otp-14`, a real shop's code message that says "please share this OTP to proceed" (to its own staff). It uses exactly the wording of a classic scam request, so rules alone cannot tell them apart.

Only 7 of the 62 reach `high`; most real spam gets a "suspicious" warning. That is intended for promotions, which are annoying and risky but not always criminal. A reputation lookup (VirusTotal, APIVoid) and the AI layer, which are not part of this measurement, are expected to catch more of what the rules miss.

## Limitations

- Rules only. The AI and link-reputation layers, which the product uses together with the rules, are not part of this measurement.
- Thresholds in the test (`THRESHOLDS`) are regression guards set slightly below the measured values. They are not accuracy claims. (The rules themselves were tuned against this set once, as described above.)
- Small and synthetic, written by the rule authors; results will not transfer to real traffic. Hindi and Hinglish slices are especially small.
- Hindi and Hinglish messages were written by the engine's authors and have not been reviewed by a fluent speaker.
- The "suspicious" label has only 4 examples and is subjective.
- A larger, human-reviewed set drawn from permitted public sources is needed before reporting any figure outside the project.
