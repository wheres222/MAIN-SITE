import { productGameSlug, productLeafSlug } from "@/lib/product-route";

/**
 * Per-product editorial content.
 *
 * Product pages were 95 words with no headings — a title, a price table and a
 * buy button. Competitors run roughly 1,400 words across a dozen-plus headings
 * on the equivalent page, which is why they hold terms like "crusader r6" even
 * where our URL now matches the query exactly. A page needs something to rank
 * *with*, not just a matching address.
 *
 * Keyed by "<game>/<leaf>", the same pair productHref builds, so a product's
 * content and its URL cannot drift apart.
 *
 * A warning about scaling this to all 36 products: near-identical text across
 * many pages is worse than 95 words each — thin templated variation is the
 * doorway-page pattern search engines penalise. Every entry below states real
 * differences: what this product does that its siblings don't, and when to buy
 * something else instead. If an entry cannot say that honestly, it should not
 * be written yet.
 */

export interface ProductFeatureGroup {
  heading: string;
  items: string[];
}

export interface ProductFaq {
  q: string;
  a: string;
}

export interface ProductSeoContent {
  /** "<game>/<leaf>" */
  key: string;
  /** Answers "what is this?" — the first thing readers and crawlers both want. */
  intro: string[];
  featureGroups: ProductFeatureGroup[];
  /** Anti-cheat and injection-model notes specific to this product. */
  safety: string[];
  requirements: string[];
  chooseWhen: string[];
  chooseOther: string[];
  faqs: ProductFaq[];
}

