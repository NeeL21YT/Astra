"use client";

import { useId } from "react";
import { useLang } from "@/lib/client/language";
import { ExternalIcon, PhoneIcon } from "@/components/ui/icons";

/**
 * Always visible, visually separate from the verdict. No deadlines or promises:
 * it only points to the official routes and says which one fits which case.
 */
export function LostMoneyPanel() {
  const { t } = useLang();
  const titleId = useId(); // unique even if several results are on one page
  return (
    <section aria-labelledby={titleId} className="overflow-hidden rounded-2xl border-4 border-navy bg-white">
      <h3 id={titleId} className="bg-navy px-5 py-3 text-h2 text-white sm:px-7">
        {t("lost.title")}
      </h3>
      <div className="space-y-5 p-5 sm:p-7">
        <p className="text-lg font-semibold">{t("lost.step1")}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="tel:1930" className="btn btn-primary w-full sm:w-auto">
            <PhoneIcon size={22} />
            <span>
              {t("lost.call")}
              <span className="block text-small font-normal">{t("lost.callNote")}</span>
            </span>
          </a>
          <a
            href="https://cybercrime.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-full sm:w-auto"
          >
            {t("lost.portal")}
            <ExternalIcon size={20} />
            <span className="sr-only">{t("common.opensNewTab")}</span>
          </a>
        </div>

        <div className="border-t border-line pt-4">
          <h4 className="font-semibold">{t("lost.chakshu.title")}</h4>
          <p className="mt-1">{t("lost.chakshu")}</p>
          <a
            href="https://sancharsaathi.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-[3rem] items-center gap-2 font-semibold"
          >
            {t("lost.chakshu.link")}
            <ExternalIcon size={18} />
            <span className="sr-only">{t("common.opensNewTab")}</span>
          </a>
        </div>
        <p className="text-small text-muted">{t("lost.verify")}</p>
      </div>
    </section>
  );
}
