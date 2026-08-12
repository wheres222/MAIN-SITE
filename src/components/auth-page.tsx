"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode, useMemo } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import styles from "./auth-page.module.css";

interface AuthPageProps {
  defaultTab?: "login" | "register";
  next?: string;
  /** Message forwarded by /api/auth/callback when the OAuth round-trip fails. */
  initialError?: string;
}

/**
 * Turn the provider/config failures into something a human can act on.
 * Supabase returns "Unsupported provider: provider is not enabled" when the
 * provider exists but has not been switched on in the project dashboard, which
 * is by far the most common reason these buttons appear broken.
 */
function describeAuthError(message: string, provider: string): string {
  if (/provider is not enabled|unsupported provider/i.test(message)) {
    return `${provider} sign-in is not enabled on this Supabase project yet.`;
  }
  return message;
}

/**
 * Discord and Google sign-in are wired up but greyed out until their providers
 * are enabled on the Supabase project. Flip this to true to turn them back on —
 * nothing else needs changing.
 */
const SOCIAL_LOGIN_ENABLED: boolean = false;

/**
 * Shown instead of letting a request go out to the placeholder Supabase host,
 * which fails DNS and surfaces as a bare "NetworkError when attempting to fetch
 * resource" that says nothing about the actual cause.
 */
const NOT_CONFIGURED_MESSAGE =
  "Accounts are not configured on this deployment — NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.";

/**
 * Auth runs browser → Supabase directly, so our own server never sees a failed
 * login and cannot count them. This tells it. Fire-and-forget: a failure to
 * report must never surface to the person trying to sign in, and no credential
 * or entered email is ever sent.
 */
function reportAuthFailure(context: "login" | "register"): void {
  void fetch("/api/security/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "auth_failure", context }),
    keepalive: true,
  }).catch(() => undefined);
}

const PASSWORD_RULES = [
  { key: "length",  label: "At least 8 characters",       test: (pw: string) => pw.length >= 8 },
  { key: "number",  label: "At least 1 number",           test: (pw: string) => /\d/.test(pw) },
  { key: "special", label: "At least 1 special character", test: (pw: string) => /[^a-zA-Z0-9]/.test(pw) },
] as const;

function checkPassword(pw: string) {
  return {
    length:  PASSWORD_RULES[0].test(pw),
    number:  PASSWORD_RULES[1].test(pw),
    special: PASSWORD_RULES[2].test(pw),
  };
}

/** Checkbox that ticks itself once its rule passes. Not an <input> — it is a
 *  status readout, not something the user can toggle. */
function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={met ? styles.pwCheckPass : styles.pwCheckFail}>
      <span className={`${styles.pwCheckbox} ${met ? styles.pwCheckboxOn : ""}`} aria-hidden="true">
        {met && (
          <svg viewBox="0 0 24 24" fill="none" width="10" height="10">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span>{label}</span>
      <span className={styles.pwCheckState}>{met ? "met" : "remaining"}</span>
    </li>
  );
}

function Field({
  id, type, placeholder, value, onChange, icon, autoComplete, required,
}: {
  id: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void; icon: ReactNode; autoComplete?: string; required?: boolean;
}) {
  return (
    <div className={styles.inputWrap}>
      <span className={styles.inputIcon} aria-hidden="true">{icon}</span>
      <input
        id={id} type={type} className={styles.input} placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete} required={required}
      />
    </div>
  );
}

