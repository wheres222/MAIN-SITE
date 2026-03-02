import type { Metadata } from "next";
import { Manrope, Montserrat, Outfit, Plus_Jakarta_Sans, Sora } from "next/font/google";
import "./globals.css";

const headingFont = Plus_Jakarta_Sans({
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
});

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const brandFont = Montserrat({
  variable: "--font-brand",
  weight: ["800"],
  subsets: ["latin"],
});

const heroFontManrope = Manrope({
  variable: "--font-hero-manrope",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const heroFontOutfit = Outfit({
  variable: "--font-hero-outfit",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const heroFontSora = Sora({
  variable: "--font-hero-sora",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://cheatparadise.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CheatParadise | Cheap Gaming Marketplace",
    template: "%s | CheatParadise",
  },
  description:
    "Buy affordable gaming accounts, mods, tools, and enhancements with instant delivery and secure checkout.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CheatParadise | Cheap Gaming Marketplace",
    description:
      "Affordable gaming products with fast delivery, secure checkout, and active support.",
    url: siteUrl,
    siteName: "CheatParadise",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CheatParadise | Cheap Gaming Marketplace",
    description:
      "Affordable gaming products with fast delivery, secure checkout, and active support.",
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
      <body
        className={`${headingFont.variable} ${bodyFont.variable} ${brandFont.variable} ${heroFontManrope.variable} ${heroFontOutfit.variable} ${heroFontSora.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
