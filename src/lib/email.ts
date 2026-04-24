/**
 * Email notifications via Resend.
 * Set RESEND_API_KEY and RESEND_FROM_EMAIL in env to enable.
 * If unconfigured, emails are logged to console only (dev/staging fallback).
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.RESEND_FROM_EMAIL?.trim()) || "CheatParadise <noreply@cheatparadise.gg>";

  if (!apiKey) {
    console.info("[email] RESEND_API_KEY not set — email suppressed:", payload.subject, "→", payload.to);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: payload.to, subject: payload.subject, html: payload.html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[email] Resend API error:", res.status, text);
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function sendOrderDeliveredEmail(to: string, orderId: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Your order has been delivered — CheatParadise",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:8px">
        <h2 style="color:#a78bfa;margin-top:0">Order Delivered</h2>
        <p>Your order <strong>#${orderId}</strong> has been delivered successfully.</p>
        <p>Log in to your account to view your product keys and delivery details.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/account"
           style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:8px">
          View Order
        </a>
        <p style="margin-top:24px;font-size:12px;color:#64748b">CheatParadise — if you did not place this order, contact support immediately.</p>
      </div>`,
  });
}

export async function sendDepositConfirmedEmail(to: string, amountUsd: number): Promise<void> {
  await sendEmail({
    to,
    subject: "Deposit confirmed — CheatParadise",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:8px">
        <h2 style="color:#a78bfa;margin-top:0">Deposit Confirmed</h2>
        <p>Your crypto deposit of <strong>$${amountUsd.toFixed(2)} USD</strong> has been confirmed and credited to your balance.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/account"
           style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:8px">
          View Balance
        </a>
        <p style="margin-top:24px;font-size:12px;color:#64748b">CheatParadise — if you did not initiate this deposit, contact support immediately.</p>
      </div>`,
  });
}

export async function sendCashoutRequestedEmail(to: string, amountUsd: number, method: string): Promise<void> {
  const methodLabel: Record<string, string> = {
    crypto_btc: "Bitcoin (BTC)",
    crypto_eth: "Ethereum (ETH)",
    crypto_ltc: "Litecoin (LTC)",
    crypto_usdt: "USDT",
  };
  await sendEmail({
    to,
    subject: "Cashout request received — CheatParadise",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#e2e8f0;background:#0f172a;padding:32px;border-radius:8px">
        <h2 style="color:#a78bfa;margin-top:0">Cashout Request Received</h2>
        <p>We received your cashout request for <strong>$${amountUsd.toFixed(2)} USD</strong> via <strong>${methodLabel[method] ?? method}</strong>.</p>
        <p>Requests are typically processed within 24–48 hours. You'll receive a confirmation once it's sent.</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/account"
           style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:8px">
          View Account
        </a>
        <p style="margin-top:24px;font-size:12px;color:#64748b">CheatParadise — if you did not request this cashout, contact support immediately.</p>
      </div>`,
  });
}
