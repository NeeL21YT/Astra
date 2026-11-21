import type { Metadata } from "next";
import { DocPage } from "@/components/static/DocPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <DocPage
      title="privacy.title"
      lead="privacy.proto"
      sections={[
        { id: "accounts", title: "privacy.accounts.title", body: "privacy.accounts.body" },
        { id: "stored", title: "privacy.stored.title", body: "privacy.stored.body" },
        { id: "redact", title: "privacy.redact.title", body: "privacy.redact.body" },
        { id: "leaves", title: "privacy.leaves.title", list: "privacy.leaves.list" },
        { id: "nothing", title: "privacy.nothing.title", body: "privacy.nothing.body" },
        { id: "third", title: "privacy.third.title", body: "privacy.third.body" },
        { id: "share", title: "privacy.share.title", body: "privacy.share.body" },
      ]}
      footerLink={{ href: "/contact", label: "privacy.contact" }}
    />
  );
}
