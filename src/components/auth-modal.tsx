"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth-modal.module.css";

interface AuthModalProps {
  defaultTab?: "login" | "register";
  onClose: () => void;
}

export function AuthModal({ defaultTab = "login", onClose }: AuthModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regReferral, setRegReferral] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const [discordLoading, setDiscordLoading] = useState(false);

  const supabase = createClient();

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleDiscordLogin() {
    setDiscordLoading(true);
    setLoginError("");
    setRegError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/account`,
      },
    });
    if (error) {
      setLoginError(error.message);
      setDiscordLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) { setLoginError(error.message); return; }
      onClose();
      router.push("/account");
      router.refresh();
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (regPassword !== regConfirm) { setRegError("Passwords do not match."); return; }
    if (regPassword.length < 8) { setRegError("Password must be at least 8 characters."); return; }
    setRegLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: {
            username: regUsername || undefined,
            referral_code_used: regReferral || undefined,
          },
        },
      });
      if (error) { setRegError(error.message); return; }
      setRegSuccess("Check your email for a confirmation link.");
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick} aria-modal="true" role="dialog">
      <div className={styles.modal}>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className={styles.logo}>
          <img src="/branding/cp-logo.png" alt="Cheat Paradise" className={styles.logoImg} />
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "login" ? styles.tabBtnActive : ""}`}
            onClick={() => { setTab("login"); setLoginError(""); }}
          >
            Login
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "register" ? styles.tabBtnActive : ""}`}
            onClick={() => { setTab("register"); setRegError(""); setRegSuccess(""); }}
          >
            Register
          </button>
        </div>

        <button
          type="button"
          className={styles.discordBtn}
          onClick={handleDiscordLogin}
          disabled={discordLoading}
        >
          <svg className={styles.discordIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Continue with Discord
        </button>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>{tab === "login" ? "or sign in with email" : "or register with email"}</span>
          <span className={styles.dividerLine} />
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {loginError && <p className={styles.error}>{loginError}</p>}
            <button type="submit" className={styles.submitBtn} disabled={loginLoading}>
              {loginLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        ) : regSuccess ? (
          <div className={styles.successBox}>
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden>
              <path d="M20 6 9 17l-5-5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {regSuccess}
          </div>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Username (optional)</label>
              <input
                type="text"
                className={styles.input}
                placeholder="YourUsername"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Min. 8 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Confirm password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Referral code (optional)</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. ABC12345"
                value={regReferral}
                onChange={(e) => setRegReferral(e.target.value.toUpperCase())}
                autoComplete="off"
              />
            </div>
            {regError && <p className={styles.error}>{regError}</p>}
            <button type="submit" className={styles.submitBtn} disabled={regLoading}>
              {regLoading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
