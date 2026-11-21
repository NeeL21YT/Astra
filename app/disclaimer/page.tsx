import type { Metadata } from "next";
import { DocPage } from "@/components/static/DocPage";

export const metadata: Metadata = { title: "Disclaimer" };

export default function Page() {
  return (
    <DocPage
      title="disc.title"
      lead="disc.proto"
      sections={[{ id: "list", list: "disc.list" }]}
      resources
    />
  );
}
