"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./reset-password.module.css";

/**
 * Captured at import time on purpose. Supabase's browser client clears the URL
 * hash the moment it is constructed — which happens during render — so by the
 * time an effect runs there is nothing left to read. Module scope executes
 * first, which is the only reliable place to see what the link carried.
 */
const INITIAL_HASH =
  typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  /** Set once we know there is no recovery session, so we can stop waiting. */
  const [checked, setChecked] = useState(false);
  const [linkError, setLinkError] = useState("");

  // Refs because the sign-out-on-leave cleanup runs after unmount, when the
  // state values it closed over would be stale.
  const completedRef = useRef(false);
  const readyRef = useRef(false);
  readyRef.current = ready;

  // Memoised: createClient() returns a new object each call, so building it
  // inline made every render produce a fresh client and made it unusable as an
  // effect dependency.
  const supabase = useMemo(() => createClient(), []);

  // Supabase puts the recovery token in the URL and the client SDK redeems it
  // on load, firing PASSWORD_RECOVERY. Listening for that event alone was not
  // enough for two reasons:
  //
  //   1. The redemption can complete before this effect runs, so the event
  //      fires with nobody subscribed and the page waits on "Verifying link…"
  //      for ever.
  //   2. On a refresh the token is already spent. No event is ever emitted
  //      again, so the page hung there permanently even though a valid
  //      recovery session existed.
  //
  // Asking for the session directly covers both: if one exists, the link was
  // good and the form should be shown. The listener stays for the case where
  // redemption finishes after mount.
  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });

    void (async () => {
      // An error in the URL (expired or already-used link) must surface as an
      // error rather than an indefinite spinner. Supabase puts it in the hash;
      // the query string is checked too since the TokenHash template style
      // reports failures there instead.
      const params = new URLSearchParams(INITIAL_HASH || window.location.search);
      const urlError = params.get("error_description") || params.get("error");

      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;

      if (session) {
        setReady(true);
        return;
      }
      if (urlError) setLinkError(urlError);
      setChecked(true);
    })();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // A recovery link grants a real, usable session — that is how Supabase
  // implements it. So abandoning this page half-way used to leave the visitor
  // silently signed in without ever setting a password, turning a reset link
  // into a permanent skeleton key for anyone who could read the mailbox.
  // Leaving without finishing now ends the session.
  useEffect(() => {
    return () => {
      if (!completedRef.current && readyRef.current) {
        void supabase.auth.signOut();
      }
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      completedRef.current = true;
      setDone(true);
      setTimeout(() => router.push("/account"), 2500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link href="/login" className={styles.backLink}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">
          <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to login
      </Link>

      <div className={styles.card}>
        <div className={styles.logo}>
          <img src="/branding/cp-logo.webp" alt="Cheat Paradise" className={styles.logoImg} />
        </div>

        {done ? (
          <>
            <div className={styles.successIcon} aria-hidden>✅</div>
            <h1 className={styles.title}>Password updated</h1>
            <p className={styles.subtitle}>Your password has been changed. Redirecting you to your account…</p>
          </>
        ) : !ready && checked ? (
          <>
            <h1 className={styles.title}>This link didn&apos;t work</h1>
            <p className={styles.subtitle}>
              {linkError
                ? `${linkError}. `
                : "Reset links are single-use and expire after a short time. "}
              <Link href="/forgot-password" className={styles.link}>Request a new one</Link>.
            </p>
          </>
        ) : !ready ? (
          <>
            <h1 className={styles.title}>Verifying link…</h1>
            <p className={styles.subtitle}>Please wait while we verify your reset link.</p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Set new password</h1>
            <p className={styles.subtitle}>Choose a strong password for your account.</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>New Password</label>
                <input
                  id="password"
                  type="password"
                  className={styles.input}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="confirm" className={styles.label}>Confirm Password</label>
                <input
                  id="confirm"
                  type="password"
                  className={styles.input}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
