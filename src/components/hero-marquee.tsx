import type { ReactNode } from "react";

type MarqueeItem = { icon: ReactNode; label: string };

const ITEMS: MarqueeItem[] = [
  {
    label: "99% Satisfaction Rate",
    icon: (
      // Shield with checkmark — filled
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
    ),
  },
  {
    label: "24/7 Protection",
    icon: (
      // Shield — filled
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      </svg>
    ),
  },
  {
    label: "100% Safe",
    icon: (
      // WiFi — filled arcs
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 4C7.95 4 4.21 5.34 1.2 7.6L3 10a14.9 14.9 0 0 1 18 0l1.8-2.4C19.79 5.34 16.05 4 12 4zm0 5c-2.7 0-5.19.89-7.2 2.4L6.6 13.8a8.94 8.94 0 0 1 10.8 0L19.2 11.4A11.95 11.95 0 0 0 12 9zm0 5c-1.35 0-2.6.45-3.6 1.2L12 19.5l3.6-4.3A5.96 5.96 0 0 0 12 14z" />
      </svg>
    ),
  },
  {
    label: "4.9 Average Rating",
    icon: (
      // Star — filled
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ),
  },
];

/**
 * Pure-CSS infinite marquee. One "half" of the loop contains enough item
 * replicas to be wider than any reasonable viewport (up to ~5K); the second
 * half is an exact clone. The track translates 0 → -50%, which lands at the
 * start of the second half → seamless loop with no visible cut-off on wide
 * screens.
 *
 * Spacing lives on each item (padding-inline-end), NOT the track (`gap`) —
 * gap adds extra space at the wrap point and creates a visible jump.
 */
const REPEAT_PER_HALF = 6;

export function HeroMarquee() {
  const oneHalf = Array.from({ length: REPEAT_PER_HALF }, () => ITEMS).flat();
  const loop = [...oneHalf, ...oneHalf];
  return (
    <div className="hero-marquee" aria-label="Trust indicators">
      <div className="hero-marquee-track">
        {loop.map((item, i) => (
          <div
            key={i}
            className="hero-marquee-item"
            aria-hidden={i >= oneHalf.length}
          >
            <span className="hero-marquee-icon">{item.icon}</span>
            <span className="hero-marquee-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
