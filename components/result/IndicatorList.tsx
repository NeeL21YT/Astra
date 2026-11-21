"use client";

import type { Indicator } from "@/lib/types";
import { useLang } from "@/lib/client/language";
import { HelpIcon, MessageIcon } from "@/components/ui/icons";

function SourceBadge({ official }: { official: boolean }) {
  const { t } = useLang();
  return official ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-navy bg-white px-3 py-0.5 text-small font-semibold text-navy">
      <HelpIcon size={16} />
      {t("indicator.official")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-field bg-soft px-3 py-0.5 text-small font-semibold text-ink">
      <MessageIcon size={16} />
      {t("indicator.analysis")}
    </span>
  );
}

export function IndicatorList({ indicators }: { indicators: Indicator[] }) {
  const { lang, t } = useLang();
  return (
    <ul className="space-y-4">
      {indicators.map((ind, i) => (
        <li key={`${ind.id}-${i}`} className="rounded-xl border border-line bg-white p-4">
          <SourceBadge official={ind.source === "url_provider" || ind.source === "file_provider" || ind.source === "phone_provider"} />
          <p className="mt-3 font-semibold">{ind.explanation[lang]}</p>
          {ind.evidence ? (
            <figure className="mt-3">
              <figcaption className="text-small text-muted">{t("indicator.evidence")}</figcaption>
              <blockquote className="mt-1 break-words border-l-4 border-navy pl-3">
                <mark className="whitespace-pre-wrap rounded px-1 font-semibold underline decoration-warning decoration-2 underline-offset-4">
                  {ind.evidence}
                </mark>
              </blockquote>
            </figure>
          ) : ind.inferred ? (
            <p className="mt-2 text-small text-muted">{t("indicator.inferred")}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
