import type { Metadata } from "next";
import { Suspense } from "react";
import { MessageCheckerLoader } from "@/components/checker/MessageChecker";
import { CheckerFallback } from "@/components/checker/CheckerShell";

export const metadata: Metadata = { title: "Check a message" };

export default function Page() {
  // The loader reads the query string (sample or shared text), so it needs Suspense.
  return (
    <Suspense fallback={<CheckerFallback />}>
      <MessageCheckerLoader />
    </Suspense>
  );
}
