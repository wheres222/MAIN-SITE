"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./reset-password.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  const supabase = createClient();

  // Supabase puts the recovery token in the URL hash; the client SDK
  // exchanges it automatically on load and fires an AUTH_STATE_CHANGE
  // with event "PASSWORD_RECOVERY".
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
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
          <img src="/branding/cp-logo.png" alt="Cheat Paradise" className={styles.logoImg} />
        </div>

        {done ? (
          <>
            <div className={styles.successIcon} aria-hidden>✅</div>
            <h1 className={styles.title}>Password updated</h1>
            <p className={styles.subtitle}>Your password has been changed. Redirecting you to your account…</p>
          </>
        ) : !ready ? (
          <>
            <h1 className={styles.title}>Verifying link…</h1>
            <p className={styles.subtitle}>
              Please wait while we verify your reset link. If nothing happens, your link may have expired —{" "}
              <Link href="/forgot-password" className={styles.link}>request a new one</Link>.
            </p>
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
