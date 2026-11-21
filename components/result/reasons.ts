import type { Indicator } from "@/lib/types";

/**
 * Splits a warning's indicators into the few strongest reasons (shown near the top, with the exact
 * line from the message when there is one) and the rest (shown further down).
 * Strongest = most points; a quoted line wins a tie because it is easier for a person to check.
 */
export function splitReasons(indicators: Indicator[], max = 3): { top: Indicator[]; rest: Indicator[] } {
  const ranked = indicators
    .map((ind, index) => ({ ind, index }))
    .sort(
      (a, b) =>
        b.ind.points - a.ind.points ||
        Number(Boolean(b.ind.evidence)) - Number(Boolean(a.ind.evidence)) ||
        a.index - b.index,
    );
  const topSet = new Set(ranked.slice(0, max).map((r) => r.index));
  return {
    top: ranked.slice(0, max).map((r) => r.ind),
    rest: indicators.filter((_, i) => !topSet.has(i)),
  };
}
