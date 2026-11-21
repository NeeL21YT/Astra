"use client";

import { useLang } from "@/lib/client/language";
import { ShieldMark } from "@/components/ui/icons";

/** Shown only when something was hidden. Displays the exact text that will be sent. */
export function RedactionNotice({ redactions, text, id }: { redactions: number; text: string; id: string }) {
  const { t } = useLang();
  if (redactions <= 0) return null;
  return (
    <div className="mt-4 rounded-xl border-2 border-navy bg-soft p-4" id={id}>
      <p className="flex items-start gap-2 font-semibold text-navy">
        <ShieldMark size={22} className="mt-0.5 shrink-0" />
        <span>{redactions === 1 ? t("redact.one") : t("redact.many", { n: redactions })}</span>
      </p>
      <p className="mt-3 text-small text-muted">{t("redact.willSend")}</p>
      <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-white p-3 font-sans text-small">
        {text}
      </pre>
      <p className="mt-3 text-small text-muted">{t("redact.caveat")}</p>
    </div>
  );
}
