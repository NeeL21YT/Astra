"use client";

import type { Ref } from "react";
import type { UiState } from "@/lib/types";
import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";
import { CautionIcon, CheckCircleIcon, InfoIcon, WarningIcon } from "@/components/ui/icons";

const STYLE: Record<UiState, { box: string; icon: typeof WarningIcon }> = {
  // Red fill, white text (5.6:1).
  potential_scam: { box: "bg-danger text-white", icon: WarningIcon },
  // Amber is only ever a fill, with dark text on top (7.0:1).
  suspicious: { box: "bg-warning text-ink", icon: CautionIcon },
  // Green fill, white text (4.8:1).
  likely_safe: { box: "bg-success text-white", icon: CheckCircleIcon },
  // Neutral grey with a strong border.
  unable: { box: "border-2 border-muted bg-neutral-soft text-ink", icon: InfoIcon },
};

/** The big verdict banner. Always has a text label and an icon, never colour alone. */
export function StateBanner({ state, headingRef }: { state: UiState; headingRef?: Ref<HTMLHeadingElement> }) {
  const { t } = useLang();
  const { box, icon: Icon } = STYLE[state];
  return (
    <div className={`rounded-2xl p-5 sm:p-7 ${box}`}>
      <div className="flex items-start gap-4">
        <Icon size={52} className="mt-1 shrink-0" />
        <div className="min-w-0">
          <p className="text-small font-semibold opacity-95">{t("result.complete")}</p>
          <h2 ref={headingRef} tabIndex={-1} className="text-h1 mt-1 font-extrabold">
            {t(`state.${state}` as UiKey)}
          </h2>
          <p className="mt-2 text-lg">{t(`state.${state}.desc` as UiKey)}</p>
          {state === "likely_safe" && (
            <p className="mt-3 rounded-lg bg-white/15 p-3 font-semibold">{t("state.likely_safe.caution")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
