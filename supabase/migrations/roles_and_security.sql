-- ============================================================
-- Roles + Security Telemetry
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ── 1. ROLE COLUMN ───────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user','staff','owner'));
  end if;
end $$;

create index if not exists profiles_role_idx on public.profiles (role);

-- ── 2. PRIVILEGE-ESCALATION GUARD ────────────────────────────────────────────
--
-- The existing policy "Users can view own profile" / "Users can update own
-- profile" grants an unrestricted UPDATE on the caller's own row, and Postgres
-- RLS cannot restrict which *columns* an UPDATE touches. Without the trigger
-- below, any logged-in user could run this from the browser with the public
-- anon key and succeed:
--
--   update profiles set role = 'owner', balance = 999999 where id = auth.uid();
--
-- balance / total_earned / referral_code were already exposed this way before
-- this migration — `role` would simply have joined them. The trigger locks all
-- four: they may only be changed by an owner or by the service role (webhooks,
-- server-side admin actions, and the credit_user_balance/spend_user_balance
-- SECURITY DEFINER functions, which are unaffected because they run as owner).

create or replace function public.is_owner(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'owner'
  );
$$;

create or replace function public.is_staff(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role in ('staff','owner')
  );
$$;

create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role (server-side code, webhooks) is always allowed.
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.balance is distinct from old.balance
     or new.total_earned is distinct from old.total_earned
     or new.referral_code is distinct from old.referral_code
  then
    if not public.is_owner(auth.uid()) then
      raise exception
        'Not permitted: role, balance, total_earned and referral_code are server-managed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- ── 3. SECURITY EVENTS ───────────────────────────────────────────────────────
-- Service-role writes only. No user-facing policies: RLS is enabled with zero
-- policies, so the anon/authenticated keys cannot read or write this table at
-- all. The dashboard reads it through server routes gated by requireRole("owner").

create table if not exists public.security_events (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  kind        text        not null,
  severity    text        not null default 'low'
                          check (severity in ('low','medium','high')),
  ip          text,
  ip_hash     text,
  country     text,
  user_agent  text,
  method      text,
  path        text,
  query       text,
  user_id     uuid references auth.users(id) on delete set null,
  status_code int,
  detail      jsonb       not null default '{}'::jsonb
);

alter table public.security_events enable row level security;

create index if not exists security_events_occurred_at_idx
  on public.security_events (occurred_at desc);
create index if not exists security_events_kind_idx
  on public.security_events (kind, occurred_at desc);
create index if not exists security_events_ip_idx
  on public.security_events (ip, occurred_at desc);
create index if not exists security_events_severity_idx
  on public.security_events (severity, occurred_at desc);

-- ── 4. BLOCKLIST (built, not yet enforced) ───────────────────────────────────
-- src/proxy.ts does NOT read this yet — see the plan's phase 6. Rows can be
-- created from the dashboard so the data is ready when enforcement is switched on.

create table if not exists public.security_blocklist (
  id         uuid primary key default gen_random_uuid(),
  ip         text not null unique,
  reason     text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.security_blocklist enable row level security;

create index if not exists security_blocklist_expires_at_idx
  on public.security_blocklist (expires_at);

-- ── 5. RETENTION — 90 days ───────────────────────────────────────────────────

create or replace function public.cleanup_security_events()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.security_events where occurred_at < now() - interval '90 days';
  delete from public.security_blocklist
    where expires_at is not null and expires_at < now();
end;
$$;

-- Schedule it. Requires the pg_cron extension:
--   Dashboard → Database → Extensions → enable "pg_cron"
-- Then run:
--
--   select cron.schedule(
--     'cleanup-security-events', '0 4 * * *',
--     $$ select public.cleanup_security_events(); $$
--   );

-- ── 6. BOOTSTRAP YOUR OWNER ACCOUNT ──────────────────────────────────────────
-- Run once, after registering, with your own address:
--
--   update public.profiles set role = 'owner'
--   where id = (select id from auth.users where email = 'you@example.com');
--
-- Until a row has role='owner', src/lib/auth/guard.ts falls back to the
-- ADMIN_EMAIL env var so you cannot lock yourself out.