const CONTENT: ProductSeoContent[] = [
  {
    key: "rainbow-six-siege/crusader-full",
    intro: [
      "Crusader Full is an external Rainbow Six Siege cheat covering operator ESP, a configurable aimbot and gadget awareness. External means it reads the game from a separate process and never injects into it, which keeps it clear of the integrity checks BattlEye applies to loaded modules.",
      "Siege rewards information more than raw aim. Rounds are short, there are no respawns, and most losses come from not knowing where someone is rather than losing a duel you saw coming. Operator and gadget ESP is where the practical value sits.",
    ],
    featureGroups: [
      {
        heading: "Aimbot",
        items: [
          "Configurable field of view, so it only engages inside a cone you set rather than snapping across the screen",
          "Smoothing, which spreads the correction over several frames instead of one — the single most important setting for staying out of someone's killcam",
          "Per-bone targeting, with body over head as the lower-risk default",
          "Visibility checks, so it will not track someone through a wall you cannot shoot through",
        ],
      },
      {
        heading: "ESP and visuals",
        items: [
          "Operator boxes and skeletons with distance",
          "Gadget ESP — cameras, traps, Kapkan and Frost placements, breach charges",
          "Drone and defuser tracking, which decides more Siege rounds than aim does",
          "Health and armour indicators for judging whether a push is worth taking",
        ],
      },
      {
        heading: "Miscellaneous",
        items: [
          "Saveable configuration profiles, so a quieter setup can be swapped in for ranked",
          "Streamproof rendering options",
          "Adjustable menu key to avoid clashing with in-game binds",
        ],
      },
    ],
    safety: [
      "Siege runs BattlEye alongside MouseTrap, which specifically targets input manipulation — mouse movement that looks generated rather than human. That makes aimbot smoothing a safety setting on this game, not a comfort one.",
      "Being external, it avoids the injection and memory-integrity checks that catch internal cheats. It does not avoid behavioural analysis or player reports, and Siege has an unusually attentive playerbase with killcams that show exactly what you did.",
      "Run it on an account you can afford to lose. Ranked progress and operator unlocks do not transfer.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Intel or AMD — no specific chipset requirement for the external build",
      "Secure Boot disabled",
      "Works with UPlay, Steam and Epic copies of the game",
      "Administrator rights to launch the loader",
    ],
    chooseWhen: [
      "You want the full toolkit — aimbot as well as ESP — rather than information only",
      "You play ranked and want configuration profiles you can dial down",
      "You would rather stay external than take an internal cheat's detection risk for smoother visuals",
    ],
    chooseOther: [
      "If you only want information, Ancient External for R6 is the lighter option and gives you less to get caught doing.",
      "If you have already been hardware banned, buy a spoofer first — no cheat helps on banned hardware.",
    ],
    faqs: [
      {
        q: "Is Crusader detected by BattlEye?",
        a: "Detection status changes and is per-build. Check the live status shown on this page immediately before you play rather than relying on a general claim — it comes from our supplier feed automatically rather than being edited by hand.",
      },
      {
        q: "Does Crusader work on Siege X?",
        a: "Yes, the external build supports current Siege including Siege X. Support pauses during major updates while it is rebuilt, which shows as Updating on the status page.",
      },
      {
        q: "Will this work with MouseTrap enabled?",
        a: "MouseTrap analyses input patterns rather than detecting software. Use smoothing and a narrow field of view — an aimbot configured to snap is the setup most likely to be flagged.",
      },
      {
        q: "Do I need a spoofer as well?",
        a: "Only if you have already been hardware banned, or the machine is one you cannot afford to have flagged. On a clean machine with a throwaway account, a spoofer adds another driver and another thing to conflict with.",
      },
      {
        q: "Can I use it on my main account?",
        a: "You can. We would not. Siege bans are permanent and take rank and operator unlocks with them.",
      },
    ],
  },
  {
    key: "arc-raiders/ancient",
    intro: [
      "Ancient for ARC Raiders is built around the thing extraction shooters punish hardest: leaving with your loot. It covers player and ARC machine ESP, loot and container awareness, and a restrained aimbot.",
      "In a round-based shooter a bad fight costs thirty seconds. Here it costs the raid — everything you brought and everything you found. Knowing where the other squads are is worth considerably more than winning duels.",
    ],
    featureGroups: [
      {
        heading: "ESP and awareness",
        items: [
          "Player ESP with distance, so you can rotate around squads rather than through them",
          "ARC machine ESP — knowing what is patrolling ahead is what keeps a full bag alive",
          "Loot and container ESP, cutting the time spent searching while exposed",
          "Extraction point indicators with distance",
        ],
      },
      {
        heading: "Aimbot",
        items: [
          "Field-of-view limit and smoothing, set conservatively by default",
          "Visibility checks so it will not track through geometry",
          "Body-first targeting, which is both safer and usually sufficient against ARC units",
        ],
      },
      {
        heading: "Quality of life",
        items: [
          "Saveable profiles for switching between a cautious and an aggressive setup",
          "Streamproof rendering",
          "Configurable menu key",
        ],
      },
    ],
    safety: [
      "ARC Raiders is PvPvE, which changes the report dynamic: much of your damage is against AI, and AI do not file reports. The risk concentrates in the PvP encounters other players actually witness.",
      "The highest-risk behaviour here is not aimbot but movement — walking directly to a container you have no line of sight to, or rotating perfectly around a squad you should not know about. Information is only quiet if you act on it patiently.",
      "As an external build it stays outside the game process, which avoids injection-based detection but not behavioural analysis.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of ARC Raiders",
      "Administrator rights to launch the loader",
      "Overlay-capable GPU driver for rendering the visuals",
    ],
    chooseWhen: [
      "You want a full external toolkit rather than information only",
      "You care about extracting successfully more than topping the killfeed",
      "You want conservative defaults you can leave alone",
    ],
    chooseOther: [
      "Arcane for ARC Raiders is the alternative external option — if one is marked Updating, the other is usually the one to run.",
      "Belltower Internal offers smoother visuals and a more capable aimbot at meaningfully higher detection risk. Worth it only if you understand that trade.",
      "If you only need a few sessions, an ARC Raiders temporary account costs less than risking one you care about.",
    ],
    faqs: [
      {
        q: "Are ARC Raiders cheats detected right now?",
        a: "It changes constantly and per-product. The status shown on this page comes from our supplier feed automatically, so check it immediately before playing rather than trusting a sales claim.",
      },
      {
        q: "Is ESP enough on its own in ARC Raiders?",
        a: "For most players, yes. Knowing where squads and ARC units are decides whether you extract, and it is far harder for an opponent to notice than an aimbot.",
      },
      {
        q: "Does it work in solo and squad raids?",
        a: "Yes. The ESP is more valuable in squads, where third-partying is the main way full bags are lost.",
      },
      {
        q: "What is the difference between Ancient and Arcane here?",
        a: "Both are external with overlapping features, but they are built by different developers, so they are rarely detected at the same time. That is the practical reason to know both exist.",
      },
    ],
  },
  {
    key: "rust/ancient-external",
    intro: [
      "Ancient External for Rust focuses on the information that decides a wipe: where players are, where the resources are, and where the stashes nobody has found are buried. It is an external build, so nothing is injected into the game process.",
      "Rust has the longest time-to-value in the genre. Hours of farming produce a base that a single raid removes, which means the fight you avoid is worth more than the fight you win.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player ESP with distance — the core feature. Three players at 200 metres is a decision, not a fight",
          "Sleeper ESP, which turns free resources into a route and an unguarded base into an opportunity",
          "Ore and resource node ESP, shortening the time spent exposed while farming",
          "Stash and hidden-container ESP, otherwise close to random to find",
          "Trap and turret indicators for raid planning",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Recoil control, which matters more on Rust than aimbot — spray patterns are learnable, and smoothing them looks like practice",
          "Configurable aimbot with field-of-view limits and visibility checks",
          "Body-first targeting by default",
        ],
      },
      {
        heading: "Quality of life",
        items: [
          "Profile saving for switching between a quiet setup and a full one",
          "Streamproof rendering",
          "Configurable menu key",
        ],
      },
    ],
    safety: [
      "Rust runs Easy Anti-Cheat, and Facepunch have a long history of banking detections and banning in bulk — frequently around forced wipe days when population peaks.",
      "The practical consequence is that the days immediately after a forced wipe are the worst time to run something you are unsure about. Report volume and scrutiny are both at their highest.",
      "Rust's community clips and escalates aggressively. Walking straight to a buried stash in front of someone causes more bans than any scanner.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of Rust",
      "Administrator rights to launch the loader",
      "Second monitor recommended but not required",
    ],
    chooseWhen: [
      "You want information first and aim assistance second",
      "You play across a full wipe and care about keeping progress rather than winning individual fights",
      "You want recoil control without a snapping aimbot",
    ],
    chooseOther: [
      "Stealth for Rust is a different developer's build — useful when one is marked Updating.",
      "Ultimate External and Mydrin External cover similar ground with different emphasis; check the status page and pick whichever is currently healthy.",
      "Arcane for Rust is worth comparing if you want a broader multi-game licence rather than a Rust-only one.",
    ],
    faqs: [
      {
        q: "Are Rust cheats undetected in 2026?",
        a: "It changes constantly and per-product. The status on this page updates automatically from our supplier feed — check it right before you play, not the night before.",
      },
      {
        q: "Is recoil control safer than aimbot on Rust?",
        a: "Lower risk, not zero. The output resembles a skilled player, which reduces report rate, but EAC has detected input-manipulation tooling before.",
      },
      {
        q: "Will a ban affect my whole Steam account?",
        a: "A Rust game ban applies to Rust and is visible on your Steam profile. It does not remove your other games.",
      },
      {
        q: "Should I run this straight after a wipe?",
        a: "It is the riskiest window. Population, scrutiny and report volume all peak in the days after a forced wipe, and that is a natural moment for a backlog of detections to be actioned.",
      },
    ],
  },
];

const BY_KEY = new Map(CONTENT.map((entry) => [entry.key, entry]));

export function productSeoContentByKey(key: string): ProductSeoContent | null {
  return BY_KEY.get(key.toLowerCase()) ?? null;
}

export function productSeoContentFor(product: {
  id: number;
  name: string;
  groupName?: string | null;
  categoryName?: string | null;
}): ProductSeoContent | null {
  return productSeoContentByKey(
    `${productGameSlug(product)}/${productLeafSlug(product)}`
  );
}

/** Keys that already have content, for tracking coverage across the catalogue. */
export function productSeoContentKeys(): string[] {
  return CONTENT.map((entry) => entry.key);
}
