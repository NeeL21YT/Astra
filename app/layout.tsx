import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/client/language";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/layout/SkipLink";
import { ForcedDarkNotice } from "@/components/layout/ForcedDarkNotice";

// Inter has no Devanagari glyphs on Google Fonts, so Hindi falls back to Noto
// Sans Devanagari, which is designed to sit well beside Inter.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
});

// Absolute URLs for share previews. On Vercel the production domain is provided automatically.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

const shareTitle = "ASTRA अस्त्र | Check suspicious messages, links and numbers";
const shareDescription =
  "Stay safe from online scams. Check suspicious messages, links, phone numbers and files, with simple explanations in English and Hindi.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    siteName: "ASTRA",
    title: shareTitle,
    description: shareDescription,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ASTRA अस्त्र: stay safe from online scams" }],
  },
  twitter: { card: "summary_large_image", title: shareTitle, description: shareDescription, images: ["/og.png"] },
  title: {
    default: "ASTRA अस्त्र | Check suspicious messages, links and numbers",
    template: "%s | ASTRA अस्त्र",
  },
  description:
    "ASTRA helps you check suspicious messages, links, phone numbers and app files before you trust them. Simple explanations in English and Hindi. A hackathon prototype.",
  manifest: "/manifest.webmanifest",
  applicationName: "ASTRA",
  appleWebApp: { capable: true, title: "ASTRA", statusBarStyle: "default" },
  // Ask dark-mode extensions to leave the page alone: its red/amber/green result colors are tuned for light.
  // Next.js drops meta tags with empty content, so darkreader-lock needs a value (Dark Reader only checks the tag exists).
  other: { "darkreader-lock": "true", nighteye: "disabled" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173B67",
  // "only light" stops the browser's own auto-dark from recoloring the page.
  colorScheme: "only light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${devanagari.variable}`}>
      {/* suppressHydrationWarning: browser extensions (for example ColorZilla's cz-shortcut-listen) add
          attributes to <body> before React loads. This silences only that element's attribute check. */}
      <body suppressHydrationWarning className="flex min-h-screen flex-col">
        <LanguageProvider>
          <SkipLink />
          <ForcedDarkNotice />
          <Header />
          <main id="main-content" tabIndex={-1} className="flex-1">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
