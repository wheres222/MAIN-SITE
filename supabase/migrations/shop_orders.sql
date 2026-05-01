-- ============================================================
-- Shop Orders + Order Items — custom checkout system (crypto + Stripe)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ── Add columns to shop_variants if not already present ─────────────────────
ALTER TABLE public.shop_variants
  ADD COLUMN IF NOT EXISTS reselling_product_id text,
  ADD COLUMN IF NOT EXISTS stock_available       boolean NOT NULL DEFAULT true;

-- ── shop_orders ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id                     uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid          REFERENCES auth.users(id) ON DELETE SET NULL,
  email                  text          NOT NULL,
  status                 text          NOT NULL DEFAULT 'pending'
                                       CHECK (status IN ('pending','paid','delivering','delivered','failed','refunded')),
  total_usd              numeric(10,2) NOT NULL,

  -- Crypto (NOWPayments)
  pay_currency           text          NOT NULL,   -- 'stripe' or crypto ticker
  pay_address            text,
  pay_amount             numeric(20,8),
  nowpayments_payment_id text          UNIQUE,

  -- Stripe
  stripe_session_id      text          UNIQUE,
  stripe_session_url     text,

  -- Shared
  idempotency_key        text          UNIQUE NOT NULL,
  delivery_error         text,
  created_at             timestamptz   NOT NULL DEFAULT now(),
  updated_at             timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_orders_user_id_idx
  ON public.shop_orders (user_id);
CREATE INDEX IF NOT EXISTS shop_orders_status_idx
  ON public.shop_orders (status);
CREATE INDEX IF NOT EXISTS shop_orders_nowpayments_payment_id_idx
  ON public.shop_orders (nowpayments_payment_id);
CREATE INDEX IF NOT EXISTS shop_orders_stripe_session_id_idx
  ON public.shop_orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS shop_orders_created_at_idx
  ON public.shop_orders (created_at DESC);

ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users can read own orders"
  ON public.shop_orders FOR SELECT
  USING (auth.uid() = user_id);

-- ── shop_order_items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid          NOT NULL REFERENCES public.shop_orders(id)    ON DELETE CASCADE,
  product_id      uuid          NOT NULL REFERENCES public.shop_products(id),
  variant_id      uuid          NOT NULL REFERENCES public.shop_variants(id),
  product_name    text          NOT NULL,
  variant_name    text          NOT NULL,
  quantity        int           NOT NULL DEFAULT 1
                                CHECK (quantity > 0 AND quantity <= 10),
  unit_price_usd  numeric(10,2) NOT NULL,
  delivery_keys   text[],          -- product keys / delivery IDs from reselling.pro
  delivered_at    timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shop_order_items_order_id_idx
  ON public.shop_order_items (order_id);

ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "users can read own order items"
  ON public.shop_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_orders o
      WHERE o.id = order_id
        AND o.user_id = auth.uid()
    )
  );

-- ── RPC: append a delivery key to an order item ──────────────────────────────
CREATE OR REPLACE FUNCTION public.append_delivery_key(
  p_item_id     uuid,
  p_delivery_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.shop_order_items
  SET
    delivery_keys = array_append(COALESCE(delivery_keys, ARRAY[]::text[]), p_delivery_id),
    delivered_at  = COALESCE(delivered_at, now())
  WHERE id = p_item_id;
END;
$$;

-- ── Trigger: auto-update updated_at on shop_orders ───────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS shop_orders_updated_at ON public.shop_orders;
CREATE TRIGGER shop_orders_updated_at
  BEFORE UPDATE ON public.shop_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
