"use client";

import Link from "next/link";
import { useLang } from "@/lib/client/language";
import { lines, paragraphs } from "@/lib/i18n/ui";
import type { UiKey } from "@/lib/i18n/ui";
import { OfficialResources } from "./OfficialResources";

export type DocSection = {
  id: string;
  title?: UiKey;
  body?: UiKey;
  list?: UiKey;
};

/** Plain, readable page for About, Privacy, Terms, Disclaimer and Contact. */
export function DocPage({
  title,
  lead,
  sections,
  resources = false,
  footerLink,
}: {
  title: UiKey;
  lead?: UiKey;
  sections: DocSection[];
  resources?: boolean;
  footerLink?: { href: string; label: UiKey };
}) {
  const { t } = useLang();
  return (
    <div className="container-narrow py-10 md:py-14">
      <h1>{t(title)}</h1>
      {lead && <p className="mt-4 rounded-xl border border-line bg-soft p-4 text-lg">{t(lead)}</p>}

      <div className="mt-8 space-y-9">
        {sections.map((s) => (
          <section key={s.id} aria-labelledby={s.title ? `sec-${s.id}` : undefined}>
            {s.title && (
              <h2 id={`sec-${s.id}`} className="mb-3">
                {t(s.title)}
              </h2>
            )}
            {s.body && (
              <div className="prose-astra space-y-4">
                {paragraphs(t(s.body)).map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            )}
            {s.list && (
              <ul className={`list-disc space-y-2 pl-6 ${s.body ? "mt-4" : ""}`}>
                {lines(t(s.list)).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {resources && (
        <div className="mt-9">
          <OfficialResources />
        </div>
      )}

      {footerLink && (
        <p className="mt-9">
          <Link href={footerLink.href} className="inline-flex min-h-[3rem] items-center font-semibold">
            {t(footerLink.label)}
          </Link>
        </p>
      )}
    </div>
  );
}
