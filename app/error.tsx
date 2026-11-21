"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLang } from "@/lib/client/language";
import { WarningIcon } from "@/components/ui/icons";

/**
 * Shown when a page crashes while rendering. It is a friendly dead end rather than a raw error:
 * nothing the person typed is kept, and the message says so. The error itself is not shown.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLang();

  useEffect(() => {
    // Move focus to the message so keyboard and screen-reader users notice it.
    document.getElementById("error-title")?.focus();
  }, []);

  return (
    <div className="container-page py-16">
      <div role="alert" className="card mx-auto max-w-2xl">
        <WarningIcon size={40} className="text-danger" />
        <h1 id="error-title" tabIndex={-1} className="mt-4 outline-none">
          {t("error.title")}
        </h1>
        <p className="mt-3">{t("error.body")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="btn btn-primary w-full sm:w-auto">
            {t("error.retry")}
          </button>
          <Link href="/" className="btn btn-secondary w-full sm:w-auto">
            {t("common.back")}
          </Link>
        </div>
      </div>
    </div>
  );
}
