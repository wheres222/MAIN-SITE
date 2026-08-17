-- ═══════════════════════════════════════════════════════════════════════════
--  Card deposits via Stripe
--
--  The deposits table was written for NOWPayments only: crypto_symbol and
--  pay_address are NOT NULL, and the provider's payment id lives in a column
--  literally named nowpayments_id. A Stripe deposit has none of those things.
--
--  Rather than overload the existing columns — which would leave a Stripe
--  session id sitting in nowpayments_id for whoever reads this table next —
--  this adds a provider discriminator and a Stripe id of its own, and relaxes
--  the two crypto-only columns.
--
--  Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Provider discriminator ────────────────────────────────────────────────
-- Existing rows are all NOWPayments, so the default backfills them correctly.

alter table public.deposits
  add column if not exists provider text not null default 'nowpayments';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'deposits_provider_check'
  ) then
    alter table public.deposits
      add constraint deposits_provider_check
      check (provider in ('nowpayments', 'stripe'));
  end if;
end $$;

-- ── 2. Stripe session id ─────────────────────────────────────────────────────
-- Unique for the same reason nowpayments_id is: it is the idempotency key the
-- webhook looks the row up by, and a duplicate would mean a double credit.

alter table public.deposits
  add column if not exists stripe_session_id text;

create unique index if not exists deposits_stripe_session_id_key
  on public.deposits (stripe_session_id)
  where stripe_session_id is not null;

-- ── 3. Relax the crypto-only columns ─────────────────────────────────────────
-- A card deposit has no coin and no wallet address to send to.

alter table public.deposits alter column crypto_symbol drop not null;
alter table public.deposits alter column pay_address   drop not null;

-- ── 4. Lookup index ──────────────────────────────────────────────────────────

create index if not exists deposits_user_created_idx
  on public.deposits (user_id, created_at desc);
