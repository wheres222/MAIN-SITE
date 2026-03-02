# Fulfillment Worker (VPS 24/7)

This service runs on your VPS and automates provider purchases after a paid SellAuth order.

## What it does

1. Receives SellAuth webhook (`/webhooks/sellauth`) for paid orders
2. Creates fulfillment jobs per purchased item
3. Uses provider adapter (Playwright-ready) to buy from supplier
4. Extracts license key(s)
5. Stores order status + keys locally
6. Optionally notifies your website callback endpoint

## Why this is separate from Next.js/Cloudflare

- Browser automation (Playwright) should run on VPS, not on edge routes
- 24/7 background worker + retries + queue are easier/stable on VPS
- Faster to add new providers with adapter templates

## Files

- `fulfillment/src/server.js` - API + queue processor
- `fulfillment/src/processor.js` - worker loop and retry logic
- `fulfillment/src/state-store.js` - local persistent state (`fulfillment/state/state.json`)
- `fulfillment/src/adapters/` - provider automation adapters
- `fulfillment/config/providers.example.json` - mapping template

## Quick start

```bash
cd MAIN-SITE
cp fulfillment/config/providers.example.json fulfillment/config/providers.json
npm run fulfillment:start
```

Health check:

```bash
curl http://127.0.0.1:8788/health
```

## Required env vars

- `FULFILLMENT_ADMIN_TOKEN` - protects admin/manual endpoints
- `FULFILLMENT_WEBHOOK_SECRET` - optional webhook secret check
- `FULFILLMENT_MAPPING_FILE` - defaults to `fulfillment/config/providers.json`

Optional:

- `FULFILLMENT_HOST` - default `127.0.0.1`
- `FULFILLMENT_PORT` - default `8788`
- `FULFILLMENT_CONCURRENCY` - default `1`
- `FULFILLMENT_MAX_ATTEMPTS` - default `3`
- `FULFILLMENT_NOTIFY_URL` - website callback URL
- `FULFILLMENT_NOTIFY_TOKEN` - auth for callback

Provider check env (Desync API):
- `DESYNC_API_BASE_URL` (example: `https://api.reselling.pro`)
- `DESYNC_API_KEY`
- `DESYNC_AUTH_MODE` (`bearer` | `x-api-key` | `apikey` | `query`)
- `DESYNC_HEALTH_PATH` (default: `/api/apikeys/seller`)

## SellAuth webhook target

Set SellAuth webhook URL to:

`https://<your-vps-domain-or-tunnel>/webhooks/sellauth?secret=<FULFILLMENT_WEBHOOK_SECRET>`

(or use reverse proxy to `http://127.0.0.1:8788/webhooks/sellauth`)

## Mapping products to providers

Edit `fulfillment/config/providers.json`:

```json
{
  "mappings": [
    {
      "sellauthProductId": 632330,
      "provider": "demo",
      "providerProductId": "MAILS_GMX",
      "coin": "LTC",
      "minQuantity": 25
    }
  ]
}
```

## Add a real provider fast

1. Copy `fulfillment/src/adapters/playwright-template.js`
2. Implement selectors and purchase flow
3. Register adapter in `fulfillment/src/adapters/index.js`
4. Point product mapping to your adapter key

### Included test adapter: disconnectcheats

A starter adapter exists at:
- `fulfillment/src/adapters/disconnectcheats.js`

It currently runs in safe `testMode` by default:
- Scrapes product page metadata
- Captures screenshot artifact
- Returns test keys (no real purchase)

To manual test:

```bash
curl -X POST http://127.0.0.1:8788/jobs/manual \
  -H "Authorization: Bearer <FULFILLMENT_ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  --data '{
    "orderId":"DC-TEST-1",
    "sellauthProductId":999001,
    "quantity":1,
    "provider":"disconnectcheats",
    "providerProductId":"https://disconnectcheats.com/store/product/19-exception-hwid-spoofer/"
  }'
```

## Useful endpoints

- `GET /health` - service health
- `POST /webhooks/sellauth` - webhook receiver
- `POST /jobs/manual` - manual test enqueue (admin token)
- `GET /orders/:orderId` - order fulfillment status
- `GET /jobs?limit=50` - latest jobs (admin token)
- `GET /providers/desync/check` - test provider API auth/connectivity (admin token)

## systemd (recommended)

Worker service unit is provided at:

- `fulfillment/systemd/main-site-fulfillment.service`

Install:

```bash
sudo cp fulfillment/systemd/main-site-fulfillment.service /etc/systemd/system/main-site-fulfillment.service
sudo systemctl daemon-reload
sudo systemctl enable --now main-site-fulfillment.service
sudo systemctl status main-site-fulfillment.service
```

## Safer public exposure: Cloudflare Tunnel

Use Cloudflare Tunnel so fulfillment stays localhost-only and still reachable from your website.

1) In Cloudflare Zero Trust, create a tunnel and public hostname:
- Hostname: `fulfill.cheatparadise.com`
- Service: `http://127.0.0.1:8788`

2) Save tunnel token to:
- `fulfillment/tunnel.env` (copy from `fulfillment/tunnel.env.example`)

3) Install tunnel systemd unit:

```bash
sudo cp fulfillment/systemd/fulfillment-tunnel.service /etc/systemd/system/fulfillment-tunnel.service
sudo systemctl daemon-reload
sudo systemctl enable --now fulfillment-tunnel.service
sudo systemctl status fulfillment-tunnel.service
```

4) Set website env vars in Cloudflare Pages:
- `FULFILLMENT_API_URL=https://fulfill.cheatparadise.com`
- `FULFILLMENT_API_TOKEN=<FULFILLMENT_ADMIN_TOKEN from fulfillment/.env>`
- `FULFILLMENT_WEBHOOK_SECRET=<FULFILLMENT_WEBHOOK_SECRET from fulfillment/.env>`

5) Set SellAuth webhook URL to:
- `https://cheatparadise.com/api/webhooks/sellauth`
