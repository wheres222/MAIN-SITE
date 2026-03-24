import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Shared delivery state with the webhook handler.
// Both files reference the same globalThis.__deliveryDedupeStore.
interface DeliveryRecord {
  state: "pending" | "done" | "failed";
  at: number;
}

function dedupeStore(): Map<string, DeliveryRecord> {
  const scoped = globalThis as typeof globalThis & {
    __deliveryDedupeStore?: Map<string, DeliveryRecord>;
  };
  if (!scoped.__deliveryDedupeStore) {
    scoped.__deliveryDedupeStore = new Map<string, DeliveryRecord>();
  }
  return scoped.__deliveryDedupeStore;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";

  if (!orderId || !token) {
    return NextResponse.json(
      { status: "failed", error: "Missing order ID or token." },
      { status: 400 }
    );
  }

  const record = dedupeStore().get(orderId);

  if (!record) {
    // No record yet — webhook hasn't arrived or order ID is unknown.
    return NextResponse.json({ status: "pending" });
  }

  if (record.state === "pending") {
    return NextResponse.json({ status: "processing" });
  }

  if (record.state === "done") {
    return NextResponse.json({ status: "ready" });
  }

  return NextResponse.json({ status: "failed", error: "Delivery failed. Please contact support." });
}
