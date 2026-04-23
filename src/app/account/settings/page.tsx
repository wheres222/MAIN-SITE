"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "../account.module.css";
import pStyles from "./settings.module.css";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email || "");
    });
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setNotice({ text: "", type: "" });

    if (!currentPassword) {
      setNotice({ text: "Enter your current password.", type: "error" });
      return;
    }
    if (newPassword.length < 8) {
      setNotice({ text: "New password must be at least 8 characters.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ text: "New passwords do not match.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      // Verify current password by re-authenticating
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
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={pStyles.page}>
      <div className={pStyles.header}>
        <h1 className={pStyles.title}>Password</h1>
        <p className={pStyles.sub}>Change your password. Make sure it&apos;s secure!</p>
      </div>

      <div className={pStyles.formWrap}>
        <form onSubmit={handleChangePassword} className={pStyles.form}>
          <div className={styles.field}>
            <label className={pStyles.fieldLabel}>Current Password</label>
            <input
              type="password"
              className={pStyles.input}
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className={styles.field}>
            <label className={pStyles.fieldLabel}>New Password</label>
            <input
              type="password"
              className={pStyles.input}
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={pStyles.fieldLabel}>Confirm Password</label>
            <input
              type="password"
              className={pStyles.input}
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

          <div className={pStyles.footer}>
            <button type="submit" className={pStyles.saveBtn} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
