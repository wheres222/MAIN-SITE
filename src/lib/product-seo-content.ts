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
  {
    key: "rust/arcane",
    intro: [
      "Arcane for Rust is the option to look at if you play more than one game. The same provider covers Apex, CS2, ARC Raiders, Palworld and others, so a single subscription follows you between titles rather than leaving you to buy again each time your group moves on.",
      "On Rust itself it covers the same ground any serious external needs: player and resource ESP, sleeper awareness, and recoil control. What differs is the breadth behind it, not the Rust feature list.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player ESP with distance",
          "Sleeper and base awareness",
          "Ore and resource node ESP",
          "Trap and turret indicators",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Recoil control tuned per weapon",
          "Configurable aimbot with visibility checks",
          "Field-of-view limiting",
        ],
      },
    ],
    safety: [
      "External build, so it stays outside the game process and clear of the injection checks EAC applies to loaded modules.",
      "Rust bans in waves around forced wipes. Being on a multi-game provider does not change that — check the status for the Rust build specifically, not the provider as a whole.",
      "A shared licence across games means one detection can pull your attention to the wrong product. Confirm which title is actually flagged before assuming your Rust build is affected.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of Rust",
      "Administrator rights to launch the loader",
    ],
    chooseWhen: [
      "You play several of the games this provider covers and want one subscription",
      "You want a solid external without needing Rust-specific specialisation",
      "You switch games with a group and do not want to rebuy each time",
    ],
    chooseOther: [
      "Ancient External is the more Rust-focused option if Rust is the only game you play.",
      "Stealth is a different developer again — worth knowing when Arcane is marked Updating.",
    ],
    faqs: [
      {
        q: "Does one Arcane licence cover every game?",
        a: "Coverage depends on the plan you buy. Check the variant you are purchasing rather than assuming a single key unlocks the whole catalogue.",
      },
      {
        q: "Is Arcane detected on Rust right now?",
        a: "Status is per-product and per-game. The live status on this page comes from our supplier feed automatically — check it before you play.",
      },
      {
        q: "How does it compare to Ancient External?",
        a: "Similar external feature sets from different developers. Ancient is Rust-focused; Arcane spans several games. The practical value of knowing both is that they are rarely detected at the same time.",
      },
    ],
  },
  {
    key: "rust/stealth",
    intro: [
      "Stealth for Rust is built by a different developer to the other Rust externals here, which is the main reason to know it exists. When one Rust build goes down for a rebuild, the others usually do not go with it.",
      "Feature-wise it targets the same decisions Rust actually turns on: where the players are, where the loot is, and whether the fight in front of you is worth taking.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player ESP with distance and health",
          "Sleeper ESP",
          "Resource node and stash awareness",
          "Trap and turret indicators for raid planning",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Recoil control",
          "Configurable aimbot with smoothing",
          "Visibility checks",
        ],
      },
    ],
    safety: [
      "External, so nothing is injected into the Rust process.",
      "Rust's ban waves cluster around forced wipes. The safest habit on any Rust build is to check status immediately before a session rather than trusting yesterday's result.",
      "Running two Rust cheats from different providers at once is a reliable way to cause crashes and leave traces neither would produce alone. Pick one.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of Rust",
      "Administrator rights to launch the loader",
    ],
    chooseWhen: [
      "Your usual Rust build is marked Detected or Updating",
      "You want a second option from a different developer to fall back on",
      "You prefer information-led play over aim assistance",
    ],
    chooseOther: [
      "Ancient External and Ultimate External cover similar ground — the one to run is whichever is currently healthy.",
      "Arcane is the better buy if you play several games and want one subscription.",
    ],
    faqs: [
      {
        q: "Why would I buy this over Ancient External?",
        a: "Mostly redundancy. They are different developers, so they are rarely down at the same time, and the ability to switch is worth more across a wipe than any single feature.",
      },
      {
        q: "Can I run Stealth and another Rust cheat together?",
        a: "No. Two cheats hooking the same game causes crashes and can leave traces neither produces alone.",
      },
      {
        q: "Is it updated after force wipes?",
        a: "Yes, like every Rust build here. It shows as Updating on the status page while a rebuild is in progress.",
      },
    ],
  },
  {
    key: "rainbow-six-siege/ancient-external",
    intro: [
      "Ancient External for Rainbow Six Siege is the lighter of the two R6 options here — information first, with far less on screen that an opponent can notice in a killcam.",
      "Siege is decided by knowing where people are. Rounds are short, there are no respawns, and most losses come from walking into someone you did not know about rather than losing a duel you saw coming.",
    ],
    featureGroups: [
      {
        heading: "ESP and awareness",
        items: [
          "Operator boxes and skeletons with distance",
          "Gadget ESP — cameras, traps, breach charges",
          "Drone and defuser tracking",
          "Health indicators for judging a push",
        ],
      },
      {
        heading: "Quality of life",
        items: [
          "Saveable profiles",
          "Streamproof rendering",
          "Configurable menu key",
        ],
      },
    ],
    safety: [
      "Siege runs BattlEye alongside MouseTrap, which targets input manipulation specifically. An information-only setup sidesteps that surface entirely, because there is no aim input to analyse.",
      "The realistic risk on an ESP-only build is a report, not a detection. Rotating perfectly around a defender you have no business seeing is what gets clipped.",
      "External, so it stays clear of the injection and memory-integrity checks that catch internal cheats.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Works with UPlay, Steam and Epic copies",
      "Administrator rights to launch the loader",
    ],
    chooseWhen: [
      "You want the lowest-profile option that still changes how you play",
      "You play ranked and would rather not have an aimbot to explain",
      "You are new to this and want to understand the game's enforcement before adding features",
    ],
    chooseOther: [
      "Crusader Full is the option if you want an aimbot as well as ESP.",
      "If you have already been hardware banned, buy a spoofer before anything else.",
    ],
    faqs: [
      {
        q: "Is ESP-only actually safer?",
        a: "Lower risk, not zero. It removes the input-manipulation surface MouseTrap watches and is much harder for an opponent to spot, but the build itself can still be detected.",
      },
      {
        q: "Does it work on Siege X?",
        a: "Yes. Support pauses during major updates while it is rebuilt, shown as Updating on the status page.",
      },
      {
        q: "Can I add an aimbot later?",
        a: "Not to this product — Crusader Full is the build with one. They are separate purchases.",
      },
    ],
  },
  {
    key: "arc-raiders/arcane",
    intro: [
      "Arcane for ARC Raiders is the alternative external to Ancient, from a different developer. In a game where a detection means losing your kit as well as your account, having a second option that is not down at the same time has real value.",
      "It covers what extraction demands: player and ARC machine awareness, loot visibility, and extraction routing.",
    ],
    featureGroups: [
      {
        heading: "ESP and awareness",
        items: [
          "Player ESP with distance",
          "ARC machine ESP",
          "Loot and container ESP",
          "Extraction point indicators",
        ],
      },
      {
        heading: "Aimbot",
        items: [
          "Field-of-view limiting and smoothing",
          "Visibility checks",
          "Body-first targeting",
        ],
      },
    ],
    safety: [
      "External build, outside the game process.",
      "ARC Raiders is PvPvE, so much of your damage is against AI that cannot report you. The risk concentrates in PvP encounters other players actually witness.",
      "The behaviour that gets people caught here is movement, not aim — walking straight to a container you have no line of sight to is more obvious than any shot you take.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of ARC Raiders",
      "Administrator rights to launch the loader",
    ],
    chooseWhen: [
      "Ancient is marked Detected or Updating",
      "You already run Arcane on another game and want one provider",
      "You want an external rather than the higher-risk internal",
    ],
    chooseOther: [
      "Ancient covers the same ground and is the one to run when Arcane is down.",
      "Belltower Internal is smoother and more capable, at meaningfully higher detection risk.",
    ],
    faqs: [
      {
        q: "How is this different from Ancient for ARC Raiders?",
        a: "Overlapping features, different developers. The practical reason to know both is that they are rarely detected at the same time.",
      },
      {
        q: "Is ESP enough on its own here?",
        a: "For most players, yes. Knowing where squads and ARC units are decides whether you extract, and it is far harder to notice than an aimbot.",
      },
      {
        q: "Does it cover all raid maps?",
        a: "Yes. Extraction indicators and loot ESP work across the current map rotation.",
      },
    ],
  },
  {
    key: "arc-raiders/belltower-internal",
    intro: [
      "Belltower Internal is the highest-capability ARC Raiders option here, and the highest risk. Internal means it runs inside the game process, which is what allows smoother visuals and a more responsive aimbot than any external can manage.",
      "That same fact is the trade: an internal cheat is exactly what anti-cheat integrity checks are built to find. On a game where a ban costs your account and everything in your stash, that is a real decision rather than a preference.",
    ],
    featureGroups: [
      {
        heading: "Visuals",
        items: [
          "Player and ARC machine ESP rendered in-engine, so it tracks without the lag externals show under load",
          "Loot, container and extraction indicators",
          "Chams and visibility-based colouring",
        ],
      },
      {
        heading: "Aimbot",
        items: [
          "Frame-accurate targeting with configurable smoothing",
          "Per-bone selection",
          "Visibility and field-of-view constraints",
        ],
      },
    ],
    safety: [
      "This is the important section for this product. Internal cheats inject into the game process, which is the specific thing memory-integrity checks look for. It is not comparable to an external in detection risk and should not be treated as one.",
      "Use it on an account you are fully prepared to lose. If that sentence gives you pause, buy an external instead — the feature gap is smaller than the risk gap.",
      "Check status immediately before every session. On an internal build the window between a detection landing and a ban wave is where people get caught.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of ARC Raiders",
      "Administrator rights to launch the loader",
      "Antivirus exclusion for the loader",
    ],
    chooseWhen: [
      "You understand and accept a materially higher ban risk",
      "You want in-engine rendering and a genuinely responsive aimbot",
      "You are on a throwaway account with nothing you would miss",
    ],
    chooseOther: [
      "Ancient or Arcane are the externals, and the right answer for most people.",
      "If you have been hardware banned before, pair anything with a spoofer — or reconsider running an internal at all.",
    ],
    faqs: [
      {
        q: "Is an internal cheat more likely to get me banned?",
        a: "Yes. It injects into the game process, which is precisely what integrity checks are designed to detect. The feature advantage is real, and so is the risk.",
      },
      {
        q: "Why choose internal at all?",
        a: "Rendering and aim quality. An in-engine overlay tracks smoothly under load where an external can lag behind the frame.",
      },
      {
        q: "Can I run it on my main account?",
        a: "We would strongly advise against it. Use an account whose loss would not matter to you.",
      },
    ],
  },
  {
    key: "counter-strike-2/predator",
    intro: [
      "Predator for CS2 is built around the fact that Counter-Strike punishes obvious cheating harder than almost any other game — not through anti-cheat, but through other players. Demos are reviewed, clips are shared, and the community has watched enough cheaters to recognise one instantly.",
      "So the features that matter are the ones that improve decisions rather than aim: knowing where the enemy is, and knowing when not to take a fight.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player boxes and skeletons with distance",
          "Weapon and equipment ESP — knowing who has the AWP changes the round",
          "Bomb and defuse-kit tracking",
          "Health and armour indicators",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Configurable aimbot with heavy smoothing defaults",
          "Field-of-view limiting",
          "Recoil control for spray transfers",
          "Visibility checks",
        ],
      },
    ],
    safety: [
      "CS2 runs VAC alongside server-side analysis. VAC bans are permanent, apply to the account, and are visible on your Steam profile forever.",
      "The bigger practical risk is human. Counter-Strike players read demos, and an aimbot that snaps is obvious in a way it simply is not in a battle royale. Smoothing is not a comfort setting here.",
      "Use a separate Steam account with no games you care about attached. A VAC ban is visible to everyone who looks at your profile.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of CS2",
      "Administrator rights to launch the loader",
    ],
    chooseWhen: [
      "You want a full CS2 toolkit with configuration you can dial right down",
      "You play matchmaking rather than anything with anti-cheat beyond VAC",
      "You understand that restraint matters more here than features",
    ],
    chooseOther: [
      "Arcane for CS2 is the option if you also play other titles this provider covers.",
      "For FACEIT or ESEA, nothing here is appropriate — those run kernel clients that are a different problem entirely.",
    ],
    faqs: [
      {
        q: "Will this work on FACEIT?",
        a: "No. FACEIT and ESEA run their own kernel-level anti-cheat clients. Do not attempt it.",
      },
      {
        q: "Is a VAC ban permanent?",
        a: "Yes, and it is visible on your Steam profile permanently. Use an account you do not care about.",
      },
      {
        q: "Can I get banned from a demo review?",
        a: "Overwatch-style review and community reporting are a real risk in CS2. Obvious aim is spotted by players long before any automated system reacts.",
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
