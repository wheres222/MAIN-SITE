"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthModal } from "@/components/auth-modal";
import { DepositModal } from "@/components/deposit-modal";

export type NavTab = "store" | "status" | "support" | "guide" | "loaders" | "videos" | "none";

interface SiteHeaderProps {
  activeTab: NavTab;
  searchSlot?: ReactNode;
}

function activeClass(current: NavTab, target: NavTab): string {
  return current === target ? "active" : "";
}

export function SiteHeader({ activeTab, searchSlot: _searchSlot }: SiteHeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [modal, setModal] = useState<"login" | "register" | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createClient();

  // Auto-open the auth modal when arriving via /?auth=login or /?auth=register
  // (these are how /login and /register routes redirect into the popup flow).
  useEffect(() => {
    const auth = searchParams.get("auth");
    if (auth === "login" || auth === "register") {
      setModal(auth);
    }
  }, [searchParams]);

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

  async function handleLogout() {
    setShowDropdown(false);
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
            <Link className="nav-left-logo" href="/" aria-label="CheatParadise home">
              <img src="/branding/cp-logo.png" alt="CheatParadise logo" className="nav-left-logo-mark" />
            </Link>

            <nav className="site-nav">
              <Link className={activeClass(activeTab, "store")} href="/">Store</Link>
              <Link className={activeClass(activeTab, "status")} href="/status">Status</Link>
              <Link className={activeClass(activeTab, "support")} href="/support">Support</Link>
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
                  title="Add balance"
                >
                  <span className="nav-balance-label">BALANCE</span>
                  <span className="nav-balance-amount">${(balance ?? 0).toFixed(2)}</span>
                  {/* Deposit plus icon */}
                  <span className="nav-balance-add">
                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden>
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
                    title={displayName}
                    aria-expanded={showDropdown}
                  >
                    <span className="nav-avatar">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="nav-avatar-img" />
                      ) : (
                        <span className="nav-avatar-initials">{initials}</span>
                      )}
                    </span>
                  </button>

                  {showDropdown && (
                    <div className="nav-dropdown">
                      <Link href="/account" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        Account
                      </Link>
                      <Link href="/account/settings" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        Settings
                      </Link>
                      <Link href="/account/balance" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        Transactions
                      </Link>
                      <Link href="/account/referrals" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        Affiliates
                      </Link>
                      <div className="nav-dropdown-item nav-dropdown-disabled">
                        Live Support
                        <span className="nav-dropdown-soon">Coming soon</span>
                      </div>

                      <div className="nav-dropdown-divider" />

                      <button type="button" className="nav-dropdown-item nav-dropdown-logout" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden>
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button type="button" className="nav-signin-btn" onClick={() => setModal("login")}>
                  Login
                </button>
                <button type="button" className="nav-register-btn" onClick={() => setModal("register")}>
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {modal && (
        <AuthModal
          defaultTab={modal}
          onClose={() => setModal(null)}
        />
      )}

      {showDeposit && (
        <DepositModal onClose={() => setShowDeposit(false)} />
      )}
    </>
  );
}
