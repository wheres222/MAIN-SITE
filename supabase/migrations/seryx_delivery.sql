-- ============================================================
-- Seryx reseller delivery — variant columns + Rust/FiveM catalog
-- Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Run AFTER shop_catalog.sql and shop_orders.sql.
-- Safe to re-run: every statement is idempotent.
-- ============================================================

-- ── 1. Mark a variant as Seryx-delivered ─────────────────────────────────────
-- A variant delivers through Seryx when BOTH columns are set. The delivery
-- dispatcher (src/lib/delivery.ts → variantProvider) checks Seryx first and
-- falls back to reselling.pro, so existing variants are untouched.
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
-- a full scan once the catalog grows.
CREATE INDEX IF NOT EXISTS shop_variants_seryx_idx
  ON public.shop_variants (seryx_game, seryx_plan_type)
  WHERE seryx_game IS NOT NULL;

-- ── 2. Categories ────────────────────────────────────────────────────────────
-- Both slugs are already used by the site's category art and routing, so reuse
-- them rather than creating parallel ones.
INSERT INTO public.shop_categories (name, slug, active)
VALUES ('Rust', 'rust', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.shop_categories (name, slug, active)
VALUES ('FiveM', 'fivem', true)
ON CONFLICT (slug) DO NOTHING;

-- ── 3. Products ──────────────────────────────────────────────────────────────
-- Seeded INACTIVE on purpose. Variant prices below are placeholders, and a
-- product that goes live before it is priced sells at the placeholder. Set real
-- prices first, then flip active in /admin/products.
DO $$
DECLARE
  v_rust_cat  uuid;
  v_fivem_cat uuid;
  v_rust_prod  uuid;
  v_fivem_prod uuid;
BEGIN
  SELECT id INTO v_rust_cat  FROM public.shop_categories WHERE slug = 'rust'  LIMIT 1;
  SELECT id INTO v_fivem_cat FROM public.shop_categories WHERE slug = 'fivem' LIMIT 1;

  -- ── Seryx Rust ─────────────────────────────────────────────────────────────
  SELECT id INTO v_rust_prod
    FROM public.shop_products WHERE name = 'Seryx Rust' LIMIT 1;

  IF v_rust_prod IS NULL THEN
    INSERT INTO public.shop_products (category_id, name, description, active)
    VALUES (
      v_rust_cat,
      'Seryx Rust',
      'Seryx Rust cheat. Instant key delivery to your email and your account order history.',
      false
    )
    RETURNING id INTO v_rust_prod;
  END IF;

  -- ── Seryx FiveM ────────────────────────────────────────────────────────────
  SELECT id INTO v_fivem_prod
    FROM public.shop_products WHERE name = 'Seryx FiveM' LIMIT 1;

  IF v_fivem_prod IS NULL THEN
    INSERT INTO public.shop_products (category_id, name, description, active)
    VALUES (
      v_fivem_cat,
      'Seryx FiveM',
      'Seryx FiveM cheat. Instant key delivery to your email and your account order history.',
      false
    )
    RETURNING id INTO v_fivem_prod;
  END IF;

  -- ── 4. Variants ────────────────────────────────────────────────────────────
  -- price 9999.00 is a deliberate placeholder. It is the safe direction to be
  -- wrong in: an unpriced variant that reaches the storefront sells to nobody,
  -- where a 0.00 placeholder would sell to everybody.
  INSERT INTO public.shop_variants
    (product_id, name, price, sort_order, active, stock_available, seryx_game, seryx_plan_type)
  SELECT * FROM (VALUES
    (v_rust_prod,  '1 Day',    9999.00, 1, true, true, 'rust',  'rust_day'),
    (v_rust_prod,  '3 Days',   9999.00, 2, true, true, 'rust',  'rust_threeday'),
    (v_rust_prod,  '30 Days',  9999.00, 3, true, true, 'rust',  'rust_month'),
    (v_rust_prod,  'Lifetime', 9999.00, 4, true, true, 'rust',  'rust_lifetime'),
    (v_fivem_prod, '7 Days',   9999.00, 1, true, true, 'fivem', 'week'),
    (v_fivem_prod, '30 Days',  9999.00, 2, true, true, 'fivem', 'month'),
    (v_fivem_prod, 'Lifetime', 9999.00, 3, true, true, 'fivem', 'lifetime')
  ) AS v(product_id, name, price, sort_order, active, stock_available, seryx_game, seryx_plan_type)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.shop_variants existing
    WHERE existing.product_id = v.product_id
      AND existing.name       = v.name
  );
END $$;

-- ── 5. Verify ────────────────────────────────────────────────────────────────
-- Expect 7 rows, every one carrying a game and a plan type.
SELECT
  p.name        AS product,
  v.name        AS variant,
  v.price,
  v.seryx_game,
  v.seryx_plan_type,
  p.active      AS product_active,
  v.active      AS variant_active
FROM public.shop_variants v
JOIN public.shop_products p ON p.id = v.product_id
WHERE v.seryx_game IS NOT NULL
ORDER BY p.name, v.sort_order;

-- ============================================================
-- BEFORE GOING LIVE
--   1. Set SERYX_API_KEY in Vercel (server-side, never NEXT_PUBLIC_)
--   2. Replace every 9999.00 price in /admin/products
--   3. Flip both products to active
--   4. Top up the Seryx reseller wallet — delivery 402s on an empty balance
-- ============================================================
