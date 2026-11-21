"use client";

import { useState, useSyncExternalStore } from "react";
import { useLang } from "@/lib/client/language";
import { detectForcedDark, subscribeForcedDark } from "@/lib/client/forcedDark";

const getSnapshot = () => detectForcedDark(document);
const getServerSnapshot = () => false;

/** Shown only when a dark-mode extension is recoloring the page, since that can change how a warning looks. */
export function ForcedDarkNotice() {
  const { t } = useLang();
  const detected = useSyncExternalStore(subscribeForcedDark, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);
  if (!detected || dismissed) return null;
  return (
    <div role="status" className="border-b border-warning bg-warning-soft px-4 py-3 text-small text-ink">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p>{t("darkNotice.body")}</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg border border-ink px-4 py-2 font-semibold hover:bg-white"
        >
          {t("darkNotice.dismiss")}
        </button>
      </div>
    </div>
  );
}
