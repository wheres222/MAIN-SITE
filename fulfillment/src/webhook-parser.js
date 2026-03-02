function asObject(value) {
  return value && typeof value === "object" ? value : {};
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function statusFromPayload(payload) {
  const root = asObject(payload);
  const data = asObject(root.data);
  const invoice = asObject(root.invoice);

  const raw = String(
    firstDefined(root.status, data.status, invoice.status, root.event, root.type) || ""
  ).toLowerCase();

  return raw;
}

function isPaidEvent(payload) {
  const raw = statusFromPayload(payload);
  if (!raw) return true; // allow if provider doesn't send explicit status
  return (
    raw.includes("paid") ||
    raw.includes("complete") ||
    raw.includes("success") ||
    raw.includes("payment_confirmed")
  );
}

function extractOrderId(payload) {
  const root = asObject(payload);
  const data = asObject(root.data);
  const invoice = asObject(root.invoice);

  return String(
    firstDefined(
      root.orderId,
      root.order_id,
      root.invoiceId,
      root.invoice_id,
      data.orderId,
      data.order_id,
      data.invoiceId,
      data.invoice_id,
      invoice.id,
      invoice.invoice_id,
      invoice.invoiceId
    ) || ""
  );
}

function extractItems(payload) {
  const root = asObject(payload);
  const data = asObject(root.data);

  const buckets = [
    root.items,
    root.products,
    root.cart,
    data.items,
    data.products,
    data.cart,
    asObject(root.invoice).items,
    asObject(root.invoice).products,
  ];

  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue;

    const parsed = bucket
      .map((item) => {
        const record = asObject(item);
        const productId = Number(
          firstDefined(
            record.productId,
            record.product_id,
            record.id,
            asObject(record.product).id
          )
        );

        if (!Number.isFinite(productId) || productId <= 0) return null;

        const quantity = Math.max(
          1,
          Number(firstDefined(record.quantity, record.qty, 1)) || 1
        );

        const variantValue = firstDefined(
          record.variantId,
          record.variant_id,
          asObject(record.variant).id
        );
        const variantId =
          variantValue === null ? null : Number(variantValue) || null;

        return {
          sellauthProductId: productId,
          quantity,
          variantId,
        };
      })
      .filter(Boolean);

    if (parsed.length > 0) return parsed;
  }

  const singleProductId = Number(
    firstDefined(root.productId, root.product_id, data.productId, data.product_id)
  );

  if (Number.isFinite(singleProductId) && singleProductId > 0) {
    return [
      {
        sellauthProductId: singleProductId,
        quantity: Math.max(1, Number(firstDefined(root.quantity, data.quantity, 1)) || 1),
        variantId: null,
      },
    ];
  }

  return [];
}

function collectStringValues(value, out, depth = 0, path = "root") {
  if (depth > 6 || value === null || value === undefined) return;

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return;

    const p = path.toLowerCase();
    if (
      p.includes("key") ||
      p.includes("license") ||
      p.includes("code") ||
      p.includes("token") ||
      p.includes("credential") ||
      p.includes("account")
    ) {
      out.push(normalized);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectStringValues(entry, out, depth + 1, `${path}[${index}]`));
    return;
  }

  if (typeof value !== "object") return;

  const record = asObject(value);
  for (const [key, entry] of Object.entries(record)) {
    collectStringValues(entry, out, depth + 1, `${path}.${key}`);
  }
}

function looksLikeDeliverable(value) {
  const lower = value.toLowerCase();

  // Ignore generic status words.
  if (
    ["paid", "processing", "pending", "completed", "success", "ok", "true", "false"].includes(lower)
  ) {
    return false;
  }

  if (lower.length < 6) return false;

  // Accept likely key/code patterns.
  if (/[-_]/.test(value) || /[a-z]/i.test(value) && /\d/.test(value)) return true;

  // Email:pass or user:pass style.
  if (/^[^\s:@]+@[^\s:@]+\.[^\s:@]+:[^\s]+$/.test(value)) return true;

  return false;
}

function extractLicenseKeys(payload) {
  const candidates = [];
  collectStringValues(payload, candidates);

  const unique = [];
  const seen = new Set();
  for (const value of candidates) {
    if (!looksLikeDeliverable(value)) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }

  return unique;
}

function parseWebhook(payload) {
  const orderId = extractOrderId(payload);
  const items = extractItems(payload);
  const licenseKeys = extractLicenseKeys(payload);

  return {
    orderId,
    items,
    licenseKeys,
    paid: isPaidEvent(payload),
    rawStatus: statusFromPayload(payload),
  };
}

module.exports = { parseWebhook };
