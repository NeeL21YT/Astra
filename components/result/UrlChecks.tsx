"use client";

import type { ProviderStatus, UrlCheck } from "@/lib/types";
import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";
import { CautionIcon, CheckCircleIcon, ExternalIcon, InfoIcon, WarningIcon } from "@/components/ui/icons";
import { safeExternalUrl } from "./safeUrl";

const STATUS_KEY: Record<ProviderStatus, UiKey> = {
  malicious: "result.provider.malicious",
  suspicious: "result.provider.suspicious",
  no_match: "result.provider.notFound",
  unknown: "result.provider.notFound",
  unavailable: "result.provider.unavailable",
};

function StatusIcon({ status }: { status: ProviderStatus }) {
  if (status === "malicious") return <WarningIcon size={22} className="mt-0.5 shrink-0 text-danger" />;
  if (status === "suspicious") return <CautionIcon size={22} className="mt-0.5 shrink-0 text-ink" />;
  // "Not found" and "unavailable" get a neutral icon on purpose: neither means safe.
  return <InfoIcon size={22} className="mt-0.5 shrink-0 text-muted" />;
}

export function UrlChecks({ checks }: { checks: UrlCheck[] }) {
  const { lang, t } = useLang();
  return (
    <>
      <p className="mb-4 text-small font-semibold">{t("result.links.note")}</p>
      <ul className="space-y-5">
        {checks.map((c, i) => (
          <li key={`${c.url}-${i}`} className="rounded-xl border border-line bg-white p-4">
            {/* Plain text on purpose: never a clickable link. */}
            <p className="break-all font-mono text-[0.9rem] font-semibold">{c.url}</p>

            <h4 className="mt-4 font-semibold">{t("result.links.flags")}</h4>
            {c.flags.length > 0 ? (
              <ul className="mt-1 list-disc space-y-1 pl-6">
                {c.flags.map((f) => (
                  <li key={f.id}>{f.explanation[lang]}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 flex items-start gap-2 text-small text-muted">
                <CheckCircleIcon size={20} className="mt-0.5 shrink-0" />
                {t("result.links.noFlags")}
              </p>
            )}

            <h4 className="mt-4 font-semibold">{t("result.links.reports")}</h4>
            <ul className="mt-1 space-y-3">
              {c.reputation.map((r, j) => {
                const ref = safeExternalUrl(r.referenceUrl);
                return (
                  <li key={`${r.provider}-${j}`} className="flex gap-2">
                    <StatusIcon status={r.status} />
                    <div className="min-w-0">
                      <p>
                        <span className="font-semibold">{r.provider}:</span> {t(STATUS_KEY[r.status])}
                      </p>
                      {r.status !== "unavailable" && r.detail && <p className="text-small text-muted">{r.detail}</p>}
                      {r.threatTypes.length > 0 && (
                        <p className="text-small text-muted">
                          {t("result.provider.threats", { list: r.threatTypes.join(", ") })}
                        </p>
                      )}
                      {ref && (
                        <a
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-small font-semibold"
                        >
                          {t("result.provider.report")} <ExternalIcon size={16} />
                          <span className="sr-only">{t("common.opensNewTab")}</span>
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}
