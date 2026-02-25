import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductStatusBoard } from "@/components/product-status-board";
import { getStorefrontData } from "@/lib/sellauth";

export default async function StatusPage() {
  const data = await getStorefrontData();

  return (
    <div className="marketplace-page">
      <SiteHeader activeTab="status" />
      <main className="shell subpage-wrap">
        {data.warnings.length > 0 && (
          <section className="catalog warn-box">
            {data.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </section>
        )}

        <ProductStatusBoard products={data.products} />
      </main>
      <SiteFooter />
    </div>
  );
}
