"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Before/after comparison slider.
 *
 * The "after" image sits underneath and the "before" image is clipped on top,
 * so dragging only changes one clip-path — no reflow, no image reload.
 *
 * Dragging is driven by a full-size range input laid over the frame at zero
 * opacity. That is deliberate: it gives pointer, touch and keyboard control
 * for free, and screen readers announce it as a slider, which hand-rolled
 * pointermove handlers would not.
 */
export function EspCompare() {
  const [split, setSplit] = useState(50);

  return (
    <figure className="esp-compare" style={{ ["--split" as string]: `${split}%` }}>
      <div className="esp-compare-frame">
        {/* After — full cheat overlay, sits underneath */}
        <Image
          className="esp-compare-img"
          src="/compare/visible-to-you.avif"
          alt="The same scene with the cheat overlay active: enemies outlined through walls with distance and name tags"
          width={1920}
          height={1080}
          sizes="(max-width: 1120px) 100vw, 1080px"
        />

        {/* Before — clean frame, clipped to the left of the divider */}
        <Image
          className="esp-compare-img esp-compare-before"
          src="/compare/anticheat-sees.avif"
          alt="The scene as the anti-cheat sees it, with no overlay drawn"
          width={1920}
          height={1080}
          sizes="(max-width: 1120px) 100vw, 1080px"
        />

        <span className="media-pill esp-compare-label esp-compare-label-left">Anti-cheat sees</span>
        <span className="media-pill esp-compare-label esp-compare-label-right">Visible to you</span>

        <span className="esp-compare-divider" aria-hidden="true">
          <span className="esp-compare-handle">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </span>

        <input
          className="esp-compare-range"
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          aria-label="Reveal how much of the cheat overlay is shown"
        />
      </div>
    </figure>
  );
}
