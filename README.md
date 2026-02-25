# CheatParadise SellAuth Marketplace

This project is a full storefront built with Next.js, with:

- Working navigation/search/filter interactions
- Game/category filtering
- Cart drawer with quantity controls
- Checkout API integration via SellAuth
- Fallback demo mode when SellAuth env vars are not set

## 1. Configure environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Set:

- `SELLAUTH_SHOP_ID`
- `SELLAUTH_API_KEY`
- Optional: `SELLAUTH_API_BASE_URL` (default: `https://api.sellauth.com`)
- Optional: `NEXT_PUBLIC_DISCORD_URL`
- Optional: `NEXT_PUBLIC_SUPPORT_URL`
- Optional: `NEXT_IMAGE_REMOTE_HOSTS` (comma-separated HTTPS hostnames for external images)

Security note:
- Never commit real API keys to the repository.
- If a key was ever committed, rotate it immediately in SellAuth.

## 2. Install dependencies

If you have Node installed:

```bash
npm install
```

If you do not have Node globally in this workspace, a portable Node binary is included in `.node/`.

## 3. Run

```bash
npm run dev
```

Open:

`http://localhost:3000`

## API routes

- `GET /api/storefront`
  - Pulls products/groups/categories/payment methods from SellAuth
  - Falls back to demo data if config/API fails

- `POST /api/checkout`
  - Expects:
    - `paymentMethod`
    - `items[]` (`productId`, `quantity`, optional `variantId`)
    - optional `email`, `couponCode`
  - Creates SellAuth checkout and returns `redirectUrl` when available

## Notes

- Without SellAuth env vars, UI remains fully interactive in demo mode.
- With env vars configured, catalog and checkout are driven from your SellAuth dashboard.
- Ensure at least one enabled payment method exists in SellAuth, or checkout cannot proceed.
- SellAuth Checkout API access may require an upgraded SellAuth plan.
