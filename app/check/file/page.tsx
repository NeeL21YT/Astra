import type { Metadata } from "next";
import { FileChecker } from "@/components/checker/FileChecker";

export const metadata: Metadata = { title: "Check a file" };

export default function Page() {
  return <FileChecker />;
}
