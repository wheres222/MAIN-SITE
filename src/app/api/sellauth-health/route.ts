import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SELLAUTH_BASE_URL =
  process.env.SELLAUTH_API_BASE_URL?.trim() || "https://api.sellauth.com";
const SELLAUTH_SHOP_ID = process.env.SELLAUTH_SHOP_ID?.trim() || "";
const SELLAUTH_API_KEY = process.env.SELLAUTH_API_KEY?.trim() || "";

export async function GET() {
  const configured = Boolean(SELLAUTH_SHOP_ID && SELLAUTH_API_KEY);

  if (!configured) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message: "Missing SELLAUTH_SHOP_ID or SELLAUTH_API_KEY",
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${SELLAUTH_BASE_URL}/v1/shops/${SELLAUTH_SHOP_ID}/payment-methods`,
      {
        headers: {
          Authorization: `Bearer ${SELLAUTH_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          configured: true,
          status: response.status,
          message:
            (body as { message?: string })?.message ||
            "SellAuth health check failed",
          hint:
            response.status === 401
              ? "API key invalid/expired, wrong shop ID, or key not scoped for this shop"
              : undefined,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      status: response.status,
      message: "SellAuth authentication looks good",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        message: error instanceof Error ? error.message : "Network error",
      },
      { status: 500 }
    );
  }
}
