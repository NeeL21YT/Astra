import type { Metadata } from "next";
import { DocPage } from "@/components/static/DocPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Page() {
  return (
    <DocPage
      title="terms.title"
      lead="terms.proto"
      sections={[
        { id: "guidance", title: "terms.guidance.title", body: "terms.guidance.body" },
        { id: "use", title: "terms.use.title", list: "terms.use.list" },
        { id: "asis", title: "terms.asis.title", body: "terms.asis.body" },
        { id: "official", title: "terms.official.title", body: "terms.official.body" },
      ]}
      resources
    />
  );
}
