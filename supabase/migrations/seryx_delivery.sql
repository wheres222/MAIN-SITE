-- ============================================================
-- Seryx reseller delivery — variant columns
-- Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Run AFTER shop_catalog.sql and shop_orders.sql.
-- Safe to re-run: every statement is idempotent.
-- ============================================================
--
-- This file only adds the columns. It deliberately does NOT create products.
--
-- An earlier version seeded "Seryx Rust" and "Seryx FiveM" into shop_products
-- and shop_variants. That was wrong: the storefront is served from SellAuth,
-- and the shop_ tables are a mirror that /api/checkout resolves against by
-- sellauth_id. Rows created here carry no sellauth_id, so checkout can never
-- reach them and the storefront never shows them — they were dead rows, and
-- both Seryx products already exist in the catalogue with real prices.
--
-- Wiring Seryx delivery is therefore a matter of TAGGING the existing mirrored
-- variants, which is a separate step because it has to match the real product
-- and variant names. See the query at the bottom.

-- ── 1. Mark a variant as Seryx-delivered ─────────────────────────────────────
-- A variant delivers through Seryx when BOTH columns are set. The dispatcher
-- (src/lib/delivery.ts → variantProvider) checks Seryx first and falls back to
-- reselling.pro, so untagged variants are completely unaffected.
ALTER TABLE public.shop_variants
  ADD COLUMN IF NOT EXISTS seryx_game      text,
  ADD COLUMN IF NOT EXISTS seryx_plan_type text;

-- Seryx exposes no plan-listing endpoint, so the valid pairs are hard-coded on
-- both sides. Enforcing them here means a typo in the admin panel fails loudly
-- at save time instead of silently at delivery time, after the customer has
-- already paid.
ALTER TABLE public.shop_variants
  DROP CONSTRAINT IF EXISTS shop_variants_seryx_plan_valid;

ALTER TABLE public.shop_variants
  ADD CONSTRAINT shop_variants_seryx_plan_valid CHECK (
    (seryx_game IS NULL AND seryx_plan_type IS NULL)
    OR (seryx_game = 'fivem' AND seryx_plan_type IN ('week', 'month', 'lifetime'))
    OR (seryx_game = 'rust'  AND seryx_plan_type IN ('rust_day', 'rust_threeday', 'rust_month', 'rust_lifetime'))
  );

-- Delivery reads these per order line; the partial index keeps that lookup off
-- a full scan once the catalogue grows.
CREATE INDEX IF NOT EXISTS shop_variants_seryx_idx
  ON public.shop_variants (seryx_game, seryx_plan_type)
  WHERE seryx_game IS NOT NULL;

-- ── 2. Remove the dead rows the earlier version created, if any ──────────────
-- Only rows with no sellauth_id are touched: those can only have come from that
-- seeding, never from the SellAuth mirror. A mirrored product is never deleted
-- by this.
DELETE FROM public.shop_variants v
USING public.shop_products p
WHERE v.product_id = p.id
  AND p.name IN ('Seryx Rust', 'Seryx FiveM')
  AND p.sellauth_id IS NULL;

DELETE FROM public.shop_products
WHERE name IN ('Seryx Rust', 'Seryx FiveM')
  AND sellauth_id IS NULL;

-- ── 3. What to tag ───────────────────────────────────────────────────────────
-- Lists the real, mirrored Seryx variants and the plan each should carry.
-- Nothing is written: run the UPDATEs separately once the names below match
-- what you expect.
SELECT
  p.name          AS product,
  v.name          AS variant,
  v.price         AS charged_price,
  v.sellauth_id   AS variant_sellauth_id,
  v.seryx_game,
  v.seryx_plan_type,
  CASE
    WHEN p.name ILIKE '%rust%'  AND v.name ILIKE '%1 day%'    THEN 'rust / rust_day'
    WHEN p.name ILIKE '%rust%'  AND v.name ILIKE '%3 day%'    THEN 'rust / rust_threeday'
    WHEN p.name ILIKE '%rust%'  AND v.name ILIKE '%30 day%'   THEN 'rust / rust_month'
    WHEN p.name ILIKE '%rust%'  AND v.name ILIKE '%lifetime%' THEN 'rust / rust_lifetime'
    WHEN p.name ILIKE '%fivem%' AND v.name ILIKE '%week%'     THEN 'fivem / week'
    WHEN p.name ILIKE '%fivem%' AND v.name ILIKE '%30 day%'   THEN 'fivem / month'
    WHEN p.name ILIKE '%fivem%' AND v.name ILIKE '%lifetime%' THEN 'fivem / lifetime'
    ELSE '(no mapping)'
  END AS should_be_tagged
FROM public.shop_products p
JOIN public.shop_variants v ON v.product_id = p.id
WHERE p.name ILIKE '%seryx%'
ORDER BY p.name, v.sort_order, v.name;

-- ============================================================
-- BEFORE GOING LIVE
--   1. Set SERYX_API_KEY in Vercel (server-side, never NEXT_PUBLIC_)
--   2. Tag the variants above with seryx_game / seryx_plan_type
--   3. Top up the Seryx reseller wallet — delivery 402s on an empty balance
--
-- Prices need no change: both products already sell at their real prices,
-- which come from the SellAuth mirror in shop_variants.price.
-- ============================================================
