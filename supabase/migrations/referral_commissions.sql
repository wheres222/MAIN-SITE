-- ============================================================
-- Referral commission crediting
-- Run in Supabase SQL Editor. Safe to re-run.
-- ============================================================
--
-- The affiliate programme recorded who referred whom and paid nothing. The
-- signup trigger inserted a referrals row with commission_amount = 0, and no
-- code anywhere ever updated it — not the checkout routes, not the webhooks,
-- not a trigger. profiles.total_earned was never written at all. The dashboard
-- therefore always summed to zero, and cash-out requires at least $1.00, so no
-- affiliate could ever be paid.
--
-- This adds the missing half: a ledger of commissions, and a function the
-- payment webhooks call when an order is confirmed.

-- ── 1. LIFETIME REFERRED REVENUE ─────────────────────────────────────────────
-- Tiers are earned on the revenue you refer, not on the commission you have
-- taken out — otherwise cashing out would demote you.

alter table public.profiles
  add column if not exists referred_revenue numeric(12,2) not null default 0;

-- ── 2. COMMISSION LEDGER ─────────────────────────────────────────────────────
-- One row per credited order. `order_id` is unique, which is what makes the
-- whole operation idempotent: a webhook retry, or two providers both reporting
-- the same order, cannot pay the same commission twice.

create table if not exists public.referral_commissions (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null unique,
  referrer_id  uuid not null references auth.users(id) on delete cascade,
  buyer_id     uuid not null references auth.users(id) on delete cascade,
  order_total  numeric(10,2) not null,
  rate         numeric(5,4) not null,
  amount       numeric(10,2) not null,
  created_at   timestamptz not null default now()
);

alter table public.referral_commissions enable row level security;

create index if not exists referral_commissions_referrer_idx
  on public.referral_commissions (referrer_id, created_at desc);

-- Referrers may read their own commission history. Writes are service-role only.
drop policy if exists "Users can view own commissions" on public.referral_commissions;
create policy "Users can view own commissions"
  on public.referral_commissions for select
  using (auth.uid() = referrer_id);

-- ── 3. TIER RATES ────────────────────────────────────────────────────────────
-- Kept in SQL as well as TypeScript because the credit happens server-side in
-- the database. src/lib/affiliate-program.ts must match this table; if you
-- change one, change the other.

create or replace function public.referral_rate_for(p_referred_revenue numeric)
returns numeric
language sql
immutable
as $$
  select case
    when p_referred_revenue >= 5000 then 0.2000
    when p_referred_revenue >= 2500 then 0.1750
    when p_referred_revenue >= 1000 then 0.1500
    when p_referred_revenue >=  250 then 0.1250
    else                                 0.1000
  end;
$$;

-- ── 4. THE CREDIT ITSELF ─────────────────────────────────────────────────────

create or replace function public.credit_referral_commission(
  p_buyer_id   uuid,
  p_order_id   uuid,
  p_order_total numeric
)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_referrer  uuid;
  v_revenue   numeric;
  v_rate      numeric;
  v_amount    numeric;
begin
  if p_buyer_id is null or p_order_id is null then return 0; end if;
  if p_order_total is null or p_order_total <= 0 then return 0; end if;

  -- Who referred this buyer? The row is created at signup by handle_new_user.
  select referrer_id into v_referrer
  from public.referrals
  where referred_id = p_buyer_id
  limit 1;

  if v_referrer is null then return 0; end if;

  -- Referring yourself is not a business model.
  if v_referrer = p_buyer_id then return 0; end if;

  select coalesce(referred_revenue, 0) into v_revenue
  from public.profiles where id = v_referrer;

  v_rate   := public.referral_rate_for(v_revenue);
  v_amount := round(p_order_total * v_rate, 2);

  if v_amount <= 0 then return 0; end if;

  -- Idempotency lives here. If this order has already been credited the insert
  -- does nothing and we return without touching any aggregate, so a webhook
  -- retry is harmless.
  insert into public.referral_commissions
    (order_id, referrer_id, buyer_id, order_total, rate, amount)
  values
    (p_order_id, v_referrer, p_buyer_id, p_order_total, v_rate, v_amount)
  on conflict (order_id) do nothing;

  if not found then
    return 0;
  end if;

  -- Aggregates the dashboard reads.
  update public.profiles
  set referred_revenue = coalesce(referred_revenue, 0) + p_order_total,
      total_earned     = coalesce(total_earned, 0) + v_amount
  where id = v_referrer;

  update public.referrals
  set commission_amount = coalesce(commission_amount, 0) + v_amount,
      status = 'pending'
  where referred_id = p_buyer_id and referrer_id = v_referrer;

  return v_amount;
end;
$$;

-- ── 5. BACKFILL NOTE ─────────────────────────────────────────────────────────
-- Orders placed before this migration were never credited and are not
-- reconstructed here — doing so would require deciding a rate retrospectively
-- and could pay out on refunded orders. If you want to honour past referrals,
-- do it deliberately with a one-off statement rather than automatically.
