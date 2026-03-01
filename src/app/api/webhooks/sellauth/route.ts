import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const FULFILLMENT_API_URL = process.env.FULFILLMENT_API_URL?.trim() || "";
const FULFILLMENT_WEBHOOK_SECRET =
  process.env.FULFILLMENT_WEBHOOK_SECRET?.trim() || "";

export async function POST(request: Request) {
  if (!FULFILLMENT_API_URL) {
    return NextResponse.json(
      {
        success: false,
        message: "Fulfillment API URL is not configured.",
      },
      { status: 503 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid webhook JSON." },
      { status: 400 }
    );
  }

  const target = `${FULFILLMENT_API_URL.replace(/\/$/, "")}/webhooks/sellauth`;

  try {
    const response = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(FULFILLMENT_WEBHOOK_SECRET
          ? { "x-fulfillment-webhook-secret": FULFILLMENT_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = (await response.json()) as {
      success?: boolean;
      message?: string;
      orderId?: string;
      queued?: number;
    };

    return NextResponse.json(
      {
        success: Boolean(data.success),
        message: data.message || "Webhook forwarded.",
        orderId: data.orderId,
        queued: data.queued,
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Forward failed: ${error.message}`
            : "Forward failed.",
      },
      { status: 502 }
    );
  }
}
