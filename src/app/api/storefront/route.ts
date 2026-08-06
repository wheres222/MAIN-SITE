import { NextResponse } from "next/server";
import { getStorefrontData } from "@/lib/sellauth";

// Revalidate at the same cadence as the edge cache
export const revalidate = 300;

/**
 * GET /api/storefront
 *
 * Source precedence (SellAuth → Supabase catalog → demo) lives in
 * getStorefrontData(). It used to be duplicated here, which is how the two
 * paths drifted: this route knew about the Supabase catalog and the shared
 * function didn't, so server-rendered pages served demo products while a
 * client-side fetch of this endpoint served real ones.
 */
export async function GET() {
  const data = await getStorefrontData();

  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
