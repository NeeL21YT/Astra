"use client";

import { useLang } from "@/lib/client/language";
import { ExternalIcon, PhoneIcon } from "@/components/ui/icons";

/** The three official routes, shown on About and Contact. */
export function OfficialResources() {
  const { t } = useLang();
  return (
    <section aria-labelledby="official-res" className="card bg-soft">
      <h2 id="official-res" className="text-h3">
        {t("footer.resources")}
      </h2>
      <ul className="mt-3 space-y-1">
        <li>
          <a
            href="https://cybercrime.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[3rem] items-center gap-2 font-semibold"
          >
            {t("footer.ncrp")} <ExternalIcon size={18} />
            <span className="sr-only">{t("common.opensNewTab")}</span>
          </a>
        </li>
        <li>
          <a href="tel:1930" className="inline-flex min-h-[3rem] items-center gap-2 font-semibold">
            <PhoneIcon size={18} /> {t("footer.helpline")}
          </a>
        </li>
        <li>
          <a
            href="https://sancharsaathi.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[3rem] items-center gap-2 font-semibold"
          >
            {t("footer.chakshu")} <ExternalIcon size={18} />
            <span className="sr-only">{t("common.opensNewTab")}</span>
          </a>
        </li>
      </ul>
    </section>
  );
}
