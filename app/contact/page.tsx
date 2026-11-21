import type { Metadata } from "next";
import { DocPage } from "@/components/static/DocPage";

export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return (
    <DocPage
      title="contact.title"
      lead="contact.body"
      sections={[{ id: "urgent", title: "contact.urgent.title", body: "contact.urgent.body" }]}
      resources
    />
  );
}
