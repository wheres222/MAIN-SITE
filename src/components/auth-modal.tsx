"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth-modal.module.css";

interface AuthModalProps {
  defaultTab?: "login" | "register";
  onClose: () => void;
}

function checkPassword(pw: string) {
  return {
    length:  pw.length >= 8,
    number:  /\d/.test(pw),
    special: /[^a-zA-Z0-9]/.test(pw),
  };
}

export function AuthModal({ defaultTab = "login", onClose }: AuthModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regReferral, setRegReferral] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const [discordLoading, setDiscordLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

  const pwChecks = checkPassword(regPassword);
  const pwTouched = regPassword.length > 0;
  const pwValid = pwChecks.length && pwChecks.number && pwChecks.special;

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

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setLoginError("");
    setRegError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/account`,
      },
    });
    if (error) {
      setLoginError(error.message);
      setGoogleLoading(false);
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
    if (!pwChecks.length)  { setRegError("Password must be at least 8 characters."); return; }
    if (!pwChecks.number)  { setRegError("Password must contain at least one number."); return; }
    if (!pwChecks.special) { setRegError("Password must contain at least one special character."); return; }
    if (regPassword !== regConfirm) { setRegError("Passwords do not match."); return; }
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

        {/* ── Left form panel ── */}
        <div className={styles.formPanel}>
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

          {/* Social sign-in */}
          <div className={styles.socialRow}>
            <button
              type="button"
              className={styles.discordBtn}
              onClick={handleDiscordLogin}
              disabled={discordLoading || googleLoading}
            >
              <svg className={styles.socialIcon} viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden>
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              Discord
            </button>

            <button
              type="button"
              className={styles.googleBtn}
              onClick={handleGoogleLogin}
              disabled={discordLoading || googleLoading}
            >
              <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>{tab === "login" ? "or sign in with email" : "or register with email"}</span>
            <span className={styles.dividerLine} />
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="auth-login-email" className={styles.label}>Email</label>
                <input
                  id="auth-login-email"
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <label htmlFor="auth-login-password" className={styles.label}>Password</label>
                  <a
                    href="/forgot-password"
                    onClick={onClose}
                    style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none" }}
                  >
                    Forgot password?
                  </a>
                </div>
                <input
                  id="auth-login-password"
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
                <label htmlFor="auth-reg-username" className={styles.label}>Username (optional)</label>
                <input
                  id="auth-reg-username"
                  type="text"
                  className={styles.input}
                  placeholder="YourUsername"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="auth-reg-email" className={styles.label}>Email</label>
                <input
                  id="auth-reg-email"
                  type="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="auth-reg-password" className={styles.label}>Password</label>
                <input
                  id="auth-reg-password"
                  type="password"
                  className={styles.input}
                  placeholder="Min. 8 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {pwTouched && (
                  <ul className={styles.pwChecklist}>
                    <li className={pwChecks.length  ? styles.pwCheckPass : styles.pwCheckFail}>
                      <span className={styles.pwCheckIcon}>{pwChecks.length  ? "✓" : "✗"}</span>
                      At least 8 characters
                    </li>
                    <li className={pwChecks.number  ? styles.pwCheckPass : styles.pwCheckFail}>
                      <span className={styles.pwCheckIcon}>{pwChecks.number  ? "✓" : "✗"}</span>
                      At least 1 number
                    </li>
                    <li className={pwChecks.special ? styles.pwCheckPass : styles.pwCheckFail}>
                      <span className={styles.pwCheckIcon}>{pwChecks.special ? "✓" : "✗"}</span>
                      At least 1 special character
                    </li>
                  </ul>
                )}
              </div>
              <div className={styles.field}>
                <label htmlFor="auth-reg-confirm" className={styles.label}>Confirm password</label>
                <input
                  id="auth-reg-confirm"
                  type="password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="auth-reg-referral" className={styles.label}>Referral code (optional)</label>
                <input
                  id="auth-reg-referral"
                  type="text"
                  className={styles.input}
                  placeholder="e.g. ABC12345"
                  value={regReferral}
                  onChange={(e) => setRegReferral(e.target.value.toUpperCase())}
                  autoComplete="off"
                />
              </div>
              {regError && <p className={styles.error}>{regError}</p>}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={regLoading || !pwValid}
              >
                {regLoading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}
        </div>

        {/* ── Right decorative panel ── */}
        <div className={styles.decorPanel}>
          <div className={styles.decorContent}>
            <img src="/branding/cp-logo.png" alt="" className={styles.decorLogo} aria-hidden />
            <p className={styles.decorTitle}>Cheat Paradise</p>
            <p className={styles.decorSub}>Premium game cheats with instant delivery and 24/7 support.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
