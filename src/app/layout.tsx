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

export const metadata: Metadata = {
  title: "CheatParadise Marketplace",
  description:
    "Full marketplace storefront with SellAuth API integration, filtering, cart and checkout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} ${brandFont.variable} ${heroFontManrope.variable} ${heroFontOutfit.variable} ${heroFontSora.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
