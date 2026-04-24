import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PostHogProvider } from "@/components/posthog-provider";

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
    icon: [{ url: "/branding/favicon-hat.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/branding/favicon-hat.svg", type: "image/svg+xml" }],
    apple: [{ url: "/branding/favicon-hat.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Cheat Paradise",
    description:
      "Buy undetected game cheats, hacks, and mods with instant delivery. Trusted by thousands — Rust, Valorant, Fortnite, COD, CS2, Apex & more. 24/7 support.",
    url: siteUrl,
    siteName: "Cheat Paradise",
    type: "website",
    images: [{ url: "/branding/LOGO.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cheat Paradise",
    description:
      "Buy undetected game cheats, hacks, and mods with instant delivery. Trusted by thousands — Rust, Valorant, Fortnite, COD, CS2, Apex & more. 24/7 support.",
    images: ["/branding/LOGO.webp"],
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
    name: "CheatParadise",
    url: siteUrl,
    sameAs: [process.env.NEXT_PUBLIC_DISCORD_URL?.trim()].filter(Boolean),
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CheatParadise",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/products?id={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://api.sellauth.com" />
        <link rel="dns-prefetch" href="https://api.sellauth.com" />
        <link rel="icon" href="/branding/favicon-hat.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/branding/favicon-hat.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/branding/favicon-hat.svg" />
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
      </body>
    </html>
  );
}
