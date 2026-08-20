"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/confirm-dialog";
import styles from "../account.module.css";
import pStyles from "./settings.module.css";

function checkPassword(pw: string) {
  return {
    length:  pw.length >= 8,
    number:  /\d/.test(pw),
    special: /[^a-zA-Z0-9]/.test(pw),
  };
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [lastSignIn, setLastSignIn] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);
  // The form is collapsed until asked for, so the page opens as a summary of
  // the account's security rather than as a form nobody came here to fill in.
  const [pwOpen, setPwOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Memoised: createClient() returns a new object each call, so building it
  // inline made every render produce a fresh client and made it unusable as an
  // effect dependency.
  const supabase = useMemo(() => createClient(), []);

  const pwChecks = checkPassword(newPassword);
  const pwTouched = newPassword.length > 0;
  const pwValid = pwChecks.length && pwChecks.number && pwChecks.special;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email || "");
      setEmailVerified(Boolean(user.email_confirmed_at));
      setLastSignIn(user.last_sign_in_at || "");
    });
  }, [supabase]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setNotice({ text: "", type: "" });

    if (!currentPassword) {
      setNotice({ text: "Enter your current password.", type: "error" });
      return;
    }
    if (!pwChecks.length) {
      setNotice({ text: "New password must be at least 8 characters.", type: "error" });
      return;
    }
    if (!pwChecks.number) {
      setNotice({ text: "New password must contain at least one number.", type: "error" });
      return;
    }
    if (!pwChecks.special) {
      setNotice({ text: "New password must contain at least one special character.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ text: "New passwords do not match.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInErr) {
        setNotice({ text: "Current password is incorrect.", type: "error" });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setNotice({ text: error.message, type: "error" });
        return;
      }
      setNotice({ text: "Password updated successfully.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function confirmSignOut() {
    setShowSignOutConfirm(false);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Security</h1>
        <p className={styles.pageSub}>Manage your password and sign-in details.</p>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionIcon}>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <h2 className={styles.sectionTitle}>Security</h2>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingName}>Password</span>
            <span className={styles.settingDesc}>
              Update your password to keep your account secure.
            </span>
          </div>
          <div className={styles.settingAction}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => setPwOpen((v) => !v)}
            >
              {pwOpen ? "Cancel" : "Change password"}
            </button>
          </div>
        </div>

        {pwOpen && (
          <div className={styles.sectionBody}>
            <form onSubmit={handleChangePassword} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Current password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>New password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {pwTouched && (
                  <ul className={pStyles.pwChecklist}>
                    <li className={pwChecks.length  ? pStyles.pwCheckPass : pStyles.pwCheckFail}>
                      <span className={pStyles.pwCheckIcon}>{pwChecks.length  ? "✓" : "✗"}</span>
                      At least 8 characters
                    </li>
                    <li className={pwChecks.number  ? pStyles.pwCheckPass : pStyles.pwCheckFail}>
                      <span className={pStyles.pwCheckIcon}>{pwChecks.number  ? "✓" : "✗"}</span>
                      At least 1 number
                    </li>
                    <li className={pwChecks.special ? pStyles.pwCheckPass : pStyles.pwCheckFail}>
                      <span className={pStyles.pwCheckIcon}>{pwChecks.special ? "✓" : "✗"}</span>
                      At least 1 special character
                    </li>
                  </ul>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Confirm password</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {notice.text && (
                <p className={notice.type === "error" ? styles.error : styles.success}>
                  {notice.text}
                </p>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={saving || (pwTouched && !pwValid)}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        )}

        {/* Shown outside the collapsed form so a success message is not hidden
            the moment the form closes itself. */}
        {!pwOpen && notice.text && (
          <div className={styles.sectionBody}>
            <p className={notice.type === "error" ? styles.error : styles.success}>
              {notice.text}
            </p>
          </div>
        )}

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingName}>Email address</span>
            <span className={styles.settingDesc}>{email || "—"}</span>
          </div>
          <div className={styles.settingAction}>
            {/* Reflects auth.users.email_confirmed_at rather than assuming: an
                account that signed up before confirmation was enforced will
                correctly show as unverified. */}
            <span className={`${styles.pill} ${emailVerified ? styles.pillOk : styles.pillWarn}`}>
              {emailVerified ? "Verified" : "Unverified"}
            </span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingName}>Last sign-in</span>
            <span className={styles.settingDesc}>
              The most recent time this account was signed into.
            </span>
          </div>
          <div className={styles.settingAction}>
            <span className={styles.pill}>{formatDate(lastSignIn)}</span>
          </div>
        </div>
      </section>

      <section className={styles.dangerZone}>
        <div className={styles.dangerHead}>
          <span className={styles.dangerIcon}>
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden>
              <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2 className={styles.dangerTitle}>Danger zone</h2>
        </div>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingName}>Sign out</span>
            <span className={styles.settingDesc}>Sign out of your account on this device.</span>
          </div>
          <div className={styles.settingAction}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={() => setShowSignOutConfirm(true)}
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      {showSignOutConfirm && (
        <ConfirmDialog
          title="Sign out?"
          message="You'll need to sign back in to access your account, orders, and balance."
          confirmLabel="Sign out"
          cancelLabel="Stay signed in"
          destructive
          onConfirm={confirmSignOut}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </>
  );
}
