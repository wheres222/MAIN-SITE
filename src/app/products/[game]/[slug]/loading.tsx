import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SubpageSkeleton } from "@/components/subpage-skeleton";

/**
 * Shown INSTANTLY when navigating to /products/[slug] — replaces the
 * old-page hold-and-wait with an immediate skeleton so navigation feels instant.
 */
export default function ProductLoading() {
  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />
      <main className="shell subpage-wrap">
        <SubpageSkeleton rows={5} />
      </main>
      <SiteFooter />
    </div>
  );
}
