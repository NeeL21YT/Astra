import { describe, expect, it } from "vitest";
import { looksRecoloredDark, luminance, parseRgb } from "@/lib/client/forcedDark";

describe("forced-dark detection helpers", () => {
  it("parses rgb and rgba colors, in comma and space form", () => {
    expect(parseRgb("rgb(255, 255, 255)")).toEqual([255, 255, 255]);
    expect(parseRgb("rgba(24, 26, 27, 1)")).toEqual([24, 26, 27]);
    expect(parseRgb("rgb(24 26 27)")).toEqual([24, 26, 27]);
    expect(parseRgb("rgb(24 26 27 / 40%)")).toBeNull();
  });
  it("treats transparent or unparseable colors as unknown, not dark", () => {
    expect(parseRgb("rgba(0, 0, 0, 0)")).toBeNull();
    expect(parseRgb("transparent")).toBeNull();
    expect(looksRecoloredDark("rgba(0, 0, 0, 0)")).toBe(false);
    expect(looksRecoloredDark("oklch(0.2 0 0)")).toBe(false);
  });
  it("orders luminance from black to white", () => {
    expect(luminance([0, 0, 0])).toBe(0);
    expect(luminance([255, 255, 255])).toBeCloseTo(1, 5);
  });
  it("flags a dark page background but not ASTRA's own light colors", () => {
    expect(looksRecoloredDark("rgb(24, 26, 27)")).toBe(true); // Dark Reader's usual background
    expect(looksRecoloredDark("rgb(255, 255, 255)")).toBe(false); // --color-page
    expect(looksRecoloredDark("rgb(243, 246, 250)")).toBe(false); // --color-soft
  });
});
