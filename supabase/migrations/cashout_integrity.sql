-- ═══════════════════════════════════════════════════════════════════════════
--  CRITICAL — cashout requests were writable directly from the browser, and
--             no balance was ever reserved against them.
--
--  Two separate faults, either of which is enough on its own.
--
--  1. The insert policy constrained only ownership:
--
--         create policy "Users can insert own cashout requests"
--           on public.cashout_requests for insert
--           with check (auth.uid() = user_id);
--
--     Every other column was free. The anon key ships in the client bundle by
--     design, so any signed-in user could skip /api/account/cashout entirely
--     and POST straight to PostgREST:
--
--         POST /rest/v1/cashout_requests
--         { "user_id": "<their own id>", "amount": 999999,
--           "method": "crypto_btc", "address": "<theirs>", "status": "paid" }
--
--     No balance check, no minimum, no address validation, and — because
--     `status` was writable — a request that arrives already looking approved.
--     Every check in the API route was optional.
--
--  2. The route itself never reserved anything. It read profiles.balance,
--     compared, and inserted. Nothing was deducted and pending requests were
--     not counted, so ten sequential $100 requests against a $100 balance all
--     passed: each one re-read the same untouched $100.
--
--  The fix is one atomic, SECURITY DEFINER function that locks the profile row,
--  counts what is already pending, and refuses to over-commit — plus dropping
--  the direct insert policy so that function is the only way in.
--
--  Safe to run more than once.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Close the direct write path ─────────────────────────────────────────
drop policy if exists "Users can insert own cashout requests" on public.cashout_requests;

-- SELECT stays: the balance page lists a user's own requests, and that is fine.
-- With no insert/update/delete policy and RLS enabled, PostgREST refuses those
-- verbs outright for anon and authenticated.

-- ── 2. Constrain the columns at the table level ────────────────────────────
-- Defence in depth: even a future policy mistake cannot produce a negative or
-- absurd amount, and status becomes a closed set rather than free text.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'cashout_requests_amount_check') then
    alter table public.cashout_requests
      add constraint cashout_requests_amount_check
      check (amount >= 1.00 and amount <= 10000.00);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cashout_requests_status_check') then
    alter table public.cashout_requests
      add constraint cashout_requests_status_check
      check (status in ('pending', 'approved', 'paid', 'rejected', 'cancelled'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'cashout_requests_method_check') then
    alter table public.cashout_requests
      add constraint cashout_requests_method_check
      check (method in ('crypto_btc', 'crypto_eth', 'crypto_ltc', 'crypto_usdt'));
  end if;
end $$;

-- Pending lookups happen on every cashout attempt.
create index if not exists cashout_requests_user_status_idx
  on public.cashout_requests (user_id, status);

-- ── 3. The only way to create one ──────────────────────────────────────────
create or replace function public.request_cashout(
  p_user_id uuid,
  p_amount  numeric,
  p_method  text,
  p_address text
)
returns public.cashout_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance   numeric;
  v_pending   numeric;
  v_amount    numeric := round(p_amount::numeric, 2);
  v_row       public.cashout_requests;
begin
  if v_amount is null or v_amount < 1.00 then
    raise exception 'Minimum cashout amount is $1.00' using errcode = 'check_violation';
  end if;

  -- Lock the profile row for the duration of the transaction. This is what
  -- makes the check meaningful: two concurrent requests serialise here instead
  -- of both reading the same pre-withdrawal balance.
  select balance into v_balance
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'no_data_found';
  end if;

  -- Money already committed to requests that have not been settled yet. Without
  -- this term a user can queue withdrawals indefinitely against one balance.
  select coalesce(sum(amount), 0) into v_pending
  from public.cashout_requests
  where user_id = p_user_id
    and status in ('pending', 'approved');

  if v_amount + v_pending > coalesce(v_balance, 0) then
    raise exception 'Insufficient available balance. Balance %, already requested %',
      coalesce(v_balance, 0), v_pending
      using errcode = 'check_violation';
  end if;

  insert into public.cashout_requests (user_id, amount, method, address, status)
  values (p_user_id, v_amount, p_method, trim(p_address), 'pending')
  returning * into v_row;

  return v_row;
end;
$$;

-- ── 4. Server-side callers only ────────────────────────────────────────────
-- SECURITY DEFINER means this ignores RLS, so it must not be reachable with the
-- anon key. /api/account/cashout calls it with the service role after verifying
-- the session — the same arrangement as spend_user_balance.
revoke all on function public.request_cashout(uuid, numeric, text, text) from public;
revoke all on function public.request_cashout(uuid, numeric, text, text) from anon;
revoke all on function public.request_cashout(uuid, numeric, text, text) from authenticated;

-- ── 5. Verify ──────────────────────────────────────────────────────────────
-- Expect: zero rows for insert/update/delete on cashout_requests.
--
--   select policyname, cmd from pg_policies
--   where tablename = 'cashout_requests';
--
-- Expect: false — the anon and authenticated roles must not be able to call it.
--
--   select has_function_privilege('anon',
--     'public.request_cashout(uuid, numeric, text, text)', 'execute');
