"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { CartDrawer } from "@/components/cart-drawer";
import { getDiscordUrl } from "@/lib/links";

export type NavTab = "store" | "status" | "reviews" | "support";

interface SiteHeaderProps {
  activeTab: NavTab;
  searchSlot?: ReactNode;
}

function activeClass(current: NavTab, target: NavTab): string {
  return current === target ? "active" : "";
}

export function SiteHeader({ activeTab, searchSlot }: SiteHeaderProps) {
  const discordLink = getDiscordUrl();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="top-header">
        <div className="shell top-header-inner">
          <Link className="brand" href="/">
            <img
              src="/branding/cp-logo.png"
              alt="CheatParadise logo"
              className="brand-mark"
            />
            <span className="brand-text">
              <span className="brand-word brand-word-cheat">cheat</span>
              <span className="brand-word brand-word-paradise">paradise</span>
              <span className="brand-word brand-word-domain">.com</span>
            </span>
          </Link>
          <a className="discord-btn" href={discordLink} target="_blank" rel="noreferrer">
            <img src="/social/discord.png" alt="" aria-hidden="true" className="btn-icon" />
            Discord
          </a>
        </div>
      </header>

      <div className="nav-row">
        <div className="shell nav-row-inner">
          <nav className="site-nav">
            <Link className={activeClass(activeTab, "store")} href="/">
              <span className="nav-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 7h14l-1 12H6L5 7Z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </span>
              Store
            </Link>
            <Link className={activeClass(activeTab, "status")} href="/status">
              <span className="nav-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 16h3v4H5v-4Zm5-6h3v10h-3V10Zm5-5h3v15h-3V5Z" fill="currentColor" />
                </svg>
              </span>
              Status
            </Link>
            <Link className={activeClass(activeTab, "reviews")} href="/reviews">
              <span className="nav-icon nav-icon-reviews" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="m12 4 2 4 4.5.6-3.4 3 1 4.6L12 14.8 7.9 16.2l1-4.6-3.4-3L10 8l2-4Z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              </span>
              Reviews
            </Link>
            <Link className={activeClass(activeTab, "support")} href="/support">
              <span className="nav-icon nav-icon-support" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4.8 13.2a7.2 7.2 0 1 1 14.4 0v4.1a2.2 2.2 0 0 1-2.2 2.2h-.6a2.2 2.2 0 0 1-2.2-2.2v-3a2.2 2.2 0 0 1 2.2-2.2h2.2M7.6 12.1H6.4a2.2 2.2 0 0 0-2.2 2.2v3a2.2 2.2 0 0 0 2.2 2.2h.6a2.2 2.2 0 0 0 2.2-2.2v-3a2.2 2.2 0 0 0-1.6-2.1Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Support
            </Link>
          </nav>

          <div className="nav-row-actions">
            {searchSlot || <div className="search-wrap search-static" />}
            <button className="site-nav-cart" type="button" onClick={() => setCartOpen(true)}>
              <span className="nav-icon" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 5h2l1.6 8.1a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.6L20 8H7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="9" cy="19" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="19" r="1.5" fill="currentColor" />
                </svg>
              </span>
              Cart
            </button>
          </div>
        </div>
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
