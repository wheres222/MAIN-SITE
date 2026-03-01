import { NextResponse } from "next/server";
import { getStorefrontData } from "@/lib/sellauth";

export const runtime = "edge";
export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getStorefrontData();
  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=20, s-maxage=30, stale-while-revalidate=120",
    },
  });
}
