"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { PostHog } from "posthog-js";

// posthog-js is ~90KB gzipped. Importing it statically put it in the initial
// bundle on every page — the single biggest "unused JavaScript" item in
// PageSpeed. Instead we dynamic-import it once the browser is idle (or on the
// first user interaction, whichever comes first), so it never competes with
// LCP/hydration on the critical path.
let phInstance: PostHog | null = null;
let phLoading: Promise<PostHog | null> | null = null;

function currentUrl(): string {
  return window.origin + window.location.pathname + window.location.search;
}

function loadPostHog(): Promise<PostHog | null> {
  if (phLoading) return phLoading;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return Promise.resolve(null);

  phLoading = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
    });
    phInstance = posthog;
    // Capture the landing pageview that happened before the SDK loaded.
    posthog.capture("$pageview", { $current_url: currentUrl() });
    return posthog;
  });
  return phLoading;
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Kick off the deferred load: idle callback with a timeout fallback, or the
  // first user interaction — whichever fires first.
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      cleanup();
      loadPostHog();
    };

    const events: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    const cleanup = () => {
      for (const ev of events) window.removeEventListener(ev, start);
    };
    for (const ev of events) {
      window.addEventListener(ev, start, { once: true, passive: true });
    }

    const hasIdleCallback = typeof window.requestIdleCallback === "function";
    const idleId = hasIdleCallback
      ? window.requestIdleCallback(start, { timeout: 5000 })
      : window.setTimeout(start, 3500);

    return () => {
      cleanup();
      if (hasIdleCallback) {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, []);

  // SPA route changes. The initial pageview is captured inside loadPostHog(),
  // so skip until the SDK is actually loaded.
  useEffect(() => {
    if (!pathname || !phInstance) return;
    const url =
      searchParams.size > 0
        ? `${window.origin}${pathname}?${searchParams.toString()}`
        : `${window.origin}${pathname}`;
    phInstance.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <PageViewTracker />
      </Suspense>
      {children}
    </>
  );
}
