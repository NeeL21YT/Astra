import type { Metadata } from "next";
import { NumberChecker } from "@/components/checker/NumberChecker";

export const metadata: Metadata = { title: "Check a phone number" };

export default function Page() {
  return <NumberChecker />;
}
