import { NextResponse, type NextRequest } from "next/server";
import { getStorefrontData } from "@/lib/sellauth";
import { productHref, productSlugFromName } from "@/lib/product-route";

export const revalidate = 300;

/**
 * A single segment under /products. Nothing renders here — both cases are
 * redirects:
 *
 *   /products/ancient   a legacy product URL from before the game segment
 *                       existed → 308 to /products/{game}/{leaf}
 *
 *   /products/rust      a game on its own → 308 to /categories/{game}, which
 *                       already carries the landing copy and FAQ schema, so
 *                       authority consolidates there instead of splitting
 *                       across a thinner duplicate
 *
 * This is a Route Handler rather than a page for one reason: it has to emit a
 * real HTTP 308. permanentRedirect() inside a page component is delivered in
 * the streamed RSC payload — the browser follows it, but the response is a 200
 * with no Location header, so a crawler sees a normal page and passes no link
 * equity to the destination. Redirects that exist for SEO have to happen at
 * the HTTP layer.
 *
 * Product lookup runs first: if a product name and a game collide, the
 * specific product is the more useful destination.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ game: string }> }
) {
  const { game } = await params;
  const segment = decodeURIComponent(game).toLowerCase();
  const origin = request.nextUrl.origin;

  try {
    const storefront = await getStorefrontData();
    const legacyMatch = storefront.products.find(
      (p) => productSlugFromName(p.name, p.id) === segment
    );
    if (legacyMatch) {
      return NextResponse.redirect(new URL(productHref(legacyMatch), origin), 308);
    }
  } catch {
    // Storefront unavailable — fall through to the category redirect, which is
    // the right destination for a genuine game segment anyway.
  }

  return NextResponse.redirect(new URL(`/categories/${segment}`, origin), 308);
}
