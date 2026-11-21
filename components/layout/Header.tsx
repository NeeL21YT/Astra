"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cx } from "@/components/ui/cx";
import { LanguageToggle } from "./LanguageToggle";

const NAV: ReadonlyArray<{ href: string; label: UiKey }> = [
  { href: "/", label: "nav.home" },
  { href: "/how-it-works", label: "nav.how" },
  { href: "/about", label: "nav.about" },
  { href: "/history", label: "nav.history" },
];

export function Header() {
  const { t } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header
      className="site-header sticky top-0 z-30 border-b border-line"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          close();
          document.getElementById("menu-button")?.focus();
        }
      }}
    >
      <div className="container-page flex items-center justify-between gap-3 py-2.5">
        <Link
          href="/"
          onClick={close}
          aria-label={t("brand.home")}
          className="flex min-h-[3rem] shrink-0 items-center gap-2 rounded-lg text-navy no-underline hover:no-underline"
        >
          <Image src="/brand/astra-mark.webp" alt="" width={36} height={40} priority className="h-9 w-auto sm:h-10" />
          <span className="text-[1.2rem] font-extrabold tracking-wide sm:text-[1.35rem]">{t("brand.name")}</span>
          <span lang="hi" className="hidden text-[1.15rem] font-semibold text-muted sm:inline">
            {t("brand.devanagari")}
          </span>
        </Link>

        <nav aria-label={t("nav.main")} className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const current = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cx(
                  "flex min-h-[3rem] items-center rounded-lg px-4 font-semibold no-underline hover:bg-soft hover:no-underline",
                  current ? "text-navy underline decoration-2 underline-offset-8" : "text-ink",
                )}
              >
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link href="/#check" className="btn btn-primary hidden min-h-11 px-5 lg:inline-flex">
            {t("nav.getStarted")}
          </Link>
          <button
            id="menu-button"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex min-h-[3rem] min-w-[3rem] cursor-pointer items-center justify-center rounded-xl border-2 border-navy bg-white text-navy hover:bg-soft lg:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label={t("nav.main")} className="border-t border-line bg-soft lg:hidden">
          <ul className="container-page flex flex-col gap-1 py-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="flex min-h-[3.25rem] items-center rounded-lg px-3 text-lg font-semibold text-ink no-underline hover:bg-white hover:no-underline aria-[current=page]:bg-white aria-[current=page]:text-navy"
                >
                  {t(item.label)}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link href="/#check" onClick={close} className="btn btn-primary w-full">
                {t("nav.getStarted")}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
