import { NextResponse } from "next/server";
import { getStorefrontData } from "@/lib/sellauth";

// Revalidate at the same cadence as the edge cache so ISR never races SellAuth
export const revalidate = 300;

export async function GET() {
  const data = await getStorefrontData();
  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
