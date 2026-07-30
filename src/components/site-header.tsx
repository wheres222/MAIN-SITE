"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DepositModal } from "@/components/deposit-modal";
import { AccountModal } from "@/components/account-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";

export type NavTab = "store" | "status" | "support" | "guide" | "loaders" | "videos" | "none";

interface SiteHeaderProps {
  activeTab: NavTab;
  searchSlot?: ReactNode;
}

export function SiteHeader({ activeTab: _activeTab, searchSlot: _searchSlot }: SiteHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname() || "/";

  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setIsLoggedIn(true);
      setAvatarUrl(
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null
      );
      setDisplayName(
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.username ||
        user.email?.split("@")[0] ||
        "Account"
      );

      const { data: profile } = await supabase
        .from("profiles")
        .select("balance, username")
        .eq("id", user.id)
        .single();

      if (profile) {
        setBalance(profile.balance ?? 0);
        if (profile.username) setDisplayName(profile.username);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        setBalance(null);
        setAvatarUrl(null);
        setShowDropdown(false);
      } else if (event === "SIGNED_IN") {
        loadUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showDropdown]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function requestLogout() {
    setShowDropdown(false);
    setShowSignOutConfirm(true);
  }

  async function confirmLogout() {
    setShowSignOutConfirm(false);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <div className={`nav-row${scrolled ? " nav-row--scrolled" : ""}`}>
        <div className="shell nav-row-inner">
          <div className="nav-row-left">
            <Link className="nav-left-logo" href="/" aria-label="Cheat Paradise home">
              <img src="/branding/cp-logo.webp" alt="" width={40} height={40} className="nav-left-logo-mark" />
            </Link>

            <nav className="site-nav" aria-label="Main navigation">
              <Link className={pathname === "/" ? "active" : ""} href="/">Home</Link>
              <Link className={pathname.startsWith("/products") ? "active" : ""} href="/products">Products</Link>
              <Link className={pathname.startsWith("/guide") ? "active" : ""} href="/guide">Guides</Link>
              <Link className={pathname.startsWith("/status") ? "active" : ""} href="/status">Status</Link>
            </nav>
          </div>

          <div className="nav-row-actions">
            {isLoggedIn ? (
              <div className="nav-user-group">
                {/* Balance bar */}
                <button
                  type="button"
                  className="nav-balance-btn"
                  onClick={() => setShowDeposit(true)}
                  aria-label="Add account balance"
                >
                  <span className="nav-balance-label">BALANCE</span>
                  <span className="nav-balance-amount">${(balance ?? 0).toFixed(2)}</span>
                  {/* Deposit plus icon */}
                  <span className="nav-balance-add" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                {/* Avatar dropdown */}
                <div className="nav-avatar-wrap" ref={dropdownRef}>
                  <button
                    type="button"
                    className="nav-avatar-btn"
                    onClick={() => setShowDropdown((v) => !v)}
                    aria-label={displayName ? `Account menu for ${displayName}` : "Account menu"}
                    aria-expanded={showDropdown}
                    aria-haspopup="menu"
                  >
                    <span className="nav-avatar">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} width={36} height={36} className="nav-avatar-img" />
                      ) : (
                        <span className="nav-avatar-initials" aria-hidden="true">{initials}</span>
                      )}
                    </span>
                  </button>

                  {showDropdown && (
                    <div className="nav-dropdown" role="menu" aria-label="Account options">
                      <button
                        type="button"
                        role="menuitem"
                        className="nav-dropdown-item"
                        onClick={() => { setShowDropdown(false); setShowAccountModal(true); }}
                      >
                        Dashboard
                      </button>
                      <Link href="/account/settings" role="menuitem" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        Settings
                      </Link>
                      <Link href="/account/balance" role="menuitem" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        Transactions
                      </Link>
                      <Link href="/account/referrals" role="menuitem" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        Affiliates
                      </Link>
                      <div role="menuitem" aria-disabled="true" className="nav-dropdown-item nav-dropdown-disabled">
                        Live Support
                        <span className="nav-dropdown-soon">Coming soon</span>
                      </div>

                      <div className="nav-dropdown-divider" role="separator" />

                      <button type="button" role="menuitem" className="nav-dropdown-item nav-dropdown-logout" onClick={requestLogout}>
                        <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="nav-auth-links">
                <Link href="/login" className="nav-text-btn">
                  Log In
                </Link>
                <span className="nav-text-sep" aria-hidden="true">/</span>
                <Link href="/register" className="nav-text-btn">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Skip-link target — placed after the nav so keyboard users land here */}
      <span id="main-content" aria-hidden="true" />

      {showDeposit && (
        <DepositModal onClose={() => setShowDeposit(false)} />
      )}

      {showAccountModal && (
        <AccountModal onClose={() => setShowAccountModal(false)} />
      )}

      {showSignOutConfirm && (
        <ConfirmDialog
          title="Sign out?"
          message="You'll need to sign back in to access your account, orders, and balance."
          confirmLabel="Sign out"
          cancelLabel="Stay signed in"
          destructive
          onConfirm={confirmLogout}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </>
  );
}
