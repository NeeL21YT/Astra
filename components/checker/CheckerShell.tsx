"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";

/** Common page frame for every checker: title, intro, then the form and results. */
export function CheckerShell({
  title,
  intro,
  children,
}: {
  title: UiKey;
  intro: UiKey;
  children: ReactNode;
}) {
  const { t } = useLang();
  return (
    <div className="container-narrow py-10 md:py-14">
      <h1>{t(title)}</h1>
      <p className="mt-3 text-lg">{t(intro)}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function CheckerFallback() {
  const { t } = useLang();
  return (
    <div className="container-narrow py-14" aria-busy="true">
      <p role="status" className="text-muted">
        {t("common.loading")}
      </p>
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-2 font-semibold text-danger-dark">
      {children}
    </p>
  );
}

/**
 * Demo switch, shown on every checker and OFF by default. When on, the request asks the server to
 * treat every outside checking service as unavailable, so a demo can show that ASTRA keeps working
 * and says so honestly. It only affects the person's own request.
 */
export function DemoOutageToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useLang();
  const id = useId();
  return (
    <div className="mt-5 rounded-xl border-2 border-dashed border-field bg-soft p-3 text-small">
      <div className="flex min-h-[2.75rem] items-center justify-between gap-3">
        <span id={`${id}-label`} className="font-semibold">
          {t("demo.outage")}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-hint`}
          onClick={() => onChange(!checked)}
          className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
            checked ? "border-navy bg-navy" : "border-field bg-white"
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 h-6 w-6 rounded-full transition-all ${
              checked ? "left-[1.7rem] bg-white" : "left-0.5 bg-muted"
            }`}
          />
          <span className="sr-only">{checked ? t("demo.on") : t("demo.off")}</span>
        </button>
      </div>
      <p id={`${id}-hint`} className="text-muted">
        {t("demo.outage.hint")}{" "}
        <strong className="text-ink">{checked ? t("demo.on") : t("demo.off")}</strong>
      </p>
    </div>
  );
}
