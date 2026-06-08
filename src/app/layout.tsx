import type { Metadata, Viewport } from "next";
import { Inter, Raleway } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { PostHogProvider } from "@/components/posthog-provider";
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

const satoshi = localFont({
  src: [
    { path: "../../public/fonts/satoshi/Satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/satoshi/Satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/satoshi/Satoshi-700.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/satoshi/Satoshi-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0d0d",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cheat Paradise",
    template: "%s | Cheat Paradise",
  },
  description:
    "Buy undetected game cheats, hacks, and mods with instant delivery. Trusted by thousands — Rust, Valorant, Fortnite, COD, CS2, Apex & more. 24/7 support.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/branding/LOGO.webp", type: "image/webp" }],
    shortcut: [{ url: "/branding/LOGO.webp", type: "image/webp" }],
    apple: [{ url: "/branding/LOGO.webp", type: "image/webp" }],
  },
  openGraph: {
    title: "Cheat Paradise",
    description:
      "Buy undetected game cheats, hacks, and mods with instant delivery. Trusted by thousands — Rust, Valorant, Fortnite, COD, CS2, Apex & more. 24/7 support.",
    url: siteUrl,
    siteName: "Cheat Paradise",
    type: "website",
    images: [{ url: "/branding/og-banner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cheat Paradise",
    description:
      "Buy undetected game cheats, hacks, and mods with instant delivery. Trusted by thousands — Rust, Valorant, Fortnite, COD, CS2, Apex & more. 24/7 support.",
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
    <html lang="en" className={`${inter.variable} ${satoshi.variable} ${raleway.variable}`}>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <PostHogProvider>{children}</PostHogProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9XTJ5HDH2M"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-9XTJ5HDH2M');`}
        </Script>
      </body>
    </html>
  );
}
