import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * False when the Supabase env vars are missing.
 *
 * createClient still returns a client built against a placeholder host so the
 * page renders rather than crashing, but every request against it fails — and
 * an OAuth redirect in particular navigates the browser to a host that does not
 * resolve, which looks like the button doing nothing. Callers that can show a
 * useful message should check this first.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL ?? "https://placeholder.supabase.co",
    SUPABASE_ANON_KEY ?? "placeholder"
  );
}
