-- ============================================================
-- Add instructions + loader_url to shop_products
-- Run AFTER shop_categories_products_variants.sql and shop_orders.sql
-- ============================================================

ALTER TABLE public.shop_products
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS loader_url   text;

COMMENT ON COLUMN public.shop_products.instructions IS
  'Setup / usage instructions shown on the order confirmation page and emailed to the customer after delivery.';

COMMENT ON COLUMN public.shop_products.loader_url IS
  'Direct download URL for the cheat loader. Included in the delivery email and order confirmation page.';
