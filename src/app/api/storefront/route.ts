import { NextResponse } from "next/server";
import { getStorefrontData } from "@/lib/sellauth";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getStorefrontData();
  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
