"use client";

import type { FileCheck } from "@/lib/types";
import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";
import { ExternalIcon } from "@/components/ui/icons";
import { formatDate, safeExternalUrl } from "./safeUrl";

export function FileCheckCard({ check }: { check: FileCheck }) {
  const { lang, t } = useLang();
  const r = check.reputation;
  const counts = r.engineCounts;
  const first = formatDate(r.firstSeen, lang);
  const last = formatDate(r.lastAnalyzed, lang);
  const ref = safeExternalUrl(r.referenceUrl);

  return (
    <div>
      <p className="font-semibold">{t(`result.file.status.${r.status}` as UiKey)}</p>

      <h4 className="mt-4 font-semibold">{t("file.fingerprint")}</h4>
      <p className="mt-1 break-all font-mono text-[0.85rem]">{check.sha256}</p>

      {counts && (
        <>
          <h4 className="mt-4 font-semibold">{t("result.file.engines")}</h4>
          <ul className="mt-1 list-disc space-y-1 pl-6">
            <li>{t("result.file.malicious", { n: counts.malicious })}</li>
            <li>{t("result.file.suspiciousCount", { n: counts.suspicious })}</li>
            <li>{t("result.file.harmless", { n: counts.harmless })}</li>
            <li>{t("result.file.undetected", { n: counts.undetected })}</li>
          </ul>
        </>
      )}

      {r.topThreatNames && r.topThreatNames.length > 0 && (
        <>
          <h4 className="mt-4 font-semibold">{t("result.file.threats")}</h4>
          <ul className="mt-1 list-disc space-y-1 pl-6 break-words">
            {r.topThreatNames.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </>
      )}

      {(first || last) && (
        <dl className="mt-4 grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-4">
          {first && (
            <>
              <dt className="font-semibold">{t("result.file.first")}</dt>
              <dd>{first}</dd>
            </>
          )}
          {last && (
            <>
              <dt className="font-semibold">{t("result.file.last")}</dt>
              <dd>{last}</dd>
            </>
          )}
        </dl>
      )}

      {ref && (
        <a
          href={ref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary mt-5 w-full sm:w-auto"
        >
          {t("result.file.report", { provider: r.provider })}
          <ExternalIcon size={20} />
          <span className="sr-only">{t("common.opensNewTab")}</span>
        </a>
      )}
    </div>
  );
}
