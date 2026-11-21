import type { Lang } from "@/lib/types";

export type SpeechSupport = "unsupported" | "loading" | "none" | "ready";

const LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN" };

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window ? window.speechSynthesis : null;
}

function normalizeLang(tag: string): string {
  return tag.replace("_", "-").toLowerCase();
}

/** Best matching voice: exact locale first, then any voice in the same language. */
export function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const voices = s.getVoices();
  const want = LOCALE[lang].toLowerCase();
  const prefix = lang;
  return (
    voices.find((v) => normalizeLang(v.lang) === want) ??
    voices.find((v) => normalizeLang(v.lang).startsWith(prefix)) ??
    null
  );
}

/** Stable, primitive snapshot suitable for useSyncExternalStore. */
export function getSpeechSupport(lang: Lang): SpeechSupport {
  const s = synth();
  if (!s) return "unsupported";
  if (s.getVoices().length === 0) return "loading";
  return pickVoice(lang) ? "ready" : "none";
}

export function subscribeToVoices(onChange: () => void): () => void {
  const s = synth();
  if (!s) return () => {};
  s.addEventListener("voiceschanged", onChange);
  return () => s.removeEventListener("voiceschanged", onChange);
}

/** Split text into short chunks; some engines stop reading long utterances. */
function chunk(text: string): string[] {
  const parts = text.match(/[^.!?।\n]+[.!?।]?/g) ?? [text];
  const out: string[] = [];
  let buf = "";
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    if ((buf + " " + part).length > 180 && buf) {
      out.push(buf);
      buf = part;
    } else {
      buf = buf ? `${buf} ${part}` : part;
    }
  }
  if (buf) out.push(buf);
  return out;
}

let token = 0;
let activeEnd: (() => void) | null = null;

/** Stop any speech. The "ended" callback of the speech being stopped is called once. */
export function cancelSpeech() {
  token += 1;
  const finish = activeEnd;
  activeEnd = null;
  synth()?.cancel();
  finish?.();
}

/** Read text aloud. Calls onEnd exactly once when finished, failed, or cancelled by a newer call. */
export function speak(text: string, lang: Lang, onEnd: () => void): boolean {
  const s = synth();
  if (!s) return false;
  cancelSpeech();
  const mine = token;
  const voice = pickVoice(lang);
  const pieces = chunk(text);
  if (pieces.length === 0) return false;

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    if (activeEnd === finish) activeEnd = null;
    onEnd();
  };
  activeEnd = finish;

  let index = 0;
  const next = () => {
    if (mine !== token) return;
    if (index >= pieces.length) {
      finish();
      return;
    }
    const u = new SpeechSynthesisUtterance(pieces[index]);
    index += 1;
    u.lang = voice?.lang ?? LOCALE[lang];
    if (voice) u.voice = voice;
    u.onend = next;
    u.onerror = () => {
      if (mine === token) finish();
    };
    s.speak(u);
  };
  next();
  return true;
}
