"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PreferencesSwitcher } from "@/components/preferences-switcher";
import { usePreferences } from "@/components/preferences-provider";
import { useCart } from "@/components/cart-provider";

export type NavTab = "store" | "status" | "support" | "guide" | "loaders" | "videos" | "none";

interface SiteHeaderProps {
  activeTab: NavTab;
  searchSlot?: ReactNode;
}

export function SiteHeader({ activeTab: _activeTab, searchSlot: _searchSlot }: SiteHeaderProps) {
  const { t } = usePreferences();
  const { count: cartCount, openCart } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname() || "/";

  // Memoised: createClient() returns a new object each call, so building it
  // inline made every render produce a fresh client and made it unusable as an
  // effect dependency.
  const supabase = useMemo(() => createClient(), []);

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
  }, [supabase]);

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

  // Where the auth pages should send someone afterwards. Auth and callback
  // routes are excluded so a round trip through them cannot make itself the
  // destination.
  const returnTo = /^\/(login|register|forgot-password|reset-password|api)/.test(pathname)
    ? "/account"
    : pathname;

  return (
    <>
      <div className={`nav-row${scrolled ? " nav-row--scrolled" : ""}`}>
        <div className="shell nav-row-inner">
          <div className="nav-row-left">
            <Link className="nav-left-logo" href="/" aria-label="Cheat Paradise home">
              <img src="/branding/cp-logo.webp" alt="" width={40} height={40} className="nav-left-logo-mark" />
            </Link>

            <nav className="site-nav" aria-label="Main navigation">
              <Link className={pathname === "/" ? "active" : ""} href="/">{t("nav.home")}</Link>
              <Link className={pathname.startsWith("/products") ? "active" : ""} href="/products">{t("nav.products")}</Link>
              <Link className={pathname.startsWith("/guide") ? "active" : ""} href="/guide">{t("nav.guides")}</Link>
              <Link className={pathname.startsWith("/status") ? "active" : ""} href="/status">{t("nav.status")}</Link>
            </nav>
          </div>

          <div className="nav-row-actions">
            <button
              type="button"
              onClick={openCart}
              className="nav-cart-btn"
              aria-label={t("cart.cart")}
            >
              <svg viewBox="0 0 24 24" fill="none" width="17" height="17" aria-hidden>
                <path
                  d="M3 4h2.2l2.1 10.4a1.8 1.8 0 0 0 1.8 1.4h7.6a1.8 1.8 0 0 0 1.8-1.4L20.5 7H6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="20" r="1.4" fill="currentColor" />
                <circle cx="17" cy="20" r="1.4" fill="currentColor" />
              </svg>
              {cartCount > 0 && <span className="nav-cart-count">{cartCount}</span>}
            </button>

            <PreferencesSwitcher />

            {isLoggedIn ? (
              <div className="nav-user-group">
                {/* Balance bar. A link to a real page rather than a popup, so
                    the deposit flow is shareable, back-button-friendly, and
                    doesn't trap the page behind an overlay. */}
                <Link
                  href="/account/deposit"
                  className="nav-balance-btn"
                  aria-label={t("auth.addBalance")}
                >
                  <span className="nav-balance-label">{t("auth.balance")}</span>
                  <span className="nav-balance-amount">${(balance ?? 0).toFixed(2)}</span>
                  {/* Deposit plus icon */}
                  <span className="nav-balance-add" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  </span>
                </Link>

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
                      {/* A page, like every other item in this menu. The
                          dashboard used to open in a modal, which meant the
                          same content was implemented twice and the cramped
                          copy was the one most people saw. */}
                      <Link href="/account" role="menuitem" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        {t("auth.dashboard")}
                      </Link>
                      <Link href="/account/settings" role="menuitem" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        {t("auth.settings")}
                      </Link>
                      <Link href="/account/balance" role="menuitem" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        {t("auth.transactions")}
                      </Link>
                      <Link href="/account/referrals" role="menuitem" className="nav-dropdown-item" onClick={() => setShowDropdown(false)}>
                        {t("auth.affiliates")}
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
                {/* Carry the current page so signing in or up returns here
                    rather than dumping everyone in the dashboard. Someone
                    reading a product page who registers wants to end up back on
                    that product page. Auth routes themselves are excluded so a
                    bounce between login and register cannot make next="/login". */}
                <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="nav-text-btn">
                  Log In
                </Link>
                <span className="nav-text-sep" aria-hidden="true">/</span>
                <Link href={`/register?next=${encodeURIComponent(returnTo)}`} className="nav-text-btn">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Skip-link target — placed after the nav so keyboard users land here */}
      <span id="main-content" aria-hidden="true" />

      {showSignOutConfirm && (
        <ConfirmDialog
          title={t("auth.signOutConfirmTitle")}
          message={t("auth.signOutConfirmBody")}
          confirmLabel={t("auth.signOut")}
          cancelLabel={t("auth.staySignedIn")}
          destructive
          onConfirm={confirmLogout}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </>
  );
}
