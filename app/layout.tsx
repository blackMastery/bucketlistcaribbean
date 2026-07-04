import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildRootMetadata,
  getSeoConfig,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets content extend into the notch/home-indicator area so the
  // env(safe-area-inset-*) used by the WhatsApp FAB and mobile book bar work.
  viewportFit: "cover",
  themeColor: "#06090a",
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSeoConfig();
  return buildRootMetadata(site);
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getSeoConfig();

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${montserrat.variable} ${inter.variable}`}
    >
      <body>
        <JsonLd data={[organizationJsonLd(site), websiteJsonLd(site)]} />
        {children}
      </body>
    </html>
  );
}
