import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { SITE_CONFIG } from "@/lib/site-config";
import { getPublicSiteConfig } from "@/server/services/site-settings";

import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSiteConfig();
  return {
    metadataBase: new URL(site.url),
    title: {
      default: site.name,
      template: `%s | ${site.name}`,
    },
    description: site.tagline,
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: site.name,
      title: site.name,
      description: site.tagline,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getPublicSiteConfig().catch(() => ({
    name: SITE_CONFIG.name,
    tagline: SITE_CONFIG.tagline,
    url: SITE_CONFIG.url,
    supportEmail: SITE_CONFIG.supportEmail,
    reviewsEnabled: SITE_CONFIG.reviewsEnabled,
    showSampleDataBadges: SITE_CONFIG.showSampleDataBadges,
  }));

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <AuthSessionProvider>
          <SiteHeader siteName={site.name} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter siteName={site.name} />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
