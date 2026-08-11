-- ============================================================
-- Account moderation + IP ↔ account linking + blocklist enforcement
-- Run in Supabase SQL Editor. Safe to re-run.
-- Requires roles_and_security.sql to have been applied first.
-- ============================================================

-- ── 1. ACCOUNT MODERATION STATE ──────────────────────────────────────────────
-- Separate from `role`: role is what someone may do, status is whether they may
-- do anything at all.
--
--   active     normal
--   suspended  can sign in and read order history, cannot check out — the
--              state to use while investigating, rather than acting on a hunch
--   banned     refused at sign-in

alter table public.profiles
  add column if not exists status text not null default 'active',
  add column if not exists moderation_note text,
  add column if not exists moderated_at timestamptz,
  add column if not exists moderated_by uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_status_check') then
    alter table public.profiles
      add constraint profiles_status_check check (status in ('active','suspended','banned'));
  end if;
end $$;

create index if not exists profiles_status_idx on public.profiles (status)
  where status <> 'active';

-- Moderation columns are server-managed for the same reason role and balance
-- are: an unrestricted UPDATE on your own row would otherwise let a banned
-- account un-ban itself with the public anon key.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Direct database access (SQL editor, psql, migrations) carries no JWT.
  -- Those sessions are already superuser-level and this trigger was never what
  -- defended against them; refusing here only blocks bootstrapping.
  if auth.role() is null then
    return new;
  end if;

  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.balance is distinct from old.balance
     or new.total_earned is distinct from old.total_earned
     or new.referral_code is distinct from old.referral_code
     or new.status is distinct from old.status
     or new.moderation_note is distinct from old.moderation_note
  then
    if not public.is_owner(auth.uid()) then
      raise exception
        'Not permitted: role, status, balance, total_earned, referral_code and moderation notes are server-managed';
    end if;
  end if;

  return new;
end;
$$;

-- ── 2. IP ↔ ACCOUNT LINKING ──────────────────────────────────────────────────
-- One row per (account, ip) pair rather than per request, so the table tracks
-- distinct locations instead of traffic volume.

create table if not exists public.account_ip_log (
  user_id    uuid not null references auth.users(id) on delete cascade,
  ip         text not null,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  hits       integer not null default 1,
  primary key (user_id, ip)
);

alter table public.account_ip_log enable row level security;

create index if not exists account_ip_log_ip_idx on public.account_ip_log (ip);
create index if not exists account_ip_log_last_seen_idx
  on public.account_ip_log (last_seen desc);

create or replace function public.touch_account_ip(p_user_id uuid, p_ip text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.account_ip_log (user_id, ip)
  values (p_user_id, p_ip)
  on conflict (user_id, ip)
  do update set last_seen = now(), hits = public.account_ip_log.hits + 1;
end;
$$;

-- ── 3. BLOCKLIST — now actually enforced by src/proxy.ts ─────────────────────
-- `note` records why, so a block is reviewable months later.

alter table public.security_blocklist
  add column if not exists blocked_user_id uuid references auth.users(id) on delete set null;

-- ── 4. RETENTION ─────────────────────────────────────────────────────────────

create or replace function public.cleanup_security_events()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.security_events where occurred_at < now() - interval '90 days';
  delete from public.security_blocklist
    where expires_at is not null and expires_at < now();
  delete from public.account_ip_log where last_seen < now() - interval '90 days';
end;
$$;
