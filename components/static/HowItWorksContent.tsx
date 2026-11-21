"use client";

import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";
import type { UiState } from "@/lib/types";
import { LinkButton } from "@/components/ui/LinkButton";
import { CautionIcon, CheckCircleIcon, InfoIcon, WarningIcon } from "@/components/ui/icons";

const STEPS = [1, 2, 3] as const;
const TOPICS = ["otp", "upi", "kyc", "delivery", "remote", "arrest"] as const;
const STATES: ReadonlyArray<{ state: UiState; icon: typeof WarningIcon; tone: string }> = [
  { state: "potential_scam", icon: WarningIcon, tone: "bg-danger text-white" },
  { state: "suspicious", icon: CautionIcon, tone: "bg-warning text-ink" },
  { state: "likely_safe", icon: CheckCircleIcon, tone: "bg-success text-white" },
  { state: "unable", icon: InfoIcon, tone: "border-2 border-muted bg-neutral-soft text-ink" },
];

export function HowItWorksContent() {
  const { t } = useLang();
  return (
    <div className="container-narrow py-10 md:py-14">
      <h1>{t("how.title")}</h1>
      <p className="mt-4 text-lg">{t("how.intro")}</p>

      <ol className="mt-8 space-y-4">
        {STEPS.map((n) => (
          <li key={n} className="card">
            <h2 className="text-h2">{t(`how.step${n}.title` as UiKey)}</h2>
            <p className="mt-2">{t(`how.step${n}.body` as UiKey)}</p>
          </li>
        ))}
      </ol>

      <section aria-labelledby="how-results" className="mt-12">
        <h2 id="how-results">{t("how.results.title")}</h2>
        <ul className="mt-4 space-y-3">
          {STATES.map(({ state, icon: Icon, tone }) => (
            <li key={state} className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-start">
              <span className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 font-bold ${tone}`}>
                <Icon size={22} />
                {t(`state.${state}` as UiKey)}
              </span>
              <span>{t(`state.${state}.desc` as UiKey)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-learn" className="mt-12">
        <h2 id="how-learn">{t("how.learn.title")}</h2>
        <p className="mt-2 text-muted">{t("how.learn.intro")}</p>
        <div className="mt-5 space-y-4">
          {TOPICS.map((k) => (
            <article key={k} className="card">
              <h3 className="text-h2">{t(`how.${k}.title` as UiKey)}</h3>
              <p className="mt-2">{t(`how.${k}.body` as UiKey)}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 rounded-xl border-2 border-navy bg-soft p-4 font-semibold text-navy">{t("how.golden")}</p>
      </section>

      <div className="mt-8">
        <LinkButton href="/#check" className="w-full sm:w-auto">
          {t("how.cta")}
        </LinkButton>
      </div>
    </div>
  );
}
