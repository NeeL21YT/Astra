"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLang } from "@/lib/client/language";
import type { UiKey } from "@/lib/i18n/ui";
import { SAMPLES } from "@/lib/samples";
import {
  ArrowRightIcon,
  FileIcon,
  HelpIcon,
  LinkIcon,
  LockIcon,
  MessageIcon,
  PhoneIcon,
} from "@/components/ui/icons";
import { LinkButton } from "@/components/ui/LinkButton";

export function Hero() {
  const { t } = useLang();
  return (
    <section aria-labelledby="hero-title" className="hero-surface border-b border-navy-dark">
      <div className="container-page flex items-center justify-between gap-10 py-14 md:py-20">
        <div className="max-w-3xl">
          <h1 id="hero-title" className="max-w-2xl text-white">{t("home.hero.title")}</h1>
          <p className="mt-5 max-w-2xl text-lg text-sky">{t("home.hero.desc")}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/#check" className="w-full sm:w-auto">
              {t("home.hero.cta")}
              <ArrowRightIcon size={20} />
            </LinkButton>
            <LinkButton href="/how-it-works" variant="secondary" className="hero-secondary w-full sm:w-auto">
              {t("home.hero.secondary")}
            </LinkButton>
          </div>
          <div className="hero-notice mt-9 flex max-w-2xl gap-3 p-4">
            <LockIcon className="mt-1 shrink-0 text-sky" />
            <p className="text-small">{t("home.safetyNotice")}</p>
          </div>
        </div>
        <div className="hero-emblem hidden w-72 shrink-0 lg:block xl:w-80">
          <Image
            src="/brand/astra-logo-640.webp"
            alt="ASTRA अस्त्र"
            width={320}
            height={320}
            priority
            className="relative z-10 h-auto w-full rounded-xl bg-white"
          />
        </div>
      </div>
    </section>
  );
}

function CheckCard({
  icon,
  title,
  desc,
  btn,
  href,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  btn: string;
  href: string;
}) {
  return (
    <li className="card check-card flex flex-col">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-soft text-navy">{icon}</span>
      <h3 className="text-h2">{title}</h3>
      <p className="mt-2 flex-1 text-small text-muted">{desc}</p>
      <LinkButton href={href} className="mt-5 w-full">
        {btn}
      </LinkButton>
    </li>
  );
}

export function CheckSection() {
  const { t } = useLang();
  return (
    <section id="check" aria-labelledby="check-title" className="container-page scroll-mt-4 py-14 md:py-20">
      <h2 id="check-title" className="mb-2 max-w-xl">
        {t("home.check.title")}
      </h2>
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <CheckCard
          icon={<MessageIcon size={32} />}
          title={t("home.card.message.title")}
          desc={t("home.card.message.desc")}
          btn={t("home.card.message.btn")}
          href="/check/message"
        />
        <CheckCard
          icon={<LinkIcon size={32} />}
          title={t("home.card.link.title")}
          desc={t("home.card.link.desc")}
          btn={t("home.card.link.btn")}
          href="/check/link"
        />
        <CheckCard
          icon={<PhoneIcon size={32} />}
          title={t("home.card.number.title")}
          desc={t("home.card.number.desc")}
          btn={t("home.card.number.btn")}
          href="/check/number"
        />
      </ul>

      <p className="mt-6">
        <Link href="/check/file" className="inline-flex min-h-[3rem] items-center gap-2 font-semibold">
          <FileIcon size={22} />
          {t("home.file.link")}
        </Link>
      </p>

      <div className="mt-8">
        <h3 id="samples-title">{t("home.samples.title")}</h3>
        <p className="mt-1 max-w-2xl text-small text-muted">{t("home.samples.intro")}</p>
        <ul aria-labelledby="samples-title" className="mt-4 grid gap-3 md:grid-cols-3">
          {SAMPLES.map((s) => (
            <li key={s.id}>
              <Link
                href={`/check/message?sample=${s.id}`}
                className="sample-card flex h-full min-h-[3.25rem] flex-col gap-1 rounded-xl border border-line bg-white p-4 no-underline hover:bg-soft hover:no-underline"
              >
                <span className="font-semibold text-navy">{t(`sample.${s.id}.label` as UiKey)}</span>
                <span className="text-small text-muted">{t(`sample.${s.id}.expect` as UiKey)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HowSteps() {
  const { t } = useLang();
  const steps = [1, 2, 3] as const;
  return (
    <section aria-labelledby="how-title" className="steps-surface border-y border-line">
      <div className="container-page py-14 md:py-20">
        <h2 id="how-title" className="mb-6">
          {t("home.how.title")}
        </h2>
        <ol className="grid gap-5 md:grid-cols-3">
          {steps.map((n) => (
            <li key={n} className="card step-card">
              <span
                aria-hidden="true"
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-navy text-lg font-bold text-white"
              >
                {n}
              </span>
              <h3>{t(`home.how.${n}.title` as UiKey)}</h3>
              <p className="mt-1 text-small text-muted">{t(`home.how.${n}.body` as UiKey)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6">
          <Link href="/how-it-works" className="inline-flex min-h-[3rem] items-center gap-2 font-semibold">
            {t("home.how.more")}
            <ArrowRightIcon size={20} />
          </Link>
        </p>
      </div>
    </section>
  );
}

export function SafetyTips() {
  const { t } = useLang();
  const tips = [1, 2, 3, 4, 5] as const;
  return (
    <section aria-labelledby="tips-title" className="container-page py-14 md:py-20">
      <h2 id="tips-title" className="mb-6">
        {t("home.tips.title")}
      </h2>
      <ul className="grid gap-4 md:grid-cols-2">
        {tips.map((n) => (
          <li key={n} className="tip-card flex gap-3 rounded-xl border border-line bg-white p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft"><HelpIcon className="text-navy" /></span>
            <span>{t(`home.tips.${n}` as UiKey)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 flex gap-3 text-small text-muted">
        <LockIcon size={20} className="mt-0.5 shrink-0" />
        <span>{t("home.privacyNote")}</span>
      </p>
    </section>
  );
}
