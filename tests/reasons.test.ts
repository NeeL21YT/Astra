import { describe, expect, it } from "vitest";
import { splitReasons } from "@/components/result/reasons";
import type { Indicator } from "@/lib/types";

const ind = (id: string, points: number, evidence?: string): Indicator => ({
  id,
  type: "other",
  source: "rule",
  points,
  explanation: { en: id, hi: id },
  ...(evidence ? { evidence } : {}),
});

describe("splitReasons", () => {
  it("puts the strongest reasons first and everything else in rest, losing nothing", () => {
    const all = [ind("a", 5, "x"), ind("b", 30, "send OTP"), ind("c", 12), ind("d", 20, "pay now"), ind("e", 1)];
    const { top, rest } = splitReasons(all);
    expect(top.map((i) => i.id)).toEqual(["b", "d", "c"]);
    expect(rest.map((i) => i.id)).toEqual(["a", "e"]); // original order
    expect(top.length + rest.length).toBe(all.length);
  });
  it("prefers an indicator with a quoted line when points tie, then keeps input order", () => {
    const { top } = splitReasons([ind("plain", 10), ind("quoted", 10, "the line"), ind("plain2", 10)], 2);
    expect(top.map((i) => i.id)).toEqual(["quoted", "plain"]);
  });
  it("handles fewer reasons than the limit and an empty list", () => {
    expect(splitReasons([ind("only", 3)]).rest).toEqual([]);
    expect(splitReasons([])).toEqual({ top: [], rest: [] });
  });
  it("does not change the input array", () => {
    const all = [ind("a", 1), ind("b", 9)];
    splitReasons(all);
    expect(all.map((i) => i.id)).toEqual(["a", "b"]);
  });
});
