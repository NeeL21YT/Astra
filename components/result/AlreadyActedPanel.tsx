"use client";

import { useId } from "react";
import { useLang } from "@/lib/client/language";
import { lines } from "@/lib/i18n/ui";
import type { UiKey } from "@/lib/i18n/ui";

const CASES: ReadonlyArray<{ id: string; title: UiKey; steps: UiKey }> = [
  { id: "clicked", title: "acted.clicked.title", steps: "acted.clicked.steps" },
  { id: "otp", title: "acted.otp.title", steps: "acted.otp.steps" },
  { id: "app", title: "acted.app.title", steps: "acted.app.steps" },
  { id: "id", title: "acted.id.title", steps: "acted.id.steps" },
  { id: "money", title: "acted.money.title", steps: "acted.money.steps" },
];

/**
 * "I already did it, what now?" Shown under warnings. Each situation opens on its own so the
 * panel stays short; the steps only point to the person's own bank and the official routes.
 */
export function AlreadyActedPanel() {
  const { t } = useLang();
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="card border-2 border-warning">
      <h3 id={titleId} className="text-h2">
        {t("acted.title")}
      </h3>
      <p className="mt-2 text-lg">{t("acted.intro")}</p>
      <div className="mt-4 space-y-3">
        {CASES.map((c) => (
          <details key={c.id} className="group rounded-xl border border-line bg-white open:bg-soft">
            <summary className="flex min-h-[3.25rem] cursor-pointer items-center justify-between gap-3 rounded-xl px-4 py-2 font-semibold">
              {t(c.title)}
              <span aria-hidden="true" className="text-navy transition-transform group-open:rotate-180">
                ▾
              </span>
            </summary>
            <ol className="list-decimal space-y-2 px-4 pb-4 pl-9 marker:font-bold marker:text-navy">
              {lines(t(c.steps)).map((s, i) => (
                <li key={i} className="pl-1">
                  {s}
                </li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </section>
  );
}
