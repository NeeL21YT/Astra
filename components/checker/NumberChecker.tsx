"use client";

import { useMemo, useRef, useState } from "react";
import { useLang } from "@/lib/client/language";
import { analyzePhone } from "@/lib/client/api";
import { redactSensitive } from "@/lib/privacy/redact";
import { LIMITS } from "@/lib/types";
import type { PhoneChannel } from "@/lib/types";
import type { UiKey } from "@/lib/i18n/ui";
import { InfoIcon } from "@/components/ui/icons";
import { CheckerShell, DemoOutageToggle, FieldError } from "./CheckerShell";
import { RedactionNotice } from "./RedactionNotice";
import { ResultSlot } from "./ResultSlot";
import { useAnalysis } from "./useAnalysis";

const CHANNELS: ReadonlyArray<{ value: PhoneChannel; label: UiKey }> = [
  { value: "call", label: "num.channel.call" },
  { value: "sms", label: "num.channel.sms" },
  { value: "whatsapp", label: "num.channel.whatsapp" },
  { value: "other", label: "num.channel.other" },
];

export function NumberChecker() {
  const { t } = useLang();
  const { state, run, reset, busy } = useAnalysis();
  const [number, setNumber] = useState("");
  const [channel, setChannel] = useState<PhoneChannel | null>(null);
  const [description, setDescription] = useState("");
  const [outage, setOutage] = useState(false);
  const [numberError, setNumberError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const numberInput = useRef<HTMLInputElement>(null);
  const descInput = useRef<HTMLTextAreaElement>(null);

  const redacted = useMemo(() => redactSensitive(description), [description]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const n = number.trim();
    const nErr = n ? null : t("num.err.empty");
    const dErr =
      description.length > LIMITS.phoneDescriptionMaxChars
        ? t("num.desc.err.long", { max: LIMITS.phoneDescriptionMaxChars })
        : null;
    setNumberError(nErr);
    setDescError(dErr);
    if (nErr) {
      numberInput.current?.focus();
      return;
    }
    if (dErr) {
      descInput.current?.focus();
      return;
    }
    const safeDescription = redactSensitive(description).text.trim();
    const context = {
      ...(channel ? { channel } : {}),
      ...(safeDescription ? { description: safeDescription } : {}),
    };
    void run((signal) =>
      analyzePhone(
        {
          number: n,
          ...(Object.keys(context).length > 0 ? { context } : {}),
          ...(outage ? { simulateOutage: true } : {}),
        },
        signal,
      ),
    );
  }

  return (
    <CheckerShell title="num.title" intro="num.intro">
      <div className="mb-6 flex gap-3 rounded-xl border-2 border-navy bg-soft p-4">
        <InfoIcon className="mt-0.5 shrink-0 text-navy" />
        <p className="font-semibold text-navy">{t("num.honest")}</p>
      </div>

      <form onSubmit={submit} noValidate>
        <label htmlFor="num-number" className="block text-h3">
          {t("num.label")}
        </label>
        <p id="num-hint" className="mt-1 text-small text-muted">
          {t("num.hint")}
        </p>
        <p className="mt-2 text-small text-muted">
          <span className="font-semibold text-ink">{t("check.example")}: </span>
          {t("num.example")}
        </p>
        <input
          id="num-number"
          ref={numberInput}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
            if (numberError) setNumberError(null);
          }}
          aria-describedby={`num-hint${numberError ? " num-error" : ""}`}
          aria-invalid={numberError ? true : undefined}
          className="field mt-3"
        />
        {numberError && <FieldError id="num-error">{numberError}</FieldError>}

        <fieldset className="mt-8">
          <legend className="text-h3">
            {t("num.channel.legend")} <span className="text-small font-normal text-muted">({t("check.optional")})</span>
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CHANNELS.map((c) => (
              <label
                key={c.value}
                className="flex min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-xl border-2 border-field bg-white px-4 has-[:checked]:border-navy has-[:checked]:bg-soft"
              >
                <input
                  type="radio"
                  name="channel"
                  value={c.value}
                  checked={channel === c.value}
                  onChange={() => setChannel(c.value)}
                  className="h-5 w-5 accent-navy"
                />
                <span className="font-semibold">{t(c.label)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-8">
          <label htmlFor="num-desc" className="block text-h3">
            {t("num.desc.label")} <span className="text-small font-normal text-muted">({t("check.optional")})</span>
          </label>
          <p id="num-desc-hint" className="mt-1 text-small text-muted">
            {t("num.desc.hint")}
          </p>
          <textarea
            id="num-desc"
            ref={descInput}
            rows={4}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (descError) setDescError(null);
            }}
            aria-describedby={`num-desc-hint num-desc-counter${descError ? " num-desc-error" : ""}`}
            aria-invalid={descError ? true : undefined}
            autoComplete="off"
            className="field mt-3 resize-y"
          />
          <p
            id="num-desc-counter"
            className={
              description.length > LIMITS.phoneDescriptionMaxChars
                ? "mt-2 text-small font-semibold text-danger-dark"
                : "mt-2 text-small text-muted"
            }
          >
            {t("num.desc.counter", { n: description.length, max: LIMITS.phoneDescriptionMaxChars })}
          </p>
          {descError && <FieldError id="num-desc-error">{descError}</FieldError>}
          <RedactionNotice id="num-redaction" redactions={redacted.redactions} text={redacted.text} />
        </div>

        <DemoOutageToggle
          checked={outage}
          onChange={(value) => {
            setOutage(value);
            reset(); // a result from the other mode must not stay on screen
          }}
        />

        <button type="submit" aria-disabled={busy} className="btn btn-primary mt-8 w-full sm:w-auto">
          {t("num.submit")}
        </button>
      </form>

      <ResultSlot state={state} />
    </CheckerShell>
  );
}
