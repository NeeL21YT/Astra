import { describe, expect, it } from "vitest";
import { describePhone, phoneGuidance } from "@/lib/phone/describe";

describe("describePhone", () => {
  const kind = (s: string) => describePhone(s).kind;

  it("classifies Indian mobile numbers in many formats", () => {
    for (const s of ["9876543210", "+91 98765 43210", "+91-9876543210", "919876543210", "09876543210", "(+91) 98765-43210", "0 98765 43210"]) {
      expect(kind(s), s).toBe("indian_mobile");
    }
  });

  it("classifies landlines with STD codes", () => {
    expect(kind("011-2345 6789")).toBe("indian_landline");
    expect(kind("+91 22 2345 6789")).toBe("indian_landline");
    expect(kind("022 23456789")).toBe("indian_landline");
    expect(kind("1800 123 4567")).toBe("indian_landline");
  });

  it("classifies international numbers", () => {
    const d = describePhone("+1 202 555 0123");
    expect(d.kind).toBe("international");
    expect(d.description.en).toMatch(/extra caution/i);
    expect(kind("+44 20 7946 0958")).toBe("international");
    expect(kind("0044 20 7946 0958")).toBe("international");
  });

  it("classifies short codes and sender IDs", () => {
    expect(kind("56161")).toBe("short_code");
    expect(kind("1930")).toBe("short_code");
    expect(kind("AX-HDFCBK")).toBe("short_code");
    expect(kind("VM-SBIINB")).toBe("short_code");
  });

  it("rejects invalid input", () => {
    for (const s of ["", "   ", "12", "12345678", "abc def ghi", "+91 12345", "98765 4321x0", "+9198765432100000000"]) {
      expect(kind(s), JSON.stringify(s)).toBe("invalid");
    }
  });

  it("masks to the last 3 digits only", () => {
    const d = describePhone("+91 98765 43210");
    expect(d.masked).toBe("+91 ••••• ••210");
    expect(d.masked).not.toContain("9876");
    expect(describePhone("+1 202 555 0123").masked).not.toMatch(/202|555/);
  });

  it("describes format only, in both languages, with no verdict", () => {
    for (const s of ["9876543210", "+1 202 555 0123", "011-23456789", "56161", "nonsense!"]) {
      const d = describePhone(s).description;
      expect(d.en.length).toBeGreaterThan(10);
      expect(/[ऀ-ॿ]/.test(d.hi)).toBe(true);
      expect(d.en).not.toMatch(/\b(?:safe|scammer|fraudster|trusted|genuine|legitimate)\b/i);
    }
  });
});

describe("phoneGuidance", () => {
  it("gives bilingual guidance for each channel with the key advice", () => {
    for (const ch of ["call", "sms", "whatsapp", "other", undefined] as const) {
      const g = phoneGuidance(ch);
      expect(g.length).toBeGreaterThanOrEqual(4);
      const en = g.map((x) => x.en).join(" ");
      expect(en).toMatch(/OTP/);
      expect(en).toMatch(/official app or website/);
      expect(en).toMatch(/Chakshu/);
      expect(en).toMatch(/1930/);
      expect(en).toMatch(/screen/);
      for (const line of g) expect(/[ऀ-ॿ]/.test(line.hi)).toBe(true);
    }
  });

  it("call guidance says to end the call", () => {
    expect(phoneGuidance("call")[0].en).toMatch(/end the call/i);
  });
});

describe("numbering-plan facts (offline, libphonenumber-js)", () => {
  it("reads country and line type for an Indian mobile", () => {
    const d = describePhone("+91 98765 43210");
    expect(d.kind).toBe("indian_mobile");
    expect(d.country).toBe("IN");
    expect(d.countryName).toEqual({ en: "India", hi: "भारत" });
    expect(d.lineType).toBe("mobile");
    expect(d.numberPlanMatch).toBe(true);
  });
  it("keeps the description and the line type in agreement for Indian numbers", () => {
    // libphonenumber treats 61xxxxxxxx as a landline range, so the kind follows it.
    const d = describePhone("+91 6123456789");
    expect(d.lineType).toBe("landline");
    expect(d.kind).toBe("indian_landline");
  });
  it("shows the country code in the masked number and hides the rest except the last three digits", () => {
    expect(describePhone("+1 415 555 2671").masked).toBe("+1 •••••••671");
    expect(describePhone("+44 20 7183 8750").masked).toBe("+44 •••••••750");
    expect(describePhone("+91 98765 43210").masked).toBe("+91 ••••• ••210");
    // Typed without a country code: the Indian code is still shown.
    expect(describePhone("9876543210").masked).toBe("+91 ••••• ••210");
    expect(describePhone("0124 4567890").masked).toBe("+91 ••••• ••890");
    for (const n of ["+1 415 555 2671", "+44 20 7183 8750", "9876543210"]) {
      expect(describePhone(n).masked).not.toMatch(/415|555|7183|9876/);
    }
  });
  it("reads a landline and a toll-free number", () => {
    expect(describePhone("0124 4567890").lineType).toBe("landline");
    expect(describePhone("1800 123 4567").lineType).toBe("toll_free");
  });
  it("names the country of an international number", () => {
    const d = describePhone("+1 415 555 2671");
    expect(d.kind).toBe("international");
    expect(d.country).toBe("US");
    expect(d.countryName?.en).toBe("United States");
    expect(d.countryName?.hi.length).toBeGreaterThan(0);
  });
  it("warns when the digits match no known range, in both languages", () => {
    const d = describePhone("+91 2012345678");
    expect(d.numberPlanMatch).toBe(false);
    expect(d.description.en).toMatch(/do not match any known number range/);
    expect(d.description.hi).toMatch(/रेंज/);
  });
  it("adds nothing for sender names, short codes and junk", () => {
    for (const x of ["AX-HDFCBK", "56161", "call me", ""]) {
      const d = describePhone(x);
      expect(d.country).toBeUndefined();
      expect(d.lineType).toBeUndefined();
    }
  });
  it("never reads the number as a verdict: no risk words in the description", () => {
    for (const n of ["+91 98765 43210", "+1 415 555 2671", "1800 123 4567"]) {
      expect(describePhone(n).description.en).not.toMatch(/scam|safe|genuine|fraud/i);
    }
  });
  it("adds a 'do not call back' line for international or premium numbers only", () => {
    const callback = (n: string) => phoneGuidance("call", describePhone(n)).some((g) => /call back a missed call/.test(g.en));
    expect(callback("+1 415 555 2671")).toBe(true);
    expect(callback("+91 98765 43210")).toBe(false);
    expect(phoneGuidance("call").some((g) => /call back a missed call/.test(g.en))).toBe(false);
    expect(phoneGuidance("call", describePhone("+1 415 555 2671")).every((g) => g.hi.length > 0)).toBe(true);
  });
});
