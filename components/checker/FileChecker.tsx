"use client";

import { useRef, useState } from "react";
import { useLang } from "@/lib/client/language";
import { analyzeFile } from "@/lib/client/api";
import { FileHashError, guessFileKind, sha256OfFile } from "@/lib/client/fileHash";
import type { UiKey } from "@/lib/i18n/ui";
import { lines } from "@/lib/i18n/ui";
import { InfoIcon, LockIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";
import { CheckerShell, DemoOutageToggle, FieldError } from "./CheckerShell";
import { ResultSlot } from "./ResultSlot";
import { useAnalysis } from "./useAnalysis";

export function FileChecker() {
  const { t } = useLang();
  const { state, run, reset, busy } = useAnalysis();
  const [file, setFile] = useState<File | null>(null);
  const [hashing, setHashing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<UiKey | null>(null);
  const [outage, setOutage] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function formatSize(bytes: number): string {
    if (bytes >= 1024 ** 3) return t("size.gb", { n: (bytes / 1024 ** 3).toFixed(1) });
    if (bytes >= 1024 ** 2) return t("size.mb", { n: (bytes / 1024 ** 2).toFixed(1) });
    return t("size.kb", { n: Math.max(1, Math.round(bytes / 1024)) });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || hashing) return;
    if (!file) {
      setError("file.err.noFile");
      input.current?.focus();
      return;
    }
    setError(null);
    setHash(null);
    setProgress(0);
    setHashing(true);
    let digest: string;
    try {
      digest = await sha256OfFile(file, setProgress);
    } catch (err) {
      const kind = err instanceof FileHashError ? err.kind : "read";
      setError(
        kind === "too_big"
          ? "file.err.tooBig"
          : kind === "no_crypto"
            ? "file.err.nocrypto"
            : kind === "memory"
              ? "file.err.memory"
              : "file.err.generic",
      );
      setHashing(false);
      return;
    }
    setHashing(false);
    setHash(digest);
    // Only the fingerprint (and a rough file type guessed from the name) leaves the device.
    // The file itself is never uploaded.
    const fileType = guessFileKind(file.name);
    void run((signal) =>
      analyzeFile({ sha256: digest, fileType, ...(outage ? { simulateOutage: true } : {}) }, signal),
    );
  }

  const percent = Math.round(progress * 100);

  return (
    <CheckerShell title="file.title" intro="file.intro">
      <div className="mb-6 flex gap-3 rounded-xl border-2 border-navy bg-soft p-4">
        <LockIcon className="mt-0.5 shrink-0 text-navy" />
        <p className="font-semibold text-navy">{t("file.never")}</p>
      </div>

      <form onSubmit={submit} noValidate>
        <label htmlFor="file-input" className="block text-h3">
          {t("file.label")}
        </label>
        <p id="file-hint" className="mt-1 text-small text-muted">
          {t("file.hint")}
        </p>
        <input
          id="file-input"
          ref={input}
          type="file"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setHash(null);
            setError(null);
          }}
          aria-describedby={`file-hint${error ? " file-error" : ""}`}
          aria-invalid={error ? true : undefined}
          className="field mt-3 cursor-pointer file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:font-semibold file:text-white"
        />
        {file && (
          <p className="mt-2 break-all text-small text-muted">
            {t("file.selected", { name: file.name, size: formatSize(file.size) })}
          </p>
        )}
        {error && <FieldError id="file-error">{t(error)}</FieldError>}

        <p className="mt-4 flex gap-2 text-small font-semibold">
          <InfoIcon size={20} className="mt-0.5 shrink-0 text-navy" />
          <span>{t("file.noOpen")}</span>
        </p>

        <DemoOutageToggle
          checked={outage}
          onChange={(value) => {
            setOutage(value);
            reset(); // a result from the other mode must not stay on screen
          }}
        />

        <button type="submit" aria-disabled={busy || hashing} className="btn btn-primary mt-6 w-full sm:w-auto">
          {t("file.submit")}
        </button>
      </form>

      {hashing && (
        <div role="status" className="card mt-8 bg-soft">
          <div className="flex items-center gap-4">
            <Spinner />
            <p className="font-semibold">{t("file.hashing", { n: percent })}</p>
          </div>
          <progress
            max={100}
            value={percent}
            aria-label={t("file.hashing", { n: percent })}
            className="mt-4 h-3 w-full accent-navy"
          />
        </div>
      )}

      {hash && (
        <div className="card mt-8">
          <h2 className="text-h3">{t("file.fingerprint")}</h2>
          <p className="mt-2 break-all font-mono text-[0.85rem]">{hash}</p>
          <p className="mt-2 text-small text-muted">{t("file.fingerprint.note")}</p>
          <p className="mt-2 text-small font-semibold">{t("file.never")}</p>
        </div>
      )}

      <ResultSlot state={state} />

      <section className="mt-10" aria-labelledby="file-limits-title">
        <h2 id="file-limits-title" className="text-h3">
          {t("file.limits.title")}
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-small text-muted">
          {lines(t("file.limits")).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </CheckerShell>
  );
}
