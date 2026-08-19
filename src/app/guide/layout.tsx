import type { Metadata } from "next";

/**
 * The guide page is a client component, so it cannot export metadata itself —
 * which meant it inherited the site defaults and shared both its title and its
 * meta description with the homepage. That was the duplicate-description pair
 * in the audit, and the reason its title said nothing about guides.
 */
export const metadata: Metadata = {
  title: "Setup Guides — Installation, Secure Boot and Loader Troubleshooting",
  description:
    "Step-by-step setup guides for every product: installation, Secure Boot, driver conflicts and the fixes for loaders that will not start.",
  alternates: { canonical: "/guide" },
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
