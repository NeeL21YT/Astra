"use client";

import type { CheckStatus } from "@/lib/types";
import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";
import { CheckCircleIcon, DashCircleIcon, WarningIcon } from "@/components/ui/icons";

const NAME: Record<CheckStatus["id"], UiKey> = {
  rules: "check.rules",
  ai: "check.ai",
  url_reputation: "check.url_reputation",
  file_reputation: "check.file_reputation",
  phone_reputation: "check.phone_reputation",
};

function Icon({ status }: { status: CheckStatus["status"] }) {
  if (status === "ran") return <CheckCircleIcon size={22} className="shrink-0 text-success-dark" />;
  if (status === "unavailable") return <WarningIcon size={22} className="shrink-0 text-ink" />;
  return <DashCircleIcon size={22} className="shrink-0 text-muted" />;
}

/** Lists every check. "Unavailable" is visibly different from "completed". */
export function ChecksStrip({ checks }: { checks: CheckStatus[] }) {
  const { lang, t } = useLang();
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {checks.map((c) => (
          <li
            key={c.id}
            className={`flex gap-3 rounded-xl border p-3 ${
              c.status === "unavailable" ? "border-2 border-warning bg-warning-soft" : "border-line bg-white"
            }`}
          >
            <Icon status={c.status} />
            <div className="min-w-0">
              <p className="font-semibold">{t(NAME[c.id])}</p>
              <p className="text-small text-muted">
                {t(`check.status.${c.status}` as UiKey)}
              </p>
              {c.note && <p className="text-small text-muted">{c.note[lang]}</p>}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-small text-muted">{t("result.checks.legend")}</p>
    </>
  );
}
