"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";

const PAGES: ReadonlyArray<{ href: string; label: UiKey }> = [
  { href: "/about", label: "footer.about" },
  { href: "/privacy", label: "footer.privacy" },
  { href: "/terms", label: "footer.terms" },
  { href: "/contact", label: "footer.contact" },
  { href: "/disclaimer", label: "footer.disclaimer" },
];

const linkClass = "inline-flex min-h-[2.75rem] items-center";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer-surface mt-16 border-t border-line">
      <div className="container-page grid gap-8 py-10 md:grid-cols-3">
        <div>
          <Image
            src="/brand/astra-logo-640.webp"
            alt="ASTRA अस्त्र"
            width={160}
            height={160}
          className="h-auto w-32 rounded-xl bg-white shadow-sm"
          />
        </div>
        <nav aria-labelledby="footer-pages">
          <h2 id="footer-pages" className="mb-2 text-h3">
            {t("footer.pages")}
          </h2>
          <ul>
            {PAGES.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className={linkClass}>
                  {t(p.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <section aria-labelledby="footer-resources">
          <h2 id="footer-resources" className="mb-2 text-h3">
            {t("footer.resources")}
          </h2>
          <ul>
            <li>
              <a href="https://cybercrime.gov.in/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                {t("footer.ncrp")}
                <span className="sr-only"> {t("common.opensNewTab")}</span>
              </a>
            </li>
            <li>
              <a href="tel:1930" className={linkClass}>
                {t("footer.helpline")}
              </a>
            </li>
            <li>
              <a href="https://sancharsaathi.gov.in/" target="_blank" rel="noopener noreferrer" className={linkClass}>
                {t("footer.chakshu")}
                <span className="sr-only"> {t("common.opensNewTab")}</span>
              </a>
            </li>
          </ul>
        </section>
      </div>
      <div className="border-t border-line">
        <p className="container-page py-5 text-small text-muted">{t("footer.proto")}</p>
      </div>
    </footer>
  );
}
