import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultView } from "@/components/result/ResultView";
import { MOCK_RESULTS } from "@/lib/mock/results";

export const metadata: Metadata = { title: "Result preview (development only)", robots: { index: false } };

/** Development-only page that shows ResultView in every state with mock data. */
export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="container-narrow py-10">
      <h1>Result preview</h1>
      <p className="mt-2 text-muted">
        Development only. These are hand-written mock results, not output from the engine. Use the language toggle in
        the header to check Hindi.
      </p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {MOCK_RESULTS.map((m) => (
          <li key={m.id}>
            <a href={`#${m.id}`} className="inline-flex min-h-[2.75rem] items-center">
              {m.id}
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-8 space-y-16">
        {MOCK_RESULTS.map((m) => (
          <section key={m.id} id={m.id} aria-label={m.label} className="scroll-mt-4">
            <p className="mb-3 rounded-lg bg-soft p-3 text-small font-semibold">{m.label}</p>
            <ResultView result={m.result} />
          </section>
        ))}
      </div>
    </div>
  );
}
