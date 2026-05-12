import type { Metadata, Viewport } from "next";
import { Roboto, Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/posthog-provider";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "optional",
  variable: "--font-roboto",
  preload: true,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "optional",
  variable: "--font-montserrat",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-inter",
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
    <html lang="en" className={`${roboto.variable} ${montserrat.variable} ${inter.variable}`}>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-9XTJ5HDH2M"></script>
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-9XTJ5HDH2M');` }} />
        <link rel="preconnect" href="https://api.sellauth.com" />
        <link rel="dns-prefetch" href="https://api.sellauth.com" />
        <link rel="preconnect" href="https://cdn.mysellauth.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.mysellauth.com" />
        <link rel="preload" href="/fonts/gilroy/Gilroy-Bold.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/gilroy/Gilroy-SemiBold.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
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
        {/* Discourage casual asset inspection */}
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
          document.addEventListener('keydown', function(e) {
            if (e.key === 'F12') { e.preventDefault(); return false; }
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) { e.preventDefault(); return false; }
            if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); return false; }
          });
        ` }} />
      </body>
    </html>
  );
}
