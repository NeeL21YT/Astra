import { describe, expect, it } from "vitest";
import { extractEntities } from "@/lib/urls/extract";
import { domainParts, localUrlFlags, normalizeUrl } from "@/lib/urls/local";

const flagIds = (raw: string) => localUrlFlags(raw)?.flags.map((f) => f.id) ?? null;

describe("extractEntities", () => {
  it("finds scheme URLs, bare domains, www and shorteners, strips trailing punctuation", () => {
    const e = extractEntities(
      "Visit sbi-verify.example/login, bit.ly/xyz or www.x.com. Also https://pay.example.com/a?b=1). Done.",
    );
    expect(e.urls).toEqual(["sbi-verify.example/login", "bit.ly/xyz", "www.x.com", "https://pay.example.com/a?b=1"]);
  });

  it("extracts the demo URL from sample A", () => {
    const e = extractEntities("Complete KYC immediately:\nhttps://sbi-verify-account.example\nDo not ignore.");
    expect(e.urls).toEqual(["https://sbi-verify-account.example"]);
  });

  it("dedupes and caps at 10", () => {
    const text = Array.from({ length: 15 }, (_, i) => `https://a${i}.example.com/x`).join(" ") + " https://a1.example.com/x";
    const e = extractEntities(text);
    expect(e.urls).toHaveLength(10);
    expect(extractEntities("http://x.example.com http://X.example.com").urls).toHaveLength(1);
  });

  it("finds bare IP URLs but not version numbers or file names", () => {
    expect(extractEntities("go to 192.168.1.1/login now").urls).toEqual(["192.168.1.1/login"]);
    expect(extractEntities("see report.pdf and photo.jpg, e.g. this").urls).toEqual([]);
    expect(extractEntities("Rs.500 paid").urls).toEqual([]);
  });

  it("extracts Indian mobile numbers in common formats", () => {
    const e = extractEntities("Call +91 98765 43210 or 098765-43210 or 9876543211 or 91 9876543212 or (+91) 98765 43213");
    expect(e.phones).toEqual(["+919876543210", "+919876543211", "+919876543212", "+919876543213"]);
  });

  it("does not take digits out of cards, Aadhaar or order ids as phones", () => {
    expect(extractEntities("card 4111 1111 1111 1111").phones).toEqual([]);
    expect(extractEntities("ref 98765432101234").phones).toEqual([]);
    expect(extractEntities("number 5876543210").phones).toEqual([]);
  });

  it("extracts UPI ids but not email addresses", () => {
    const e = extractEntities("Pay to rahul@oksbi or shop.1@ybl or mail me at rahul@gmail.com and a@sbi.co.in");
    expect(e.upiIds).toEqual(["rahul@oksbi", "shop.1@ybl"]);
    expect(e.emails).toEqual(["rahul@gmail.com", "a@sbi.co.in"]);
  });

  it("does not treat an email domain as a URL", () => {
    expect(extractEntities("write to help@example.com please").urls).toEqual([]);
  });
});

describe("normalizeUrl", () => {
  it("adds https and lowercases the host", () => {
    expect(normalizeUrl("Bit.LY/Abc")).toBe("https://bit.ly/Abc");
    expect(normalizeUrl("sbi-verify-account.example")).toBe("https://sbi-verify-account.example/");
    expect(normalizeUrl("HTTP://Example.COM/Path")).toBe("http://example.com/Path");
    expect(normalizeUrl("192.168.1.1/login")).toBe("https://192.168.1.1/login");
    expect(normalizeUrl("example.com:8080/x")).toBe("https://example.com:8080/x");
  });

  it("rejects non-http(s) and dangerous schemes without throwing", () => {
    for (const bad of [
      "javascript:alert(1)",
      "JaVaScRiPt://%0aalert(1)",
      "data:text/html,<script>1</script>",
      "file:///etc/passwd",
      "ftp://example.com",
      "mailto:a@b.com",
      "vbscript:x",
      "blob:https://x.com/1",
      "",
      "   ",
      "not a url",
      "localhost",
      "http://",
    ]) {
      expect(normalizeUrl(bad), bad).toBeNull();
    }
    expect(normalizeUrl("https://" + "a".repeat(2100) + ".com")).toBeNull();
  });
});

describe("domainParts heuristic", () => {
  it("handles multi-part suffixes", () => {
    expect(domainParts("www.sbi.co.in")).toMatchObject({ registrable: "sbi.co.in", suffix: "co.in", sld: "sbi", subLabels: ["www"] });
    expect(domainParts("a.b.example.com.au").registrable).toBe("example.com.au");
    expect(domainParts("incometax.gov.in").registrable).toBe("incometax.gov.in");
    expect(domainParts("sbi.secure-login.example.com")).toMatchObject({ registrable: "example.com", subLabels: ["sbi", "secure-login"] });
  });
});

