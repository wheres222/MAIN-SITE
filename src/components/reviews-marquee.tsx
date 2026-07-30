"use client";

import styles from "./reviews-marquee.module.css";

// Short, scannable one-liners — a marquee card is only on screen for a few
// seconds, so anything longer than a sentence never gets read.
const REVIEWS: string[] = [
  "Rust external survived the last force wipe. No issues.",
  "Arc Raiders key delivered in under a minute.",
  "R6 aimbot smoothing is the cleanest I've used.",
  "Ran Fortnite all through launch week. No detections.",
  "Discord support fixed my spoofer at 2am on a weekend.",
  "Three weeks in and anti-cheat hasn't sneezed at me.",
  "Streamproof overlay is legit — nothing leaks into OBS.",
  "Loader auto-updated after the patch. No reinstall.",
  "Zero crashes on a 6-hour Rust grind. FPS never dipped.",
  "Spoofer got me back into Fortnite first try.",
  "Bought Tuesday, game patched Wednesday, new build same day.",
  "Best support I've dealt with on any cheat site.",
];

function StarRow() {
  return (
    <div className={styles.stars} aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width="13"
          height="13"
          aria-hidden="true"
          className={styles.star}
        >
          <path
            d="m12 2.4 2.9 5.88 6.48.95-4.69 4.57 1.11 6.46L12 17.2l-5.8 3.06 1.1-6.46L2.6 9.23l6.5-.95L12 2.4Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

export function ReviewsMarquee() {
  // Duplicated so the -50% translate loops seamlessly: the reset lands on a
  // copy that is pixel-identical to the starting position.
  const doubled = [...REVIEWS, ...REVIEWS];

  return (
    <section className={styles.section} aria-label="Customer reviews">
      <header className={styles.heading}>
        <h2>What Our Users Say</h2>
        <p>Thousands of satisfied customers across all our products</p>
      </header>

      <div className={styles.row}>
        <div className={styles.track}>
          {doubled.map((text, i) => (
            <article className={styles.card} key={i}>
              <StarRow />
              <p className={styles.text}>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
