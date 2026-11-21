"use client";

import { useLang } from "@/lib/client/language";
import type { Lang } from "@/lib/types";
import { cx } from "@/components/ui/cx";

const OPTIONS: ReadonlyArray<{ lang: Lang; short: "lang.enShort" | "lang.hiShort"; label: "lang.enLabel" | "lang.hiLabel" }> = [
  { lang: "en", short: "lang.enShort", label: "lang.enLabel" },
  { lang: "hi", short: "lang.hiShort", label: "lang.hiLabel" },
];

export function LanguageToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div role="group" aria-label={t("lang.group")} className="inline-flex overflow-hidden rounded-xl border-2 border-navy">
      {OPTIONS.map((o) => {
        const active = lang === o.lang;
        return (
          <button
            key={o.lang}
            type="button"
            lang={o.lang}
            aria-pressed={active}
            aria-label={t(o.label)}
            onClick={() => setLang(o.lang)}
            className={cx(
              "min-h-[3rem] min-w-[2.6rem] cursor-pointer px-2 text-[0.95rem] min-[360px]:min-w-[3.25rem] min-[360px]:px-3 font-semibold transition-colors",
              active ? "bg-navy text-white" : "bg-white text-navy hover:bg-soft",
            )}
          >
            {t(o.short)}
          </button>
        );
      })}
    </div>
  );
}
