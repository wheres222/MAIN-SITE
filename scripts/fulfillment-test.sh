#!/usr/bin/env bash
set -euo pipefail

# Safe local fulfillment simulation (no provider spend)
# Usage:
#   ./scripts/fulfillment-test.sh [ORDER_ID]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/fulfillment/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

ORDER_ID="${1:-TEST-$(date +%s)}"
KEY="MOCK-KEY-$(date +%s)-$RANDOM"

if [[ -z "${FULFILLMENT_WEBHOOK_SECRET:-}" ]]; then
  echo "FULFILLMENT_WEBHOOK_SECRET missing in fulfillment/.env"
  exit 1
fi

echo "Submitting safe paid webhook test..."
RESP=$(curl -sS -X POST "http://127.0.0.1:8788/webhooks/sellauth" \
  -H "x-fulfillment-webhook-secret: ${FULFILLMENT_WEBHOOK_SECRET}" \
  -H 'content-type: application/json' \
  --data "{\"event\":\"payment_completed\",\"order_id\":\"${ORDER_ID}\",\"status\":\"paid\",\"delivery\":{\"license_key\":\"${KEY}\"}}")

echo "Webhook response:"
echo "$RESP"

echo
echo "Order status (worker):"
if [[ -n "${FULFILLMENT_ADMIN_TOKEN:-}" ]]; then
  curl -sS "http://127.0.0.1:8788/orders/${ORDER_ID}" -H "authorization: Bearer ${FULFILLMENT_ADMIN_TOKEN}"
else
  curl -sS "http://127.0.0.1:8788/orders/${ORDER_ID}"
fi

echo
SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://cheatparadise.com}"
echo "Preview on site: ${SITE_URL}/orders?orderId=${ORDER_ID}"
