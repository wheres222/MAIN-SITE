import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeEnvSecret(value: string | undefined): string {
  if (!value) return "";

  let normalized = value.trim();

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  normalized = normalized.replace(/\\\|/g, "|");

  return normalized;
}

const SELLAUTH_BASE_URL =
  normalizeEnvSecret(process.env.SELLAUTH_API_BASE_URL) || "https://api.sellauth.com";
const SELLAUTH_SHOP_ID = normalizeEnvSecret(process.env.SELLAUTH_SHOP_ID) || "";
const SELLAUTH_API_KEY = normalizeEnvSecret(process.env.SELLAUTH_API_KEY) || "";

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
