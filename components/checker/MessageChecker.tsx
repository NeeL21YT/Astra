"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/client/language";
import { analyzeMessage } from "@/lib/client/api";
import { redactSensitive } from "@/lib/privacy/redact";
import { extractEntities } from "@/lib/urls/extract";
import { getSample } from "@/lib/samples";
import { LIMITS } from "@/lib/types";
import { ClipboardIcon, LockIcon } from "@/components/ui/icons";
import { CheckerShell, DemoOutageToggle, FieldError } from "./CheckerShell";
import { ImageToText } from "./ImageToText";
import { RedactionNotice } from "./RedactionNotice";
import { ResultSlot } from "./ResultSlot";
import { useAnalysis } from "./useAnalysis";

/** Combine the PWA share-target params (title, text, url) into one message. */
function sharedText(params: URLSearchParams): string {
  const title = params.get("title")?.trim() ?? "";
  const text = params.get("text")?.trim() ?? "";
  const url = params.get("url")?.trim() ?? "";
  let body = text;
  if (url && !body.includes(url)) body = body ? `${body}\n${url}` : url;
  if (!body && title) body = title;
  return body;
}

/**
 * Reads ?sample=<id> (from the home page chips) or ?text= / ?title= / ?url=
 * (from the PWA share target), then remounts the checker with that text and
 * removes the query string so shared text does not linger in the address bar.
 */
export function MessageCheckerLoader() {
  const params = useSearchParams();
  const router = useRouter();
  const incoming = getSample(params.get("sample"))?.text ?? sharedText(params);

  const [prefill, setPrefill] = useState({ text: incoming, nonce: 0, seen: incoming });
  if (incoming && incoming !== prefill.seen) {
    setPrefill({ text: incoming, nonce: prefill.nonce + 1, seen: incoming });
  } else if (!incoming && prefill.seen) {
    setPrefill({ ...prefill, seen: "" });
  }

  useEffect(() => {
    if (incoming) router.replace("/check/message", { scroll: false });
  }, [incoming, router]);

  return <MessageChecker key={prefill.nonce} initialText={prefill.text} />;
}

function MessageChecker({ initialText }: { initialText: string }) {
  const { lang, t } = useLang();
  const { state, run, reset, busy } = useAnalysis();
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const [pasteNote, setPasteNote] = useState<string | null>(null);
  const [outage, setOutage] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  const redacted = useMemo(() => redactSensitive(text), [text]);
  const links = useMemo(() => extractEntities(redacted.text).urls, [redacted.text]);
  const length = text.length;
  const over = length > LIMITS.messageMaxChars;

  async function paste() {
    setPasteNote(null);
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
      setPasteNote(t("msg.paste.unsupported"));
      return;
    }
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        setPasteNote(t("msg.paste.empty"));
        return;
      }
      setText(clip);
      setError(null);
      area.current?.focus();
    } catch {
      setPasteNote(t("msg.paste.denied"));
    }
  }

  /** Put text read from a picture in the box: replace an empty box, otherwise add below. */
  function onImageText(read: string) {
    setText((current) => (current.trim() ? `${current.trimEnd()}\n\n${read}` : read));
    setError(null);
    area.current?.focus();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmed = text.trim();
    let problem: string | null = null;
    if (trimmed.length < LIMITS.messageMinChars) problem = t("msg.err.short", { min: LIMITS.messageMinChars });
    else if (text.length > LIMITS.messageMaxChars) problem = t("msg.err.long", { max: LIMITS.messageMaxChars });
    setError(problem);
    if (problem) {
      area.current?.focus();
      return;
    }
    // Always send the redacted text, never the raw text.
    const safe = redactSensitive(text).text.trim();
    void run((signal) => analyzeMessage({ text: safe, lang, ...(outage ? { simulateOutage: true } : {}) }, signal));
  }

  return (
    <CheckerShell title="msg.title" intro="msg.intro">
      <form onSubmit={submit} noValidate>
        <label htmlFor="msg-text" className="block text-h3">
          {t("msg.label")}
        </label>
        <p id="msg-hint" className="mt-1 text-small text-muted">
          {t("msg.hint")}
        </p>
        <p className="mt-2 text-small text-muted">
          <span className="font-semibold text-ink">{t("check.example")}: </span>
          <q>{t("msg.example")}</q>
        </p>

        <textarea
          id="msg-text"
          ref={area}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          rows={8}
          placeholder={t("msg.placeholder")}
          aria-describedby={`msg-hint msg-counter${error ? " msg-error" : ""}`}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          spellCheck={false}
          className="field mt-3 resize-y"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p id="msg-counter" className={over ? "text-small font-semibold text-danger-dark" : "text-small text-muted"}>
            {t("msg.counter", { n: length, max: LIMITS.messageMaxChars })}
          </p>
          {text && (
            <button
              type="button"
              className="btn btn-quiet min-h-[2.75rem] px-3"
              onClick={() => {
                setText("");
                setError(null);
                area.current?.focus();
              }}
            >
              {t("check.clear")}
            </button>
          )}
        </div>
        {error && <FieldError id="msg-error">{error}</FieldError>}

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <button type="button" onClick={paste} className="btn btn-secondary w-full sm:w-auto">
              <ClipboardIcon size={22} />
              {t("msg.paste")}
            </button>
            {pasteNote && (
              <p role="status" className="mt-2 text-small font-semibold text-ink">
                {pasteNote}
              </p>
            )}
          </div>
          <ImageToText onText={onImageText} />
        </div>

        <RedactionNotice id="msg-redaction" redactions={redacted.redactions} text={redacted.text} />

        {links.length > 0 && (
          <div className="mt-4 rounded-xl border border-line bg-soft p-4">
            <h2 className="text-h3">{t("links.title")}</h2>
            <ul className="mt-2 space-y-1">
              {links.map((u) => (
                <li key={u} className="break-all font-mono text-[0.85rem]">
                  {u}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-small font-semibold">{t("links.noOpen")}</p>
          </div>
        )}

        <p className="mt-5 flex gap-2 text-small text-muted">
          <LockIcon size={20} className="mt-0.5 shrink-0" />
          <span>{t("msg.privacy")}</span>
        </p>

        <DemoOutageToggle
          checked={outage}
          onChange={(value) => {
            setOutage(value);
            reset(); // a result from the other mode must not stay on screen
          }}
        />

        <button type="submit" aria-disabled={busy} className="btn btn-primary mt-6 w-full sm:w-auto">
          {t("msg.submit")}
        </button>
      </form>

      <ResultSlot state={state} />
    </CheckerShell>
  );
}
