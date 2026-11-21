/**
 * Detects browser extensions that force a dark theme onto ASTRA (Dark Reader, Night Eye and
 * similar). ASTRA's result colors (red, amber, green) are chosen and contrast-checked for a
 * light page, so a recolored page can make a warning look calmer or harder to read.
 *
 * Prevention lives in app/layout.tsx (color-scheme "only light", opt-out meta tags). This file is
 * the safety net for extensions that ignore those signals.
 */

const EXTENSION_ATTR_PREFIXES = ["data-darkreader", "data-nighteye", "nighteye"];
const EXTENSION_SELECTORS = [
  "style.darkreader",
  'style[class*="darkreader"]',
  'meta[name="darkreader"]',
  "nighteye",
  "[data-nighteye]",
];

/** Parses `rgb(r, g, b)` / `rgba(r, g, b, a)` (also the space-separated form). Null if not parseable or transparent. */
export function parseRgb(value: string): [number, number, number] | null {
  const m = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)(?:[\s,/]+(\d*\.?\d+%?))?\s*\)$/.exec(value.trim());
  if (!m) return null;
  const alpha = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  if (alpha < 0.5) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** ASTRA's page background is white, so a clearly dark computed background means something recolored it. */
export function looksRecoloredDark(backgroundColor: string): boolean {
  const rgb = parseRgb(backgroundColor);
  return rgb !== null && luminance(rgb) < 0.2;
}

export function detectForcedDark(doc: Document): boolean {
  const root = doc.documentElement;
  for (const name of root.getAttributeNames()) {
    if (EXTENSION_ATTR_PREFIXES.some((p) => name.startsWith(p))) return true;
  }
  if (EXTENSION_SELECTORS.some((s) => doc.querySelector(s))) return true;
  const view = doc.defaultView;
  if (view && doc.body) {
    return looksRecoloredDark(view.getComputedStyle(doc.body).backgroundColor);
  }
  return false;
}

/** useSyncExternalStore-compatible subscription: re-check when extensions touch <html>/<head>, and shortly after load. */
export function subscribeForcedDark(onChange: () => void): () => void {
  let frame = 0;
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(onChange);
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { attributes: true, childList: true });
  observer.observe(document.head, { childList: true });
  // Extensions often apply their theme a moment after load.
  const timers = [300, 1500].map((ms) => window.setTimeout(schedule, ms));
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
  };
}
