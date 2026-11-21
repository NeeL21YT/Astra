"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/client/language";
import { prepareImage } from "@/lib/client/image";
import { readTextFromImage } from "@/lib/client/ocr";
import type { UiKey } from "@/lib/i18n/ui";
import { ImageIcon, LockIcon } from "@/components/ui/icons";

type Note = { kind: "info" | "problem"; key?: UiKey; text?: string };

/**
 * "Read text from a picture": the person picks a screenshot or photo, ASTRA reads the words and
 * puts them in the message box for them to check and correct. Nothing is analyzed until they
 * press the normal check button, and the picture is never stored.
 */
export function ImageToText({ onText }: { onText: (text: string) => void }) {
  const { lang, t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same picture again later
    if (!file) return;

    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setNote(null);
    setBusy(true);
    try {
      const prepared = await prepareImage(file);
      if (!prepared.ok) {
        setNote({
          kind: "problem",
          key: prepared.reason === "too_big" ? "msg.image.tooBig" : "msg.image.badFile",
        });
        return;
      }
      const out = await readTextFromImage(prepared.value, controller.signal);
      if (controller.signal.aborted) return;
      if (!out.ok) {
        setNote({ kind: "problem", text: out.error.message[lang] });
      } else if (out.noText || !out.text.trim()) {
        setNote({ kind: "problem", key: "msg.image.noText" });
      } else {
        onText(out.text);
        setNote({ kind: "info", key: "msg.image.done" });
      }
    } finally {
      if (abort.current === controller) setBusy(false);
    }
  }

  const message = note ? (note.key ? t(note.key) : note.text) : null;

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-label={t("msg.image.inputLabel")}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-disabled={busy}
        className="btn btn-secondary w-full sm:w-auto"
      >
        <ImageIcon size={22} />
        {t("msg.image")}
      </button>

      <p className="mt-2 flex gap-2 text-small text-muted">
        <LockIcon size={20} className="mt-0.5 shrink-0" />
        <span>{t("msg.image.privacy")}</span>
      </p>

      {busy && (
        <p role="status" className="mt-2 text-small font-semibold text-ink">
          {t("msg.image.reading")}
        </p>
      )}
      {!busy && message && (
        <p
          role="status"
          className={
            note?.kind === "problem"
              ? "mt-2 rounded-lg border border-line bg-soft p-3 text-small font-semibold text-ink"
              : "mt-2 rounded-lg border border-navy bg-soft p-3 text-small font-semibold text-ink"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
