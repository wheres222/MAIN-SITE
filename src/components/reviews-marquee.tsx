"use client";

import styles from "./reviews-marquee.module.css";

// Reviews are personalised to Cheat Paradise's actual product lineup —
// Rust, Arc Raiders, Rainbow Six Siege, Fortnite, plus HWID spoofers.
// Mix of feature mentions, support feedback, and specific delivery wins.
const ROW_1: string[] = [
  "Rust external cheat survived the last force wipe with no issues — already paid for itself in two raids.",
  "Got my Arc Raiders ESP key delivered in under a minute. Loot filter actually highlights the gold tier loot correctly.",
  "R6 Siege aimbot smoothing curve is the cleanest I've used. Doesn't snap, doesn't flag.",
  "Fortnite cheat ran through the entire chapter launch week without a single detection scare.",
  "Discord support answered me at 2am on a weekend. Got my HWID spoofer reconfigured in ten minutes.",
  "Instructions were dead simple. Anti-cheat hasn't even sneezed at me in 3 weeks.",
  "Bought the Rust internal and the streamproof overlay is legit — nothing leaks into OBS.",
  "Loader auto-updated after the Y10S2 patch. Didn't even have to reinstall.",
];

const ROW_2: string[] = [
  "Arc Raiders silent aim is genuinely undetectable from a spectator's POV. Squadmates have no clue.",
  "Compared to two other sites I've used, Cheat Paradise's loader is the only one that hasn't bricked on a patch.",
  "Zero crashes on Rust through a 6-hour solo grind. ESP rendering didn't dip my FPS once.",
  "Temporary HWID spoofer got me back into Fortnite after a hardware ban scare. Worked first try.",
  "Permanent spoofer setup guide walked me through every step — no Googling required.",
  "Picked up the R6 cheat as a complete beginner. The drone radar alone is worth the price.",
  "Fortnite aimbot prediction works at any range. Tracking moving targets across the map feels natural.",
  "Dashboard is clean, account page is clean, checkout is clean. Whole experience just feels professional.",
];

const ROW_3: string[] = [
  "Arc Raiders cheat handles solo extractions perfectly — extraction point ESP saved me from a third-party twice already.",
  "R6 Siege operator ESP shows gadget loadouts which is what actually wins rounds, not just position.",
  "Rust HWID spoofer plus external bundle was the right call. Subscription rolls over through every wipe.",
  "Honestly the Discord community alone is worth it — people share configs and tips constantly.",
  "Fortnite cheat works on EU and NA servers identically. No region lockout nonsense.",
  "Bought it on a Tuesday, R6 patched Wednesday, the new build was live by Wednesday afternoon.",
  "Refund policy is upfront — read it before buying. No surprises, fair terms.",
  "Customer support is genuinely the best I've dealt with on any cheat site. Real humans, fast replies.",
];

function StarRow() {
  return (
    <div className={styles.stars} aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width="14"
          height="14"
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

function ReviewCard({ text }: { text: string }) {
  return (
    <article className={styles.card}>
      <StarRow />
      <p className={styles.text}>{text}</p>
    </article>
  );
}

function Row({ items, direction }: { items: string[]; direction: "left" | "right" }) {
  // Duplicate the items so the translateX animation loops seamlessly.
  // The track moves a full content-width before resetting; with the content
  // duplicated, the reset is visually identical to the starting position.
  const doubled = [...items, ...items];
  return (
    <div className={styles.row}>
      <div
        className={`${styles.track} ${direction === "left" ? styles.trackLeft : styles.trackRight}`}
      >
        {doubled.map((text, i) => (
          <ReviewCard key={i} text={text} />
        ))}
      </div>
    </div>
  );
}

export function ReviewsMarquee() {
  return (
    <section className={styles.section} aria-label="Customer reviews">
      <header className={styles.heading}>
        <h2>What Our Users Say</h2>
        <p>Thousands of satisfied customers across all our products</p>
      </header>

      <div className={styles.rows}>
        <Row items={ROW_1} direction="left" />
        <Row items={ROW_2} direction="right" />
        <Row items={ROW_3} direction="left" />
      </div>
    </section>
  );
}
