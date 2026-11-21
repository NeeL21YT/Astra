"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { AnalysisResult } from "@/lib/types";
import { useLang } from "@/lib/client/language";
import { buildShareSummary, copyText, whatsappUrl } from "@/lib/client/share";
import { CheckCircleIcon, CopyIcon, ExternalIcon, ShareIcon } from "@/components/ui/icons";

const noopSubscribe = () => () => {};

/**
 * Privacy-safe family summary. The text is built from the state label,
 * category names, one summary sentence and one action. The user always picks
 * the recipient; ASTRA never sends anything itself.
 */
export function ShareSummaryButton({ result }: { result: AnalysisResult }) {
  const { lang, t } = useLang();
  const summary = useMemo(() => buildShareSummary(result, lang), [result, lang]);
  const canShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const copied = copiedFor === summary;

  async function copy() {
    const ok = await copyText(summary);
    setFailed(!ok);
    setCopiedFor(ok ? summary : null);
  }

  async function share() {
    try {
      await navigator.share({ title: t("share.subject"), text: summary });
    } catch {
      // The person closed the share sheet, or sharing failed. Nothing to do.
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-small text-muted">{t("share.note")}</p>
      <figure>
        <figcaption className="text-small font-semibold">{t("share.preview")}</figcaption>
        <blockquote className="mt-1 whitespace-pre-line break-words rounded-xl border border-line bg-soft p-4 text-small text-ink">
          {summary}
        </blockquote>
      </figure>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canShare && (
          <button type="button" onClick={share} className="btn btn-primary w-full sm:w-auto">
            <ShareIcon size={22} />
            {t("share.button")}
          </button>
        )}
        <a
          href={whatsappUrl(summary)}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn w-full sm:w-auto ${canShare ? "btn-secondary" : "btn-primary"}`}
        >
          {t("share.whatsapp")}
          <ExternalIcon size={20} />
          <span className="sr-only">{t("common.opensNewTab")}</span>
        </a>
        <button type="button" onClick={copy} className="btn btn-secondary w-full sm:w-auto">
          {copied ? <CheckCircleIcon size={22} /> : <CopyIcon size={22} />}
          {copied ? t("share.copied") : t("share.copy")}
        </button>
      </div>
      <p role="status" className={failed ? "text-small font-semibold text-danger-dark" : "sr-only"}>
        {copied ? t("share.copied") : failed ? t("share.copyFailed") : ""}
      </p>
    </div>
  );
}