const IconMail = (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconLock = (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconUser = (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5 20c.8-3.5 3.5-5 7-5s6.2 1.5 7 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconTag = (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <path d="M3.5 12.5 11 5h6v6l-7.5 7.5a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <circle cx="14" cy="8" r="1.3" fill="currentColor" />
  </svg>
);

export function AuthPage({ defaultTab = "login", next = "/account", initialError = "" }: AuthPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(initialError);
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

  // Memoised: createClient() returns a new object each call, so building it
  // inline made every render produce a fresh client and made it unusable as an
  // effect dependency.
  const supabase = useMemo(() => createClient(), []);

  const pwChecks = checkPassword(regPassword);
  const pwTouched = regPassword.length > 0;
  const pwMetCount = PASSWORD_RULES.filter((rule) => pwChecks[rule.key]).length;
  const pwValid = pwMetCount === PASSWORD_RULES.length;

  async function handleOAuthLogin(
    provider: "discord" | "google",
    setLoading: (v: boolean) => void
  ) {
    setLoginError(""); setRegError("");
    // Without this the SDK happily redirects to the placeholder host, the
    // browser lands on a domain that does not resolve, and the button looks
    // like it silently did nothing.
    if (!isSupabaseConfigured) {
      setLoginError(NOT_CONFIGURED_MESSAGE);
      return;
    }
    setLoading(true);
    const label = provider === "discord" ? "Discord" : "Google";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) { setLoginError(describeAuthError(error.message, label)); setLoading(false); }
  }

  const handleDiscordLogin = () => handleOAuthLogin("discord", setDiscordLoading);
  const handleGoogleLogin = () => handleOAuthLogin("google", setGoogleLoading);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    if (!isSupabaseConfigured) { setLoginError(NOT_CONFIGURED_MESSAGE); return; }
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) { setLoginError(error.message); reportAuthFailure("login"); return; }
      router.push(next); router.refresh();
    } finally { setLoginLoading(false); }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    if (!isSupabaseConfigured) { setRegError(NOT_CONFIGURED_MESSAGE); return; }
    if (!pwChecks.length)  { setRegError("Password must be at least 8 characters."); return; }
    if (!pwChecks.number)  { setRegError("Password must contain at least one number."); return; }
    if (!pwChecks.special) { setRegError("Password must contain at least one special character."); return; }
    if (regPassword !== regConfirm) { setRegError("Passwords do not match."); return; }
    setRegLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail, password: regPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: { username: regUsername || undefined, referral_code_used: regReferral || undefined },
        },
      });
      if (error) { setRegError(error.message); return; }

      // A session comes back only when email confirmation is switched off in
      // Supabase — the account is already live and signed in. Telling those
      // users to check their inbox left them waiting for a mail that is never
      // sent, so send them straight into the site instead.
      if (data.session) {
        router.push(next);
        router.refresh();
        return;
      }

      // No session means a confirmation mail was requested. Deliberately the
      // same wording whether or not the address was already registered —
      // Supabase returns success with an empty `identities` array for existing
      // accounts precisely so the response can't be used to test which emails
      // have signed up, and a different message here would undo that.
      setRegSuccess("Check your email for a confirmation link.");
    } finally { setRegLoading(false); }
  }

  const socialDisabled = !SOCIAL_LOGIN_ENABLED || discordLoading || googleLoading;
  const socialFieldset = (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">Or continue with</legend>
      <div className={`${styles.socialRow} ${SOCIAL_LOGIN_ENABLED ? "" : styles.socialRowOff}`}>
        <button type="button" className={styles.socialBtn} onClick={handleDiscordLogin} disabled={socialDisabled} aria-label="Continue with Discord">
          <svg viewBox="0 0 127.14 96.36" fill="currentColor" width="20" height="20" aria-hidden>
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          Discord
        </button>
        <button type="button" className={styles.socialBtn} onClick={handleGoogleLogin} disabled={socialDisabled} aria-label="Continue with Google">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
      </div>
      {!SOCIAL_LOGIN_ENABLED && (
        <p className={styles.socialNote}>Social sign-in is coming soon — use your email and password for now.</p>
      )}
    </fieldset>
  );

  return (
    <main className={styles.authMain}>
      <div className={styles.authWrap}>
        <Link href="/" className={styles.brand} aria-label="CheatParadise home">
          Cheat<span className={styles.brandAccent}>Paradise</span>
        </Link>

        <section className="panel">
          <header className="panel-header">{tab === "login" ? "Login" : "Register"}</header>
          <div className="panel-body">
            {tab === "login" ? (
              <form onSubmit={handleLogin} className={styles.form}>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Enter your details below</legend>
                  <div className={styles.fields}>
                    <Field id="login-email" type="email" placeholder="Email address" value={loginEmail} onChange={setLoginEmail} icon={IconMail} autoComplete="email" required />
                    <Field id="login-password" type="password" placeholder="Password" value={loginPassword} onChange={setLoginPassword} icon={IconLock} autoComplete="current-password" required />
                    <div className={styles.forgotRow}>
                      <Link href="/forgot-password" className={styles.forgotLink}>Forgotten your password?</Link>
                    </div>
                  </div>
                </fieldset>
                {loginError && <p className={styles.error}>{loginError}</p>}
                <button type="submit" className={styles.primaryBtn} disabled={loginLoading}>
                  {loginLoading ? "Signing in…" : "Login"}
                </button>
                {socialFieldset}
                <p className={styles.switchLine}>
                  Not registered yet?{" "}
                  <button type="button" className={styles.switchBtn} onClick={() => { setTab("register"); setRegError(""); setRegSuccess(""); }}>Create an account</button>
                </p>
              </form>
            ) : regSuccess ? (
              <div className={styles.successBox}>
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
                  <path d="M20 6 9 17l-5-5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                  <strong>Almost there!</strong>
                  <p>{regSuccess}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className={styles.form}>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Account details</legend>
                  <div className={styles.fields}>
                    <Field id="reg-username" type="text" placeholder="Username (optional)" value={regUsername} onChange={setRegUsername} icon={IconUser} autoComplete="username" />
                    <Field id="reg-email" type="email" placeholder="Email address" value={regEmail} onChange={setRegEmail} icon={IconMail} autoComplete="email" required />
                    <Field id="reg-password" type="password" placeholder="Password" value={regPassword} onChange={setRegPassword} icon={IconLock} autoComplete="new-password" required />
                    {pwTouched && (
                      <div className={styles.pwPanel} aria-live="polite">
                        <p className={styles.pwSummary}>
                          {pwMetCount === PASSWORD_RULES.length
                            ? "All requirements met"
                            : `${pwMetCount} of ${PASSWORD_RULES.length} requirements met — ${PASSWORD_RULES.length - pwMetCount} remaining`}
                        </p>
                        <ul className={styles.pwChecklist}>
                          {PASSWORD_RULES.map((rule) => (
                            <PasswordRule key={rule.key} met={pwChecks[rule.key]} label={rule.label} />
                          ))}
                        </ul>
                      </div>
                    )}
                    <Field id="reg-confirm" type="password" placeholder="Confirm password" value={regConfirm} onChange={setRegConfirm} icon={IconLock} autoComplete="new-password" required />
                    <Field id="reg-referral" type="text" placeholder="Referral code (optional)" value={regReferral} onChange={(v) => setRegReferral(v.toUpperCase())} icon={IconTag} />
                  </div>
                </fieldset>
                {regError && <p className={styles.error}>{regError}</p>}
                <button type="submit" className={styles.primaryBtn} disabled={regLoading || !pwValid}>
                  {regLoading ? "Creating account…" : "Create Account"}
                </button>
                {socialFieldset}
                <p className={styles.switchLine}>
                  Already registered?{" "}
                  <button type="button" className={styles.switchBtn} onClick={() => { setTab("login"); setLoginError(""); }}>Login here</button>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
