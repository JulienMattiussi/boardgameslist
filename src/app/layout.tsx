import type { Metadata } from "next";
import config from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: config.site_title,
  description: config.site_description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
