-- ============================================================
-- Shop Catalog: categories, products, variants
-- Run FIRST, before shop_orders.sql and shop_product_delivery_fields.sql
-- Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ── shop_categories ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_categories (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  sellauth_id text    UNIQUE,           -- original SellAuth group ID (if migrated)
  name        text    NOT NULL,
  slug        text    NOT NULL UNIQUE,
  image_url   text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_categories_slug_idx ON public.shop_categories (slug);
CREATE INDEX IF NOT EXISTS shop_categories_active_idx ON public.shop_categories (active);

ALTER TABLE public.shop_categories ENABLE ROW LEVEL SECURITY;

-- Public read (catalog is public)
CREATE POLICY IF NOT EXISTS "public can read active categories"
  ON public.shop_categories FOR SELECT
  USING (active = true);

-- ── shop_products ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_products (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  sellauth_id  text    UNIQUE,          -- original SellAuth product ID (if migrated)
  category_id  uuid    REFERENCES public.shop_categories(id) ON DELETE SET NULL,
  name         text    NOT NULL,
  description  text,
  image_url    text,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_products_category_id_idx ON public.shop_products (category_id);
CREATE INDEX IF NOT EXISTS shop_products_active_idx ON public.shop_products (active);
CREATE INDEX IF NOT EXISTS shop_products_sellauth_id_idx ON public.shop_products (sellauth_id);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public can read active products"
  ON public.shop_products FOR SELECT
  USING (active = true);

-- ── shop_variants ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_variants (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  sellauth_id          text          UNIQUE,       -- original SellAuth variant ID (if migrated)
  product_id           uuid          NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  name                 text          NOT NULL,
  price                numeric(10,2) NOT NULL CHECK (price >= 0),
  sort_order           int           NOT NULL DEFAULT 0,
  active               boolean       NOT NULL DEFAULT true,
  stock_available      boolean       NOT NULL DEFAULT true,
  reselling_product_id text,                       -- reselling.pro product ID for delivery
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_variants_product_id_idx ON public.shop_variants (product_id);
CREATE INDEX IF NOT EXISTS shop_variants_active_idx ON public.shop_variants (active);
CREATE INDEX IF NOT EXISTS shop_variants_sellauth_id_idx ON public.shop_variants (sellauth_id);

ALTER TABLE public.shop_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "public can read active variants"
  ON public.shop_variants FOR SELECT
  USING (active = true);

-- ── auto-update updated_at ────────────────────────────────────────────────────
-- Reuse or create the set_updated_at() trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_categories_updated_at ON public.shop_categories;
CREATE TRIGGER shop_categories_updated_at
  BEFORE UPDATE ON public.shop_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS shop_products_updated_at ON public.shop_products;
CREATE TRIGGER shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS shop_variants_updated_at ON public.shop_variants;
CREATE TRIGGER shop_variants_updated_at
  BEFORE UPDATE ON public.shop_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- After running this file, run in order:
--   1. shop_orders.sql            (orders + order items + append_delivery_key RPC)
--   2. shop_product_delivery_fields.sql  (instructions + loader_url columns)
-- ============================================================
