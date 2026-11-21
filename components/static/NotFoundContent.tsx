"use client";

import { useLang } from "@/lib/client/language";
import { LinkButton } from "@/components/ui/LinkButton";

export function NotFoundContent() {
  const { t } = useLang();
  return (
    <div className="container-narrow py-16">
      <h1>{t("nf.title")}</h1>
      <p className="mt-4 text-lg">{t("nf.body")}</p>
      <div className="mt-8">
        <LinkButton href="/" className="w-full sm:w-auto">
          {t("common.back")}
        </LinkButton>
      </div>
    </div>
  );
}
