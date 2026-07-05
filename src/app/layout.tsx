import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Providers } from "@/components/Providers";
import config from "@/lib/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:4210");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: config.site_title,
    template: `%s - ${config.site_title}`,
  },
  description: config.site_description,
  applicationName: config.site_title,
  keywords: [
    "jeux de plateau",
    "board games",
    "collection",
    "ludotheque",
    "liste imprimable",
    "Myludo",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: config.site_title,
    title: config.site_title,
    description: config.site_description,
  },
  twitter: {
    card: "summary_large_image",
    title: config.site_title,
    description: config.site_description,
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: config.site_title,
  description: config.site_description,
  url: siteUrl,
  inLanguage: "fr-FR",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