describe("localUrlFlags", () => {
  it("returns null for unusable input", () => {
    expect(localUrlFlags("javascript:alert(1)")).toBeNull();
    expect(localUrlFlags("hello world")).toBeNull();
  });

  it("flags shorteners but not wa.me", () => {
    expect(flagIds("bit.ly/abc")).toContain("shortener");
    expect(flagIds("https://tinyurl.com/x")).toContain("shortener");
    expect(flagIds("cutt.ly/x")).toContain("shortener");
    expect(flagIds("https://t.co/abc")).toContain("shortener");
    expect(flagIds("wa.me/919876543210")).toEqual([]);
  });

  it("flags punycode", () => {
    expect(flagIds("https://xn--pypal-4ve.com/login")).toContain("punycode");
  });

  it("flags IP hosts", () => {
    expect(flagIds("192.168.1.1/login")).toContain("ip_host");
    expect(flagIds("http://[::1]/x")).toContain("ip_host");
    expect(flagIds("http://3232235777/x")).toContain("ip_host");
  });

  it("flags http-only weakly", () => {
    const f = localUrlFlags("http://example.com/x")!;
    expect(f.flags.map((x) => x.id)).toContain("http_only");
    expect(f.flags.find((x) => x.id === "http_only")!.points).toBeLessThanOrEqual(5);
    expect(flagIds("https://example.com/x")).toEqual([]);
  });

  it("flags brand lookalikes, including the demo domain", () => {
    expect(flagIds("https://sbi-verify-account.example")).toContain("brand_lookalike");
    expect(flagIds("hdfc-kyc-update.com")).toContain("brand_lookalike");
    expect(flagIds("irctc-login.top")).toEqual(expect.arrayContaining(["brand_lookalike", "suspicious_tld"]));
    expect(flagIds("tatapower-bill.xyz")).toContain("brand_lookalike");
    expect(flagIds("paytrn.in")).toContain("brand_lookalike");
    expect(flagIds("sb1-netbanking.com")).toContain("brand_lookalike");
    expect(flagIds("indiapost-redelivery.top")).toContain("brand_lookalike");
    expect(flagIds("pm-phonepe-rewards.cfd")).toEqual(expect.arrayContaining(["brand_lookalike", "suspicious_tld"]));
  });

  it("flags a brand used only as a subdomain", () => {
    const ids = flagIds("sbi.secure-login.example.com");
    expect(ids).toContain("misleading_subdomain");
    expect(ids).not.toContain("brand_lookalike");
    expect(flagIds("login.hdfcbank.com.verify-now.example")).toContain("misleading_subdomain");
  });

  it("does NOT flag genuine brand domains", () => {
    for (const ok of [
      "sbi.co.in",
      "https://www.sbi.co.in/web/personal-banking",
      "onlinesbi.sbi",
      "https://retail.onlinesbi.sbi/login",
      "onlinesbi.com",
      "hdfcbank.com",
      "netbanking.hdfcbank.com",
      "icicibank.com",
      "irctc.co.in",
      "incometax.gov.in",
      "https://www.incometax.gov.in/iec/foportal",
      "uidai.gov.in",
      "indiapost.gov.in",
      "amazon.in",
      "paytm.com",
      "axis.com",
    ]) {
      expect(flagIds(ok), ok).toEqual([]);
    }
  });

  it("does not flag brand words inside unrelated words", () => {
    expect(flagIds("gasbills.example.com")).toEqual([]);
    expect(flagIds("taxis-delhi.com")).toEqual([]);
  });

  it("flags userinfo tricks", () => {
    const f = localUrlFlags("https://sbi.co.in@evil-site.example.com/login")!;
    expect(f.hostname).toBe("evil-site.example.com");
    expect(f.flags.map((x) => x.id)).toContain("userinfo_in_url");
  });

  it("flags suspicious TLDs weakly and keeps flag shape", () => {
    const f = localUrlFlags("https://free-gift.top/claim")!;
    const tld = f.flags.find((x) => x.id === "suspicious_tld")!;
    expect(tld.points).toBeLessThanOrEqual(5);
    expect(tld.explanation.en).toBeTruthy();
    expect(/[ऀ-ॿ]/.test(tld.explanation.hi)).toBe(true);
  });

  it("analyzes reserved demo domains like any other", () => {
    const f = localUrlFlags("https://sbi-verify-account.example/login")!;
    expect(f.hostname).toBe("sbi-verify-account.example");
    expect(f.flags.length).toBeGreaterThan(0);
  });
});
