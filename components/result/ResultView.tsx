"use client";

import { useEffect, useRef } from "react";
import type { AnalysisResult } from "@/lib/types";
import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";
import { ChecksStrip } from "./ChecksStrip";
import { FileCheckCard } from "./FileCheckCard";
import { AlreadyActedPanel } from "./AlreadyActedPanel";
import { IndicatorList } from "./IndicatorList";
import { LostMoneyPanel } from "./LostMoneyPanel";
import { ReadAloudButton } from "./ReadAloudButton";
import { Section } from "./Section";
import { ShareSummaryButton } from "./ShareSummaryButton";
import { splitReasons } from "./reasons";
import { StateBanner } from "./StateBanner";
import { UrlChecks } from "./UrlChecks";

/**
 * Renders one AnalysisResult. Stateless: everything comes from the result and
 * the active language, so switching language updates it instantly.
 * With autoFocus, focus moves to the result heading when it first appears.
 */
export function ResultView({ result, autoFocus = false }: { result: AnalysisResult; autoFocus?: boolean }) {
  const { lang, t } = useLang();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocus) heading.current?.focus();
  }, [autoFocus]);

  const id = result.id;
  const warn = result.uiState === "potential_scam" || result.uiState === "suspicious";
  // For a warning, the strongest reasons go right under the summary; the rest stay further down.
  const { top, rest } = warn ? splitReasons(result.indicators) : { top: [], rest: result.indicators };

  return (
    <div className="space-y-6">
      <StateBanner state={result.uiState} headingRef={heading} />

      <div className="card">
        {result.categories.length > 0 && (
          <div className="mb-4">
            <p className="text-small font-semibold text-muted">{t("result.categories")}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {result.categories.map((c) => (
                <li key={c} className="rounded-full border border-field bg-soft px-3 py-1 text-small font-semibold">
                  {t(`cat.${c}` as UiKey)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-lg">{result.summary[lang]}</p>
        {result.requestedAction && (
          <div className="mt-4 rounded-xl bg-soft p-4">
            <p className="text-small font-semibold text-muted">{t("result.requested")}</p>
            <p className="mt-1 font-semibold">{result.requestedAction[lang]}</p>
          </div>
        )}
        <div className="mt-5">
          <ReadAloudButton result={result} />
        </div>
      </div>

      {top.length > 0 && (
        <Section id={`${id}-main`} title={t("result.why.main")}>
          <IndicatorList indicators={top} />
        </Section>
      )}

      {result.recommendedActions.length > 0 && (
        <Section id={`${id}-actions`} title={t("result.actions.title")}>
          <ol className="list-decimal space-y-3 pl-7 text-lg marker:font-bold marker:text-navy">
            {result.recommendedActions.map((a, i) => (
              <li key={i} className="pl-1">
                {a[lang]}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {warn && <AlreadyActedPanel />}

      <LostMoneyPanel />

      {rest.length > 0 ? (
        <Section id={`${id}-why`} title={warn ? (top.length > 0 ? t("result.why.more") : t("result.why.title")) : t("result.why.neutral")}>
          <IndicatorList indicators={rest} />
        </Section>
      ) : result.indicators.length > 0 ? null : (
        result.uiState === "likely_safe" && (
          <Section id={`${id}-why`} title={t("result.why.neutral")}>
            <p>{t("result.why.none")}</p>
          </Section>
        )
      )}

      {result.urlChecks.length > 0 && (
        <Section id={`${id}-links`} title={t("result.links.title")}>
          <UrlChecks checks={result.urlChecks} />
        </Section>
      )}

      {result.fileCheck && (
        <Section id={`${id}-file`} title={t("result.file.title")}>
          <FileCheckCard check={result.fileCheck} />
        </Section>
      )}

      {result.phone && (
        <Section id={`${id}-phone`} title={t("result.phone.title")}>
          <dl className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-4">
            <dt className="font-semibold">{t("result.phone.masked")}</dt>
            <dd className="font-mono">{result.phone.masked}</dd>
            {result.phone.countryName && (
              <>
                <dt className="font-semibold">{t("result.phone.country")}</dt>
                <dd>{result.phone.countryName[lang]}</dd>
              </>
            )}
            {result.phone.lineType && (
              <>
                <dt className="font-semibold">{t("result.phone.lineType")}</dt>
                <dd>{t(`phone.line.${result.phone.lineType}` as UiKey)}</dd>
              </>
            )}
          </dl>
          <p className="mt-3">{result.phone.description[lang]}</p>
          {result.phone.countryName && <p className="mt-2 text-small text-muted">{t("result.phone.note")}</p>}
        </Section>
      )}

      {result.phoneReputation && (
        <Section id={`${id}-phonerep`} title={t("result.phone.rep.title")}>
          {result.phoneReputation.status !== "ok" ? (
            <p>{t("result.phone.rep.unavailable")}</p>
          ) : (
            <>
              <dl className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-4">
                {result.phoneReputation.lineType && (
                  <>
                    <dt className="font-semibold">{t("result.phone.rep.lineType")}</dt>
                    <dd>{t(`phone.line.${result.phoneReputation.lineType}` as UiKey)}</dd>
                  </>
                )}
                {result.phoneReputation.carrier && (
                  <>
                    <dt className="font-semibold">{t("result.phone.rep.carrier")}</dt>
                    <dd>{result.phoneReputation.carrier}</dd>
                  </>
                )}
                {result.phoneReputation.voip !== undefined && (
                  <>
                    <dt className="font-semibold">{t("result.phone.rep.voip")}</dt>
                    <dd>{t(result.phoneReputation.voip ? "common.yes" : "common.no")}</dd>
                  </>
                )}
                {result.phoneReputation.prepaid !== undefined && (
                  <>
                    <dt className="font-semibold">{t("result.phone.rep.prepaid")}</dt>
                    <dd>{t(result.phoneReputation.prepaid ? "common.yes" : "common.no")}</dd>
                  </>
                )}
              </dl>
              {result.phoneReputation.flags.length > 0 ? (
                <div className="mt-3">
                  <h4 className="font-semibold">{t("result.phone.rep.flags")}</h4>
                  <ul className="mt-1 list-disc space-y-1 pl-6">
                    {result.phoneReputation.flags.map((f) => (
                      <li key={f}>{t(`phone.flag.${f}` as UiKey)}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3">{t("result.phone.rep.noFlags")}</p>
              )}
            </>
          )}
          <p className="mt-3 text-small text-muted">{t("result.phone.rep.provider")}</p>
        </Section>
      )}

      {result.checks.length > 0 && (
        <Section id={`${id}-checks`} title={t("result.checks.title")}>
          <ChecksStrip checks={result.checks} />
        </Section>
      )}

      {result.limitations.length > 0 && (
        <Section id={`${id}-limits`} title={t("result.limits.title")}>
          <ul className="list-disc space-y-2 pl-6 text-muted">
            {result.limitations.map((l, i) => (
              <li key={i}>{l[lang]}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section id={`${id}-share`} title={t("share.title")}>
        <ShareSummaryButton result={result} />
      </Section>

      <div className="rounded-xl bg-soft p-4 text-small text-muted">
        <p className="font-semibold text-ink">{t("result.disclaimer")}</p>
        {result.aiUsed && <p className="mt-1">{t("result.aiUsed")}</p>}
      </div>
    </div>
  );
}
