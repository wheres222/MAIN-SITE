import { NextResponse } from "next/server";
import { exec } from "node:child_process";

export const dynamic = "force-dynamic";

async function verifyGitHubSignature(
  request: Request,
  body: string
): Promise<boolean> {
  const secret = (process.env.DEPLOY_SECRET || "").trim();
  if (!secret) return false;

  const signature = request.headers.get("x-hub-signature-256") || "";
  if (!signature.startsWith("sha256=")) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );

  const expected =
    "sha256=" +
    [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return signature === expected;
}

export async function POST(request: Request) {
  let body = "";
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const valid = await verifyGitHubSignature(request, body).catch(() => false);
  if (!valid) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Only deploy on pushes to main
  try {
    const payload = JSON.parse(body);
    if (payload.ref && payload.ref !== "refs/heads/main") {
      return NextResponse.json({ skipped: true, reason: "not main branch" });
    }
  } catch {
    // not JSON — still proceed
  }

  // Spawn deploy script in background — don't await it
  exec("bash /root/.openclaw/workspace/MAIN-SITE/scripts/deploy.sh", {
    detached: true,
    stdio: "ignore" as unknown as undefined,
  });

  return NextResponse.json({ deploying: true });
}
