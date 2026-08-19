import type { Metadata, Viewport } from "next";
import { Inter, Raleway } from "next/font/google";
import Script from "next/script";
import { AssistifyScript } from "@assistifychat/widget/react";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { DISCORD_INVITE_URL } from "@/lib/links";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

// Brand font — matches gamesense's wordmark stack (Raleway, with Helvetica
// Neue / Arial as fallbacks). Used for the CheatParadise wordmark + branding.
const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-raleway",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

// Assistify support chat — only rendered when a widget id is configured.
const assistifyWidgetId = process.env.NEXT_PUBLIC_ASSISTIFY_WIDGET_ID?.trim();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050506",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cheat Paradise — Undetected Rust, CS2 & ARC Raiders Cheats",
    template: "%s | Cheat Paradise",
  },
  description:
    "Buy undetected game cheats with instant delivery. Rust cheats, CS2 cheats, ARC Raiders cheats, Fortnite, COD, Apex & more — trusted by thousands. 24/7 support.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/branding/LOGO.webp", type: "image/webp" }],
    shortcut: [{ url: "/branding/LOGO.webp", type: "image/webp" }],
    apple: [{ url: "/branding/LOGO.webp", type: "image/webp" }],
  },
  openGraph: {
    title: "Cheat Paradise — Undetected Rust, CS2 & ARC Raiders Cheats",
    description:
      "Buy undetected game cheats with instant delivery. Rust cheats, CS2 cheats, ARC Raiders cheats, Fortnite, COD, Apex & more — trusted by thousands. 24/7 support.",
    url: siteUrl,
    siteName: "Cheat Paradise",
    type: "website",
    images: [{ url: "/branding/og-banner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cheat Paradise — Undetected Rust, CS2 & ARC Raiders Cheats",
    description:
      "Buy undetected game cheats with instant delivery. Rust cheats, CS2 cheats, ARC Raiders cheats, Fortnite, COD, Apex & more — trusted by thousands. 24/7 support.",
    images: ["/branding/og-banner.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cheat Paradise",
    alternateName: "CheatParadise",
    url: siteUrl,
    logo: `${siteUrl}/branding/LOGO.webp`,
    description:
      "Cheat Paradise sells undetected gaming software for Rust, ARC Raiders, Rainbow Six Siege, Fortnite and more, with instant delivery and 24/7 support.",
    sameAs: [
      DISCORD_INVITE_URL,
      "https://www.youtube.com/@franprado",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "cheatparadisesupport@gmail.com",
      availableLanguage: ["English"],
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Cheat Paradise",
    alternateName: "CheatParadise",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={`${inter.variable} ${raleway.variable}`}>
      <head>
        <link rel="preconnect" href="https://api.sellauth.com" />
        <link rel="dns-prefetch" href="https://api.sellauth.com" />
        <link rel="preconnect" href="https://cdn.mysellauth.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.mysellauth.com" />
        <link rel="icon" href="/branding/LOGO.webp" type="image/webp" />
        <link rel="shortcut icon" href="/branding/LOGO.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/branding/LOGO.webp" />
      </head>
      <body className="antialiased">
        {/* Skip-to-content link — visually hidden until focused by keyboard */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
        {/* lazyOnload keeps gtag (and its head preload hint) entirely off the
            critical path — it loads after everything else is done. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9XTJ5HDH2M"
          strategy="lazyOnload"
        />
        <Script id="gtag-init" strategy="lazyOnload">
          {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-9XTJ5HDH2M');`}
        </Script>
        {/* Vercel Analytics. On a Vercel deployment the script is served from
            /_vercel/insights/script.js and beacons go to /_vercel/insights/view,
            both same-origin. Everywhere else — including local dev — it falls
            back to va.vercel-scripts.com, which is why that host is in the CSP
            script-src. Without it the console reports a blocked script and no
            data is collected outside production.

            With PostHog removed this and gtag are the only analytics left. */}
        <Analytics />
        {assistifyWidgetId && <AssistifyScript widgetId={assistifyWidgetId} />}
      </body>
    </html>
  );
}
