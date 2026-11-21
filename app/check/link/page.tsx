import type { Metadata } from "next";
import { LinkChecker } from "@/components/checker/LinkChecker";

export const metadata: Metadata = { title: "Check a link" };

export default function Page() {
  return <LinkChecker />;
}
