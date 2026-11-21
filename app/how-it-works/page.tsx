import type { Metadata } from "next";
import { HowItWorksContent } from "@/components/static/HowItWorksContent";

export const metadata: Metadata = { title: "How It Works" };

export default function Page() {
  return <HowItWorksContent />;
}
