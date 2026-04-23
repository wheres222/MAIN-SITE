"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./register.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleDiscordSignup() {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/account`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: {
            username: username || undefined,
            referral_code_used: referralCode || undefined,
          },
        },
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSuccess("Check your email for a confirmation link to activate your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.backLink}>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="16" height="16">
          <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to store
      </Link>

      <div className={styles.card}>
        <div className={styles.logo}>
          <img src="/branding/cp-logo.png" alt="Cheat Paradise" className={styles.logoImg} />
        </div>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Join thousands of Cheat Paradise members</p>

        {success ? (
          <div className={styles.successBox}>
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden>
              <path d="M20 6 9 17l-5-5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {success}
          </div>
        ) : (
          <>
            <button
              type="button"
              className={styles.discordBtn}
              onClick={handleDiscordSignup}
              disabled={loading}
            >
              <svg className={styles.discordIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
              </svg>
              Sign up with Discord
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>or register with email</span>
              <span className={styles.dividerLine} />
            </div>

            <form onSubmit={handleRegister} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="username" className={styles.label}>Username (optional)</label>
                <input
                  id="username"
                  type="text"
                  className={styles.input}
                  placeholder="YourUsername"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
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
              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>Password</label>
                <input
                  id="password"
                  type="password"
                  className={styles.input}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="confirm" className={styles.label}>Confirm password</label>
                <input
                  id="confirm"
                  type="password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="referral" className={styles.label}>Referral code (optional)</label>
                <input
                  id="referral"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. ABC12345"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  autoComplete="off"
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>

            <p className={styles.switchText}>
              Already have an account?{" "}
              <Link href="/login" className={styles.switchLink}>Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
