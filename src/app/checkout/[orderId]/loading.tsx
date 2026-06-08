import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SubpageSkeleton } from "@/components/subpage-skeleton";

export default function CheckoutLoading() {
  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="store" />
      <main className="shell subpage-wrap">
        <SubpageSkeleton rows={4} />
      </main>
      <SiteFooter />
    </div>
  );
}
