/**
 * Editorial posts.
 *
 * These exist to compete for commercial-intent searches the product pages
 * cannot reach — "best arc raiders cheats", "how do HWID bans work". Competitors
 * in this niche run roughly a dozen such pages each; the site had none, and an
 * empty /blog placeholder ranked for nothing.
 *
 * Content lives here rather than in MDX so posts stay typed, searchable and
 * trivially linkable from product and category pages without a build step.
 * Long-form on purpose: thin "best of" pages are exactly what Google's helpful
 * content work targets, so a short post is worse than no post.
 */

export interface BlogSection {
  heading: string;
  body: string[];
}

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  /** <title> — kept separate so it can carry the year and a hook. */
  seoTitle: string;
  description: string;
  published: string;
  updated: string;
  readingMinutes: number;
  /** Category slug this post supports, for cross-linking to the storefront. */
  relatedGameSlug?: string;
  lead: string;
  sections: BlogSection[];
  faqs: BlogFaq[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "best-arc-raiders-cheats-2026",
    title: "The Best ARC Raiders Cheats in 2026",
    seoTitle: "Best ARC Raiders Cheats in 2026 — Undetected ESP & Aimbot Compared",
    description:
      "Which ARC Raiders cheats are actually worth running in 2026, how the game's anti-cheat behaves, and what separates a provider worth paying for from one that gets you banned.",
    published: "2026-08-07",
    updated: "2026-08-07",
    readingMinutes: 8,
    relatedGameSlug: "arc-raiders",
    lead:
      "ARC Raiders is an extraction shooter, and that changes what a cheat needs to do. Loot you never bring home is worth nothing, so the features that matter are the ones that get you out alive — not the ones that top a killfeed.",
    sections: [
      {
        heading: "What actually matters in an extraction shooter",
        body: [
          "In a round-based shooter a bad engagement costs you thirty seconds. In an extraction shooter it costs everything you brought in and everything you picked up. That difference should drive every decision about which features you run.",
          "Player ESP is the single highest-value feature, and it is not close. Knowing where the other squads are lets you rotate around them, pick fights you have already won, and leave before a third party arrives. Aimbot wins the fights you should not have taken in the first place.",
          "Loot and container ESP is the second. Time spent searching is time spent exposed, and the players who die are usually the ones still looting when the map closes in.",
          "Aimbot is the feature most likely to get you reported. Human players are poor at spotting wallhacks and very good at spotting a rifle that snaps. If you run one at all, run it with heavy smoothing and a small field of view.",
        ],
      },
      {
        heading: "External, internal, and DMA — what the difference means for you",
        body: [
          "An external cheat reads game memory from a separate process. It is easier to detect through conventional means but never injects into the game, so a crash takes your cheat down rather than your account.",
          "An internal cheat runs inside the game process. It can do more and it can do it faster — smoother ESP, better aimbot — at the cost of a much larger detection surface. Anti-cheat systems are specifically looking for injected modules.",
          "A DMA setup reads memory over a hardware card in a second machine. Nothing runs on the gaming PC at all, which puts it beyond the reach of software anti-cheat almost entirely. It is also the most expensive option by a wide margin and requires two computers.",
          "For most people, external is the right answer. DMA is worth it if you have already been hardware banned once, or if the account you are protecting is worth more than the hardware.",
        ],
      },
      {
        heading: "How to judge a provider before you pay",
        body: [
          "Look at how they communicate downtime. A provider that publishes a status page and marks products as under maintenance when a game updates is a provider that will tell you before you get banned. One that stays silent through a patch is deciding that your account is less important than a day of sales.",
          "Check the update cadence against the game's patch schedule. ARC Raiders patches regularly, and a cheat that has not been updated since the last major update is not undetected — it is untested.",
          "Be sceptical of permanent lifetime pricing. Keeping a cheat working costs the developer money every month. A one-off payment means either the price assumes you will stop using it, or the product will stop being maintained.",
          "Ask what happens when it goes down. The answer should be a paused subscription or extended time, not silence.",
        ],
      },
      {
        heading: "Reducing your ban risk, whatever you run",
        body: [
          "Use a separate account. This is the advice everyone skips and everyone later wishes they had taken. Hardware bans are recoverable with a spoofer; a banned main account with years of progress is not.",
          "Check the status page before every session. Thirty seconds of checking is worth more than any feature in any menu. If a product is marked detected or under maintenance, the correct action is to not play that day.",
          "Play like someone who is not cheating. The most common way people get caught is not detection — it is a report from an opponent who watched a killcam. Do not track through walls, do not pre-aim doorways you have no business knowing about, and do not win every single fight.",
          "Do not run a spoofer and a cheat you got from two different places without checking they are compatible. Conflicts between them cause more crashes, and more bans, than either alone.",
        ],
      },
    ],
    faqs: [
      {
        q: "Are ARC Raiders cheats detected in 2026?",
        a: "Detection status changes constantly and per-product. Any provider claiming permanent undetectability is not being straight with you. Check a live status page immediately before you play rather than trusting a claim on a sales page.",
      },
      {
        q: "Can I get banned for using ESP only?",
        a: "Yes. ESP is harder for opponents to spot than aimbot, which lowers your report rate, but it is not invisible to anti-cheat and it does not make you safe. It makes you less likely to be reported, which is a different thing.",
      },
      {
        q: "Is DMA worth it for ARC Raiders?",
        a: "Only if you have already been hardware banned, or the account you are protecting is worth more than a second PC and a capture card. For most players an external cheat on a separate account is a better use of the money.",
      },
      {
        q: "What is the safest way to start?",
        a: "A fresh account, an external cheat, ESP only, and the status page open before every session. Add features once you understand how the game's anti-cheat behaves rather than starting with everything switched on.",
      },
    ],
  },
];

export function allBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

export function blogPostBySlug(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug.toLowerCase()) ?? null;
}

/** Newest first — the order the index should present them in. */
export function blogPostsByDate(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.published.localeCompare(a.published));
}
