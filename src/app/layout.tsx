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
    default: "Cheat Paradise",
    template: "%s | Cheat Paradise",
  },
  description:
    "The #1 cheat marketplace access custom cheats, tools, and enhancements for a better gaming experience",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/branding/site-icon.jpg", type: "image/jpeg" }],
    shortcut: [{ url: "/branding/site-icon.jpg", type: "image/jpeg" }],
    apple: [{ url: "/branding/site-icon.jpg", type: "image/jpeg" }],
  },
  openGraph: {
    title: "Cheat Paradise",
    description:
      "The #1 cheat marketplace access custom cheats, tools, and enhancements for a better gaming experience",
    url: siteUrl,
    siteName: "Cheat Paradise",
    type: "website",
    images: [{ url: "/branding/site-icon.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cheat Paradise",
    description:
      "The #1 cheat marketplace access custom cheats, tools, and enhancements for a better gaming experience",
    images: ["/branding/site-icon.jpg"],
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
