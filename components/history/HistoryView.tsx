"use client";

import { useId, useSyncExternalStore } from "react";
import { useLang } from "@/lib/client/language";
import {
  HISTORY_SERVER_SNAPSHOT,
  HISTORY_TTL_DAYS,
  clearHistory,
  getHistorySnapshot,
  removeHistoryEntry,
  setHistoryEnabled,
  subscribeHistory,
} from "@/lib/client/history";
import type { UiKey } from "@/lib/i18n/ui";
import type { UiState } from "@/lib/types";
import { cx } from "@/components/ui/cx";

const BADGE: Record<UiState, string> = {
  potential_scam: "bg-danger-soft text-danger-dark border-danger",
  suspicious: "bg-warning-soft text-ink border-warning",
  likely_safe: "bg-success-soft text-success-dark border-success",
  unable: "bg-neutral-soft text-ink border-field",
};

export function HistoryView() {
  const { lang, t } = useLang();
  const id = useId();
  const data = useSyncExternalStore(subscribeHistory, getHistorySnapshot, () => HISTORY_SERVER_SNAPSHOT);
  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  return (
    <div className="container-narrow py-10 md:py-14">
      <h1>{t("history.title")}</h1>
      <p className="mt-3 text-lg">{t("history.intro")}</p>

      <div className="card mt-8">
        <div className="flex min-h-[2.75rem] items-center justify-between gap-3">
          <span id={`${id}-label`} className="font-semibold">
            {t("history.optin")}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={data.enabled}
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-hint`}
            onClick={() => setHistoryEnabled(!data.enabled)}
            className={cx(
              "relative h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors",
              data.enabled ? "border-navy bg-navy" : "border-field bg-white",
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "absolute top-0.5 h-6 w-6 rounded-full transition-all",
                data.enabled ? "left-[1.7rem] bg-white" : "left-0.5 bg-muted",
              )}
            />
            <span className="sr-only">{data.enabled ? t("history.on") : t("history.off")}</span>
          </button>
        </div>
        <p id={`${id}-hint`} className="mt-2 text-small text-muted">
          {t("history.optin.hint", { days: HISTORY_TTL_DAYS })}{" "}
          <strong className="text-ink">{data.enabled ? t("history.on") : t("history.off")}</strong>
        </p>
      </div>

      <section aria-labelledby={`${id}-list`} className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${id}-list`} className="text-h3">
            {t("history.list")}
          </h2>
          {data.entries.length > 0 && (
            <button type="button" onClick={clearHistory} className="btn btn-secondary min-h-11 px-4">
              {t("history.clear")}
            </button>
          )}
        </div>

        {data.entries.length === 0 ? (
          <p className="mt-4 rounded-xl border border-line bg-soft p-4 text-muted">
            {data.enabled ? t("history.empty.on") : t("history.empty.off")}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.entries.map((e) => (
              <li key={e.id} className="card flex flex-wrap items-center justify-between gap-3 !py-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {t(`history.kind.${e.kind}` as UiKey)}
                    {e.label ? <span className="font-normal text-muted"> · </span> : null}
                    {e.label ? <span className="break-all font-normal">{e.label}</span> : null}
                  </p>
                  <p className="text-small text-muted">
                    {new Date(e.at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cx("rounded-full border px-3 py-1 text-small font-semibold", BADGE[e.uiState])}>
                    {t(`state.${e.uiState}` as UiKey)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeHistoryEntry(e.id)}
                    aria-label={t("history.removeLabel")}
                    className="min-h-11 cursor-pointer rounded-lg px-3 text-small font-semibold text-navy underline hover:bg-soft"
                  >
                    {t("history.remove")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
