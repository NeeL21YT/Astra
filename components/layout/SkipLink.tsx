"use client";

import { useLang } from "@/lib/client/language";

export function SkipLink() {
  const { t } = useLang();
  return (
    <a
      href="#main-content"
      className="sr-only rounded-lg bg-navy px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50"
    >
      {t("nav.skip")}
    </a>
  );
}
