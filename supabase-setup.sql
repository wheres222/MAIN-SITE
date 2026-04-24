-- ============================================================
-- Cheat Paradise — Supabase Database Setup
-- Run this in your Supabase project: SQL Editor > New Query
-- ============================================================

-- 1. PROFILES (extends Supabase Auth users)
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  username      text,
  balance       decimal(10,2) not null default 0,
  total_earned  decimal(10,2) not null default 0,
  referral_code text unique default upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- 2. ORDERS
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles(id) on delete cascade not null,
  sellauth_order_id  text,
  product_name       text not null,
  product_image      text,
  amount             decimal(10,2) not null default 0,
  currency           text not null default 'USD',
  status             text not null default 'pending',
  created_at         timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = user_id);

-- 3. REFERRALS
create table if not exists public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_id       uuid references public.profiles(id) on delete cascade not null,
  referred_id       uuid references public.profiles(id) on delete cascade,
  commission_amount decimal(10,2) not null default 0,
  status            text not null default 'pending',
  created_at        timestamptz not null default now()
);

alter table public.referrals enable row level security;

create policy "Users can view own referrals"
  on public.referrals for select using (auth.uid() = referrer_id);

-- 4. CASHOUT REQUESTS
create table if not exists public.cashout_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  amount     decimal(10,2) not null,
  method     text not null,
  address    text not null,
  status     text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.cashout_requests enable row level security;

create policy "Users can view own cashout requests"
  on public.cashout_requests for select using (auth.uid() = user_id);

create policy "Users can insert own cashout requests"
  on public.cashout_requests for insert with check (auth.uid() = user_id);

-- 5. AUTO-CREATE PROFILE ON SIGNUP (trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ref_code text;
  referrer_profile_id uuid;
begin
  -- Generate unique referral code
  ref_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.profiles (id, username, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', null),
    ref_code
  );

  -- Link referral if code was provided at signup
  if new.raw_user_meta_data->>'referral_code_used' is not null then
    select id into referrer_profile_id
    from public.profiles
    where referral_code = upper(new.raw_user_meta_data->>'referral_code_used')
    limit 1;

    if referrer_profile_id is not null then
      insert into public.referrals (referrer_id, referred_id, commission_amount, status)
      values (referrer_profile_id, new.id, 0, 'pending');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. DEPOSITS (crypto deposit tracking via NOWPayments)
create table if not exists public.deposits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.profiles(id) on delete cascade not null,
  nowpayments_id   text unique,
  usd_amount       decimal(10,2) not null,
  crypto_symbol    text not null,
  pay_address      text not null,
  pay_amount       numeric(20,10),
  tx_hash          text,
  status           text not null default 'pending',  -- pending | confirmed | expired | failed
  created_at       timestamptz not null default now()
);

alter table public.deposits enable row level security;

create policy "Users can view own deposits"
  on public.deposits for select using (auth.uid() = user_id);

-- Atomic balance credit — SECURITY DEFINER so webhook (service role) can call safely
create or replace function public.credit_user_balance(p_user_id uuid, p_amount decimal)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles set balance = balance + p_amount where id = p_user_id;
end;
$$;

-- 6. DELIVERY LOGS (persistent deduplication for order delivery)
create table if not exists public.delivery_logs (
  order_id    text primary key,
  state       text not null default 'pending',  -- pending | done | failed
  delivery_id text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Service role only — no user-facing RLS needed
alter table public.delivery_logs enable row level security;

-- Auto-cleanup: purge records older than 48 hours
create or replace function public.cleanup_old_delivery_logs()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.delivery_logs where updated_at < now() - interval '48 hours';
end;
$$;

-- ============================================================
-- Done! Now configure Discord OAuth in Supabase:
-- Authentication > Providers > Discord
-- Add your Discord app Client ID + Secret
-- Set redirect URL: https://your-project.supabase.co/auth/v1/callback
-- ============================================================
