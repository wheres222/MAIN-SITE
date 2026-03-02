import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const FULFILLMENT_API_URL = process.env.FULFILLMENT_API_URL?.trim() || "";
const FULFILLMENT_API_TOKEN = process.env.FULFILLMENT_API_TOKEN?.trim() || "";

export async function GET(request: Request) {
  if (!FULFILLMENT_API_URL) {
    return NextResponse.json(
      { success: false, message: "Fulfillment API is not configured." },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId")?.trim() || "";

  if (!orderId) {
    return NextResponse.json(
      { success: false, message: "orderId is required." },
      { status: 400 }
    );
  }

  const target = `${FULFILLMENT_API_URL.replace(/\/$/, "")}/orders/${encodeURIComponent(orderId)}`;

  try {
    const response = await fetch(target, {
      headers: {
        ...(FULFILLMENT_API_TOKEN
          ? { Authorization: `Bearer ${FULFILLMENT_API_TOKEN}` }
          : {}),
      },
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      success?: boolean;
      message?: string;
      order?: {
        orderId: string;
        status: string;
        updatedAt?: string;
        licenseKeys?: string[];
        lastError?: string;
      };
    };

    if (!response.ok || !payload.success || !payload.order) {
      return NextResponse.json(
        {
          success: false,
          message: payload.message || "Order not found in fulfillment service.",
        },
        { status: response.status || 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        orderId: payload.order.orderId,
        status: payload.order.status,
        updatedAt: payload.order.updatedAt,
        licenseKeys: payload.order.licenseKeys || [],
        lastError: payload.order.lastError,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Fulfillment service error: ${error.message}`
            : "Fulfillment service request failed.",
      },
      { status: 502 }
    );
  }
}
