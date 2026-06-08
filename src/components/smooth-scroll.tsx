"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Site-wide smooth scroll via Lenis. Mounts once, ticks via rAF.
 *
 * Behaviour:
 * - Desktop: momentum-style smooth scrolling on wheel + keyboard
 * - Touch devices: Lenis disables itself (`smoothTouch: false`) so native
 *   mobile inertia stays untouched (native is better than synthetic on iOS).
 * - Honors prefers-reduced-motion: stops and returns to native scroll.
 * - Keeps anchor links + #hash navigation working (Lenis intercepts and
 *   smoothly scrolls to the target).
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      // Lerp mode: interpolates a fixed fraction toward target every frame.
      // Lower = smoother (more frames blending) but mushier feel.
      // 0.08 is the Apple/Linear butter-smooth range. Default 0.1 is also fine.
      lerp: 0.08,
      // Wheel multiplier — keep at 1.0 so a single wheel tick travels the
      // same distance as native (otherwise scrolling feels too slow/fast).
      wheelMultiplier: 1,
      smoothWheel: true,
      // Touch: native iOS / Android inertia beats anything Lenis can do.
      syncTouch: false,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
