"use client";

import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";
import { ResultView } from "@/components/result/ResultView";
import { WarningIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";
import type { AnalysisState } from "./useAnalysis";

/**
 * Everything that appears below a checker form: the loading indicator, a plain
 * error, or the result. The result stays until the next check (no timers).
 */
export function ResultSlot({ state, loadingKey = "check.loading" }: { state: AnalysisState; loadingKey?: UiKey }) {
  const { lang, t } = useLang();

  const announcement =
    state.status === "done" && state.response.ok
      ? t("result.announce", { state: t(`state.${state.response.result.uiState}` as UiKey) })
      : "";

  return (
    <div className="mt-8">
      {/* Polite announcement for screen readers once a result arrives. */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {state.status === "loading" && (
        <div role="status" className="card flex items-center gap-4 bg-soft">
          <Spinner />
          <p className="font-semibold">{t(loadingKey)}</p>
        </div>
      )}

      {state.status === "done" && !state.response.ok && (
        <div role="alert" className="rounded-2xl border-2 border-danger bg-danger-soft p-5">
          <h2 className="flex items-center gap-2 text-h3 text-danger-dark">
            <WarningIcon size={24} />
            {t("check.errorTitle")}
          </h2>
          <p className="mt-2 text-ink">{state.response.error.message[lang]}</p>
        </div>
      )}

      {state.status === "done" && state.response.ok && (
        <section aria-label={t("check.result.heading")}>
          <ResultView key={state.run} result={state.response.result} autoFocus />
        </section>
      )}
    </div>
  );
}
