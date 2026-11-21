import { describe, expect, it } from "vitest";
import { maskPhone, redactSensitive } from "@/lib/privacy/redact";
import { fingerprint, normalizeForFingerprint, sha256 } from "@/lib/privacy/fingerprint";

describe("redactSensitive", () => {
  it("hides OTPs next to their label in both orders", () => {
    expect(redactSensitive("Your OTP is 482913. Do not share.")).toEqual({
      text: "Your OTP is [hidden]. Do not share.",
      redactions: 1,
    });
    expect(redactSensitive("482913 is your OTP for login")).toEqual({
      text: "[hidden] is your OTP for login",
      redactions: 1,
    });
    expect(redactSensitive("OTP: 123456").text).toBe("OTP: [hidden]");
    expect(redactSensitive("Use verification code 4829 now").text).toBe("Use verification code [hidden] now");
  });

  it("hides PIN, CVV and password codes", () => {
    expect(redactSensitive("my UPI PIN 4321").text).toBe("my UPI PIN [hidden]");
    expect(redactSensitive("CVV 123 expiry 12/28").text).toBe("CVV [hidden] expiry 12/28");
    expect(redactSensitive("password 998877").text).toBe("password [hidden]");
  });

  it("handles Hindi and Hinglish labels", () => {
    expect(redactSensitive("आपका ओटीपी 482913 है").text).toBe("आपका ओटीपी [hidden] है");
    expect(redactSensitive("482913 आपका ओटीपी है").text).toBe("[hidden] आपका ओटीपी है");
    expect(redactSensitive("otp 556677 batao").text).toBe("otp [hidden] batao");
  });

  it("hides card numbers, Aadhaar-like numbers and long digit runs", () => {
    expect(redactSensitive("card 4111 1111 1111 1111 exp").text).toBe("card [hidden] exp");
    expect(redactSensitive("card 4111-1111-1111-1111").text).toBe("card [hidden]");
    expect(redactSensitive("card 4111111111111111").text).toBe("card [hidden]");
    expect(redactSensitive("aadhaar 1234 5678 9012 ok").text).toBe("aadhaar [hidden] ok");
    expect(redactSensitive("account 12345678901").text).toBe("account [hidden]");
    expect(redactSensitive("ref 98765432101234").text).toBe("ref [hidden]");
  });

  it("keeps ordinary mobile numbers, amounts and URLs", () => {
    const keep = [
      "Call 9876543210 now",
      "Call +91 98765 43210 now",
      "Call +919876543210 now",
      "Pay Rs 5000 or ₹1,25,000 today",
      "Visit https://sbi-verify-account.example/login?x=12345 now",
      "Order #1234 of 12/11/2026",
    ];
    for (const t of keep) expect(redactSensitive(t), t).toEqual({ text: t, redactions: 0 });
  });

  it("does not take an amount as the code when the label is far from the code", () => {
    expect(redactSensitive("OTP for Rs 5000 txn is 112233").text).toBe("OTP for Rs 5000 txn is [hidden]");
  });

  it("counts every redaction and never uses a loud marker", () => {
    const r = redactSensitive("OTP 111222, card 4111 1111 1111 1111 and CVV 999.");
    expect(r.redactions).toBe(3);
    expect(r.text).not.toMatch(/REDACTED/);
    expect(r.text).toContain("[hidden]");
  });

  it("is a no-op on empty text", () => {
    expect(redactSensitive("")).toEqual({ text: "", redactions: 0 });
  });
});

describe("maskPhone", () => {
  it("keeps only the last 3 digits", () => {
    expect(maskPhone("+91 98765 43210")).toBe("+91 ••••• ••210");
    expect(maskPhone("9876543210")).toBe("+91 ••••• ••210");
    expect(maskPhone("098765-43210")).toBe("+91 ••••• ••210");
    const intl = maskPhone("+1 202 555 0123");
    expect(intl.endsWith("123")).toBe(true);
    expect(intl).not.toMatch(/202|555|0123/);
    expect(maskPhone("9876543210")).not.toContain("9876");
  });
});

describe("fingerprint", () => {
  it("is a 64-char SHA-256 hex and ignores links, digits, punctuation and case", async () => {
    const a = await fingerprint("Pay Rs 500 now!! Visit https://evil.example/a1 today.");
    const b = await fingerprint("pay rs 9999 NOW visit http://other.example/zz today");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
    expect(await fingerprint("Something else entirely")).not.toBe(a);
  });

  it("normalizes as described", () => {
    expect(normalizeForFingerprint("Don't  PAY, Rs. 500 at www.x.com/y!")).toBe("dont pay rs at");
  });

  it("fallback SHA-256 matches Web Crypto", async () => {
    const data = new TextEncoder().encode("hello astra अस्त्र");
    const expected = Buffer.from(await crypto.subtle.digest("SHA-256", data)).toString("hex");
    expect(Buffer.from(sha256(data)).toString("hex")).toBe(expected);
  });
});
