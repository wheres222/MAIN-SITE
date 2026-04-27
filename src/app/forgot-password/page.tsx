"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
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

        {sent ? (
          <>
            <div className={styles.successIcon} aria-hidden>✉️</div>
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.subtitle}>
              We sent a password reset link to <strong>{email}</strong>. Check your inbox and click the link to set a new password.
            </p>
            <p className={styles.resendNote}>
              Didn&apos;t get it? Check your spam folder, or{" "}
              <button className={styles.resendBtn} onClick={() => setSent(false)}>
                try a different email
              </button>
              .
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Reset your password</h1>
            <p className={styles.subtitle}>
              Enter the email address on your account and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
