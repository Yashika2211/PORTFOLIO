import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Orbitron } from "next/font/google";
import { profile, skillGroups } from "@/data/portfolio";
import { bootGateScript } from "@/lib/boot";
import "./globals.css";

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

const description = `${profile.headline}. ${profile.tagline} Portfolio of ${profile.name}, based in ${profile.location}.`;

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: { default: `${profile.name} — ${profile.headline}`, template: `%s · ${profile.name}` },
  description,
  keywords: ["Yashika Bhatia", "software engineer", "ML systems", "AI agents", "backend", "portfolio", "Bengaluru"],
  authors: [{ name: profile.name, url: profile.siteUrl }],
  creator: profile.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    title: `${profile.name} — ${profile.headline}`,
    description,
    siteName: profile.name,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.headline}`,
    description,
    creator: "@sarcasmunlimit2",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.headline,
  url: profile.siteUrl,
  email: `mailto:${profile.email}`,
  address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
  alumniOf: { "@type": "CollegeOrUniversity", name: profile.education.school },
  sameAs: profile.links.filter((l) => l.href.startsWith("http")).map((l) => l.href),
  knowsAbout: skillGroups.flatMap((g) => g.skills).slice(0, 25),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootGateScript }} />
        <noscript>
          <style>{`.boot-overlay{display:none!important}`}</style>
        </noscript>
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
        {children}
      </body>
    </html>
  );
}
