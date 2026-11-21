"use client";

import { useRef, useState } from "react";
import { useLang } from "@/lib/client/language";
import { analyzeUrl } from "@/lib/client/api";
import { LIMITS } from "@/lib/types";
import { LockIcon } from "@/components/ui/icons";
import { CheckerShell, DemoOutageToggle, FieldError } from "./CheckerShell";
import { ResultSlot } from "./ResultSlot";
import { useAnalysis } from "./useAnalysis";

export function LinkChecker() {
  const { t } = useLang();
  const { state, run, reset, busy } = useAnalysis();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [outage, setOutage] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const value = url.trim();
    let problem: string | null = null;
    if (!value) problem = t("link.err.empty");
    else if (value.length > LIMITS.urlMaxChars) problem = t("link.err.long");
    setError(problem);
    if (problem) {
      input.current?.focus();
      return;
    }
    void run((signal) => analyzeUrl({ url: value, ...(outage ? { simulateOutage: true } : {}) }, signal));
  }

  return (
    <CheckerShell title="link.title" intro="link.intro">
      <form onSubmit={submit} noValidate>
        <label htmlFor="link-url" className="block text-h3">
          {t("link.label")}
        </label>
        <p id="link-hint" className="mt-1 text-small text-muted">
          {t("link.hint")}
        </p>
        <p className="mt-2 break-all text-small text-muted">
          <span className="font-semibold text-ink">{t("check.example")}: </span>
          <span className="font-mono">{t("link.example")}</span>
        </p>
        <input
          id="link-url"
          ref={input}
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          aria-describedby={`link-hint${error ? " link-error" : ""}`}
          aria-invalid={error ? true : undefined}
          className="field mt-3"
        />
        {error && <FieldError id="link-error">{error}</FieldError>}

        <div className="mt-5 flex gap-3 rounded-xl border-2 border-navy bg-soft p-4">
          <LockIcon className="mt-0.5 shrink-0 text-navy" />
          <p className="font-semibold text-navy">{t("link.never")}</p>
        </div>
        <p className="mt-4 text-small text-muted">{t("link.privacy")}</p>

        <DemoOutageToggle
          checked={outage}
          onChange={(value) => {
            setOutage(value);
            reset(); // a result from the other mode must not stay on screen
          }}
        />

        <button type="submit" aria-disabled={busy} className="btn btn-primary mt-6 w-full sm:w-auto">
          {t("link.submit")}
        </button>
      </form>

      <ResultSlot state={state} />
    </CheckerShell>
  );
}
