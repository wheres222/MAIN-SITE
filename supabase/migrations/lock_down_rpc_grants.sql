-- ═══════════════════════════════════════════════════════════════════════════
--  CRITICAL — revoke public execute on the privileged functions
--
--  Postgres grants EXECUTE on new functions to PUBLIC by default, and Supabase
--  exposes every function in the public schema over PostgREST to the `anon` and
--  `authenticated` roles. Both of those speak to the browser using the anon key,
--  which ships in the client bundle by design.
--
--  Every one of these functions is SECURITY DEFINER, so it runs as the owner and
--  ignores RLS. Combined, that means anyone holding the public anon key could
--  call, directly against the REST API and with no application code involved:
--
--      POST /rest/v1/rpc/credit_user_balance
--      { "p_user_id": "<their own id>", "p_amount": 1000000 }
--
--  and give themselves unlimited store credit. spend_user_balance,
--  credit_referral_commission and append_delivery_key are the same class of
--  problem: free commissions, and writing delivery keys onto other people's
--  orders.
--
--  Every one of these is only ever called from server code using the
--  service_role key (webhooks, the balance checkout route, proxy.ts), so
--  revoking the client roles changes no working behaviour.
--
--  is_owner and is_staff are deliberately NOT revoked: they are used inside RLS
--  policies, which evaluate as the calling role and need execute.
--
--  Trigger functions (handle_new_user, guard_profile_privileged_columns) do not
--  need an execute grant to fire, so they are revoked too.
--
--  Safe to run more than once, and safe to run before the migrations that create
--  some of these functions — each block is guarded on existence.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  fn text;
  sig text;
  -- Function signatures to lock down. Listed explicitly rather than looped over
  -- the whole schema so that adding a function later is a deliberate decision
  -- about who may call it, not something this migration silently swallows.
  targets text[] := array[
    'public.credit_user_balance(uuid, numeric)',
    'public.spend_user_balance(uuid, numeric)',
    'public.credit_referral_commission(uuid, uuid, numeric)',
    'public.referral_rate_for(numeric)',
    'public.touch_account_ip(uuid, text)',
    'public.append_delivery_key(uuid, text)',
    'public.cleanup_old_delivery_logs()',
    'public.cleanup_security_events()',
    'public.handle_new_user()',
    'public.guard_profile_privileged_columns()'
  ];
begin
  foreach sig in array targets loop
    -- to_regprocedure returns null rather than raising when the function does
    -- not exist, so a project missing one of the later migrations still applies
    -- the rest of this cleanly.
    if to_regprocedure(sig) is not null then
      fn := sig;
      execute format('revoke all on function %s from public', fn);
      execute format('revoke all on function %s from anon', fn);
      execute format('revoke all on function %s from authenticated', fn);
      execute format('grant execute on function %s to service_role', fn);
      raise notice 'locked down %', fn;
    else
      raise notice 'skipped (not present) %', sig;
    end if;
  end loop;
end $$;

-- ── Verify ───────────────────────────────────────────────────────────────────
-- Run this afterwards. Every row returned is a function the browser can still
-- call; credit_user_balance must NOT appear.
--
--   select p.proname,
--          has_function_privilege('authenticated', p.oid, 'execute') as authed,
--          has_function_privilege('anon', p.oid, 'execute')          as anon
--     from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public'
--      and (has_function_privilege('authenticated', p.oid, 'execute')
--        or has_function_privilege('anon', p.oid, 'execute'))
--    order by 1;
