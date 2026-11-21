import type { Metadata } from "next";
import { DocPage } from "@/components/static/DocPage";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return (
    <DocPage
      title="about.title"
      sections={[
        { id: "name", title: "about.name.title", body: "about.name.body" },
        { id: "what", title: "about.what.title", body: "about.what.body" },
        { id: "cannot", title: "about.cannot.title", list: "about.cannot.list" },
        { id: "proto", title: "about.proto.title", body: "about.proto.body" },
        { id: "providers", title: "about.providers.title", body: "about.providers.body", list: "about.providers.list" },
        { id: "help", title: "about.help.title", body: "about.help.body" },
      ]}
      resources
      footerLink={{ href: "/privacy", label: "footer.privacy" }}
    />
  );
}
