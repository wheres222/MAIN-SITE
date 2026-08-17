import { productGameSlug, productLeafSlug, productSlugFromName } from "@/lib/product-route";

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
    // The catalogue names this one "Crusader - R6", so the leaf slug is
    // "crusader". It was keyed "crusader-full" here, which matches nothing —
    // the entry existed but no page could ever load it.
    key: "rainbow-six-siege/crusader",
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
  {
    key: "rust/calamari-external",
    intro: [
      "Calamari is an external Rust cheat built around staying quiet rather than doing everything. It reads the game from a separate process, draws its overlay outside the game window, and deliberately ships a smaller feature set than the all-in-one options beside it.",
      "That is the trade it asks you to make. Rust bans arrive in waves rather than instantly, often weeks after the session that caused them, and the accounts that survive those waves are usually the ones that did less. Calamari is aimed at people who have already lost an account to a heavier cheat.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player ESP with distance and visibility state",
          "Sleeper ESP, which is where most raid value on a Rust server actually comes from",
          "Resource and ore node highlighting",
          "Item and dropped-container ESP for post-fight cleanup",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Recoil control with per-weapon patterns, the single feature most Rust players actually want",
          "Optional aim assistance with a hard field-of-view cap rather than a full aimbot",
          "No silent aim and no bullet redirection — both are what gets clips posted and accounts reviewed by hand",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Overlay drawn outside the game window, so it survives most streaming setups",
          "Saveable profiles for solo play versus group wipes",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "Rust runs EAC, but the bans people actually receive are usually the result of Facepunch's own review rather than a live kernel detection — reports, then a look at the account, then a wave. That means how you play matters more here than on most titles.",
      "The deliberately reduced feature set is the point of this product. There is no silent aim to record, and recoil control alone looks like a good player on a spectator replay.",
      "Rust bans are account bans first and hardware bans second. If you have already had one, a spoofer comes before another cheat.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of Rust",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You have already lost a Rust account and want the quietest thing that still helps",
      "Recoil control and sleeper information are what you actually use",
      "You play grouped and would rather not be the member who gets the base reviewed",
    ],
    chooseOther: [
      "If you want a full aimbot and the widest feature list, Ancient Rust External covers considerably more ground.",
      "If you play several games, Arcane is one subscription across all of them and Calamari is Rust only.",
    ],
    faqs: [
      {
        q: "Why does Calamari have fewer features than the others?",
        a: "Because that is what it is for. Every additional feature is another thing visible on a spectator replay, and Rust's bans lean on human review more than most games.",
      },
      {
        q: "Is recoil control enough to be worth it on Rust?",
        a: "For most players it is the majority of the value. Rust's spray patterns are fixed and learnable, so recoil control mainly removes the practice requirement — which is exactly why it looks unremarkable when someone watches you.",
      },
      {
        q: "Will it work while streaming?",
        a: "The overlay renders outside the game window, which handles most capture setups. Test it against your own recording software before you rely on it.",
      },
      {
        q: "Is it detected?",
        a: "Check the live status on this page before you play. It comes from the supplier feed automatically rather than being written by hand, so it is accurate as of the last sync rather than as of whenever someone remembered to update it.",
      },
    ],
  },
  {
    key: "rust/mydrin-external",
    intro: [
      "Mydrin is a full-featured external for Rust: aimbot, complete ESP, recoil control and the utility features that matter on long wipes rather than in single fights. It sits at the heavier end of the Rust options here.",
      "The distinguishing part is base and raid tooling. Most Rust cheats are built around the gunfight; Mydrin puts as much attention on knowing what is inside a base before you spend two hours of explosives finding out.",
    ],
    featureGroups: [
      {
        heading: "Aimbot",
        items: [
          "Configurable field of view and smoothing",
          "Per-weapon recoil compensation",
          "Visibility and distance checks before the aimbot will engage",
          "Optional target priority by distance or by threat",
        ],
      },
      {
        heading: "ESP and raid information",
        items: [
          "Player and sleeper ESP with distance",
          "Storage container ESP — boxes, furnaces and tool cupboards through walls",
          "Turret, trap and Shotgun-trap indicators before you walk into them",
          "Ore, hemp and barrel highlighting for farming runs",
        ],
      },
      {
        heading: "Utility",
        items: [
          "Configuration profiles per wipe or per group",
          "Streamproof rendering",
          "Adjustable menu bind",
        ],
      },
    ],
    safety: [
      "Rust's enforcement is wave-based and heavily report-driven. A full aimbot on a populated server is the fastest way into a review queue, and Mydrin gives you enough to be very obvious if you configure it that way.",
      "Container ESP is the feature to lean on — it changes what you know rather than what your crosshair does, so it leaves nothing for another player to record.",
      "External, so no injection into the game process. That avoids module-integrity checks; it does not avoid a human watching a replay.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of Rust",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You raid regularly and want to know which bases are worth the explosives",
      "You want a complete toolkit rather than a reduced one",
      "You are comfortable configuring an aimbot down rather than being given a small one",
    ],
    chooseOther: [
      "If you have already been banned once and want to keep this account, Calamari does less on purpose.",
      "If you also play Apex, CS2 or ARC Raiders, Arcane covers all of them on one subscription.",
    ],
    faqs: [
      {
        q: "What does container ESP actually change?",
        a: "It tells you whether a base is worth raiding before you commit rockets to it. On a wipe that is worth more than the aimbot, and unlike the aimbot nobody can see you using it.",
      },
      {
        q: "Can I turn the aimbot off entirely?",
        a: "Yes. Profiles save per configuration, so an ESP-only setup for populated servers and a fuller one for late-wipe is the usual arrangement.",
      },
      {
        q: "Does it work on modded servers?",
        a: "Generally yes, but modded servers often run additional server-side plugins and far more active admins than official ones. Assume more scrutiny, not less.",
      },
      {
        q: "How is this different from Ancient Rust External?",
        a: "Feature lists overlap heavily. Mydrin puts more into raid and container information; Ancient puts more into the gunfight. Buy the one matching how you actually spend a wipe.",
      },
    ],
  },
  {
    key: "fortnite/ancient",
    intro: [
      "Ancient for Fortnite is an external cheat covering player ESP, aim assistance and loot information. External matters more here than on most titles: Fortnite runs both BattlEye and Easy Anti-Cheat with kernel-level components, and injected internal cheats are the category they catch most reliably.",
      "Fortnite is also a building game, which changes what a cheat is worth. Knowing where someone is while they are boxed up and rotating decides more fights than aim does, so the ESP is the part that earns its price.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player boxes and skeletons with distance",
          "Visibility state, so you know whether someone can currently see you through their own build",
          "Loot and chest ESP with rarity filtering",
          "Vehicle and supply drop indicators",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Field-of-view-limited aim assist rather than a full snap",
          "Smoothing, which on Fortnite matters because replays are saved automatically and reviewed constantly",
          "Visibility checks so it will not track through a freshly placed wall",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Profiles for ranked versus casual play",
          "Streamproof rendering",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "Fortnite saves a replay of every match. That is the practical risk here — not a live detection, but a clip that goes to Epic with a timestamp. Aim assistance configured to snap is visible in a replay from any angle, including yours.",
      "Running two anti-cheats with kernel components means driver conflicts are common. Disable other overlays and any anti-cheat bypass you are not actively using.",
      "Epic bans by account and by hardware, and hardware bans follow you to a new account. On Fortnite specifically, a spoofer is closer to a requirement than an accessory.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Epic Games copy of Fortnite",
      "Administrator rights for the loader",
      "No other kernel-level overlay or anti-cheat bypass running at the same time",
    ],
    chooseWhen: [
      "You want information first and aim assistance second",
      "You would rather stay external given how aggressive Fortnite's anti-cheat stack is",
      "You play ranked and want a quieter profile you can switch to",
    ],
    chooseOther: [
      "If you want internal-quality visuals and accept the injection risk, UnnamedTech Fortnite Internal is the other option here.",
      "If you have been hardware banned by Epic, buy a spoofer first — nothing else will help until that is dealt with.",
    ],
    faqs: [
      {
        q: "Is an external safe on Fortnite?",
        a: "Safer than an internal, not safe. Staying out of the game process avoids the checks aimed at loaded modules, but Fortnite's replay system means human review is a real and frequent path to a ban.",
      },
      {
        q: "Do I need a spoofer for Fortnite?",
        a: "If you have ever been banned on this machine, yes. Epic hardware bans persist across accounts, so a new account on flagged hardware is money spent for nothing.",
      },
      {
        q: "Will it survive a Fortnite season update?",
        a: "Updates typically pause it while it is rebuilt. That shows as Updating on the status shown on this page.",
      },
      {
        q: "Does loot ESP work in Zero Build?",
        a: "Yes — and Zero Build is where the ESP is worth the most, since fights are decided by position rather than by who builds faster.",
      },
    ],
  },
  {
    key: "fortnite/unnamedtech-internal",
    intro: [
      "UnnamedTech Fortnite Internal loads into the game process rather than reading it from outside. That gives it what externals structurally cannot have: visuals drawn by the game's own renderer, frame-accurate positions with no polling delay, and aim behaviour that follows targets smoothly instead of correcting after the fact.",
      "It also carries the risk that comes with that. Fortnite's anti-cheat stack is specifically built to find loaded modules. This is the higher-performance and higher-exposure option, and it should be bought with that understood rather than discovered.",
    ],
    featureGroups: [
      {
        heading: "Aimbot",
        items: [
          "Frame-accurate target tracking with no polling delay between game state and correction",
          "Configurable field of view, smoothing and per-bone targeting",
          "Prediction for projectile weapons, which externals handle poorly",
          "Visibility checks against the game's own state rather than an estimate",
        ],
      },
      {
        heading: "Visuals",
        items: [
          "ESP rendered through the game's own pipeline — no separate overlay window to capture or lose",
          "Player boxes, skeletons, health and distance",
          "Loot, chest and rarity filtering",
          "Chams and visibility colouring",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Saveable profiles",
          "Adjustable menu key",
          "Feature-by-feature toggles so it can be run close to ESP-only",
        ],
      },
    ],
    safety: [
      "This is an internal cheat on a game running BattlEye and EAC with kernel components. That is the highest-exposure combination on this site, and no configuration makes it a low-risk purchase.",
      "Use it on an account and a machine you have written off. Not an account with skins on it.",
      "Fortnite's automatic replays mean a review can come from a clip rather than a detection, so the aimbot settings still matter even though the visuals are the reason to buy this.",
      "Secure Boot must be off and no other kernel-level tool may be loaded — conflicts here do not produce a clean error, they produce a crash mid-match.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Epic Games copy of Fortnite",
      "Administrator rights for the loader",
      "A spoofer if the machine has ever been banned — strongly recommended regardless",
    ],
    chooseWhen: [
      "You want the smoothest aim and the cleanest visuals available for Fortnite",
      "You are playing on an account and hardware you are willing to lose",
      "Projectile prediction matters to how you play",
    ],
    chooseOther: [
      "If the account matters to you at all, Ancient Fortnite is external and is the sensible default.",
      "If you have not yet bought a spoofer, buy that first and this second.",
    ],
    faqs: [
      {
        q: "Why choose an internal over an external?",
        a: "Aim quality and visual fidelity. An internal reads the real game state each frame rather than sampling memory from outside, so tracking is smooth rather than corrective, and projectile prediction actually works.",
      },
      {
        q: "How much riskier is it really?",
        a: "Meaningfully. Fortnite's anti-cheat is specifically designed to detect code loaded into its process. Treat the account as disposable.",
      },
      {
        q: "Can I run it with a spoofer?",
        a: "Yes, and you should. Load the spoofer first, reboot if it asks, then start the game and the loader.",
      },
      {
        q: "It crashes on launch — what usually causes that?",
        a: "Almost always another kernel-level driver: a second anti-cheat bypass, an overlay, or leftover components from a previous cheat. Remove them and reboot before contacting support.",
      },
    ],
  },
  {
    key: "counter-strike-2/arcane",
    intro: [
      "Arcane for CS2 is worth considering mainly if you play more than one game. The same subscription covers Rust, Apex, ARC Raiders, Palworld and others, so it follows you when your group moves on rather than leaving you to buy again.",
      "On CS2 itself it does what a competent external does: player ESP, a configurable aimbot with visibility checks, and recoil control. The reason to pick it over a CS2-only product is breadth, not a longer CS2 feature list — and being honest about that is more useful than pretending otherwise.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player boxes and skeletons with distance",
          "Visibility state and health",
          "Weapon and utility indicators — knowing who is holding a flash changes an execute",
          "Bomb and defuser tracking",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Configurable field of view and smoothing",
          "Recoil control per weapon",
          "Visibility checks before engaging",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Profiles saved per game as well as per configuration",
          "Streamproof rendering",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "Where you play decides your risk on CS2 far more than which cheat you buy. Valve matchmaking runs VAC and VAC Live, which are comparatively relaxed. FACEIT and ESEA run their own kernel-level anti-cheat and are dramatically stricter — treat them as a different game entirely.",
      "CS2 also has Overwatch-style community review and a demo of every match. An aimbot that snaps is visible in a demo replayed from any player's point of view, including the enemy's.",
      "Trade bans and inventory value make CS2 accounts expensive to lose. Use an account with nothing on it.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of CS2",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You play several of the games Arcane covers and want one subscription",
      "You play Valve matchmaking rather than FACEIT",
      "You want a solid feature set rather than the deepest possible CS2 tooling",
    ],
    chooseOther: [
      "If CS2 is the only game you play, Predator is built for it specifically and goes deeper.",
      "If you play FACEIT, understand that its kernel anti-cheat is a different threat model from VAC before buying anything at all.",
    ],
    faqs: [
      {
        q: "Does Arcane work on FACEIT?",
        a: "FACEIT's anti-cheat is kernel-level and far stricter than VAC. Check the live status on this page and assume the risk is substantially higher than in Valve matchmaking regardless of what it says.",
      },
      {
        q: "Which games does one Arcane subscription cover?",
        a: "The provider covers CS2, Rust, Apex, ARC Raiders and Palworld among others. Coverage changes, so check the product listing for the current set before buying on that basis.",
      },
      {
        q: "Is recoil control detectable on CS2?",
        a: "Not by itself in the way an aimbot is, but CS2 records a demo of every match and a perfectly flat spray is noticeable to a human watching one.",
      },
      {
        q: "Can I use it on my main account?",
        a: "You can. You should not — CS2 inventories are worth real money and a ban takes them with it.",
      },
    ],
  },
  {
    key: "apex/ancient",
    intro: [
      "Ancient for Apex Legends is an external covering player ESP, loot filtering and aim assistance. Apex runs Easy Anti-Cheat, and externals avoid the module checks that catch injected cheats — the trade is that everything is read from outside the process rather than from the game's own state.",
      "Apex is a squad game with fast rotations and a shrinking ring, which changes what a cheat is worth. Knowing where the third party is coming from decides more games than winning the first fight does, so the ESP and its range are the parts that matter.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player boxes and skeletons with distance and squad grouping",
          "Health, shield tier and knocked state — knocked-versus-dead is the information that decides whether you push",
          "Loot ESP with rarity filtering, so the drop is not thirty seconds of reading floor text",
          "Death box contents and care package tracking",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Field-of-view-limited assist with smoothing",
          "Projectile drop and travel compensation, which matters more on Apex than on hitscan shooters",
          "Recoil control per weapon",
          "Visibility checks before engaging",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Profiles for ranked versus pubs",
          "Streamproof rendering",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "Apex has no automatic replay system, so the review path is a player report followed by a look at your account rather than a saved clip. That makes obvious behaviour in front of a full squad the main risk.",
      "EAC bans by account and by hardware. Respawn also runs ban waves rather than instant enforcement, so a session that felt fine is not evidence of anything yet.",
      "Ranked especially draws reports. A quieter profile for ranked and a fuller one for pubs is the sensible arrangement, not the other way round.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam or EA App copy of Apex Legends",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You want a full toolkit with loot filtering as well as combat features",
      "Projectile compensation matters to you — Apex weapons are almost all travel-time",
      "You want profiles you can dial down for ranked",
    ],
    chooseOther: [
      "If you only want to know where people are, Vector is ESP-only and gives you nothing to be caught doing.",
      "If you play several games, Arcane covers Apex and others on one subscription.",
    ],
    faqs: [
      {
        q: "Does the aimbot handle bullet drop?",
        a: "Yes. Nearly every Apex weapon is a travel-time projectile, so an aimbot without prediction misses at exactly the ranges where you wanted help.",
      },
      {
        q: "Is loot ESP worth it on its own?",
        a: "On Apex, more than most games. The first ninety seconds decide whether you have a fight-winning kit, and rarity filtering removes all of the reading.",
      },
      {
        q: "Will I be banned instantly if detected?",
        a: "Respawn generally bans in waves. That means a quiet session tells you nothing about whether the account is safe — do not take an uneventful evening as confirmation.",
      },
      {
        q: "Does it work in ranked?",
        a: "It functions in ranked. Ranked also has the highest concentration of players who report, so use a reduced profile there.",
      },
    ],
  },
  {
    key: "apex/vector-esp-only",
    intro: [
      "Vector is ESP only. There is no aimbot, no recoil control and no aim assistance of any kind — it draws players, loot and death boxes, and that is the entire product.",
      "That is a deliberate design rather than a cut-down version of something else. Everything another player can see you doing comes from aim assistance; information does not appear in anyone else's point of view. Vector is the option for people who want an edge that leaves no evidence behind.",
    ],
    featureGroups: [
      {
        heading: "Player information",
        items: [
          "Boxes and skeletons with distance",
          "Squad grouping, so a third party is immediately distinguishable from the team you are fighting",
          "Health, shield tier and knocked state",
          "Visibility indication",
        ],
      },
      {
        heading: "World information",
        items: [
          "Loot ESP with rarity filtering",
          "Death box contents",
          "Care package and replicator tracking",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Adjustable draw distance, so the screen is not a wall of boxes on a hot drop",
          "Streamproof rendering",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "This is the lowest-exposure product on the Apex page and one of the lowest on the site. Nothing it does appears in another player's screen, in a spectator view, or in a clip of you.",
      "It is not risk-free. It is still software reading the game, and EAC detects software rather than behaviour — an ESP-only cheat that gets detected is banned exactly like any other.",
      "What it removes is the second path to a ban: being reported by someone who watched you play. That is the path most people actually get caught on.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam or EA App copy of Apex Legends",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You want information without anything another player could record",
      "You are decent at the game already and the aim is not what you are missing",
      "You have been banned before and want to reduce how visible you are, not just change provider",
    ],
    chooseOther: [
      "If you want aim assistance too, Ancient Apex or Arcane Apex both include it.",
      "If you want ESP-only on several games rather than just Apex, ask support which of the multi-game options can be configured down — buying a full cheat and disabling most of it is a reasonable route.",
    ],
    faqs: [
      {
        q: "Is ESP-only actually safer?",
        a: "Against detection, no — a detected cheat is a detected cheat. Against being reported and reviewed, substantially, because there is nothing to see in a clip of you playing.",
      },
      {
        q: "Can I add an aimbot later?",
        a: "Not to this product. Vector does not have one to enable. Ancient Apex is the upgrade path.",
      },
      {
        q: "Why would I pay for something with no aimbot?",
        a: "Because in a squad battle royale, information wins more rounds than aim does. Knowing a third squad is rotating in decides whether you take the fight at all.",
      },
      {
        q: "Does it show loot rarity?",
        a: "Yes, with filtering, so you can hide everything below a threshold once you are kitted.",
      },
    ],
  },
  {
    key: "apex/arcane",
    intro: [
      "Arcane for Apex is the multi-game option: one subscription that also covers Rust, CS2, ARC Raiders and Palworld among others. If your group rotates between games, it stops you buying a separate product each time.",
      "The Apex feature set is solid rather than exceptional — ESP, aim assistance with projectile compensation, loot filtering. If Apex is the only game you play, the Apex-specific products go deeper, and it is worth saying that plainly.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player ESP with distance, squad grouping and knocked state",
          "Loot ESP with rarity filtering",
          "Death box and care package indicators",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Field-of-view-limited assist with smoothing",
          "Projectile travel compensation",
          "Recoil control",
          "Visibility checks",
        ],
      },
      {
        heading: "Cross-game",
        items: [
          "One subscription across the provider's supported titles",
          "Per-game configuration profiles",
          "Single loader for all covered games",
        ],
      },
    ],
    safety: [
      "Apex enforcement is EAC plus report-driven review in waves. The same guidance applies as to any Apex cheat: quiet settings in ranked, an account you can lose.",
      "One practical note specific to multi-game products — a detection on any covered title takes the subscription offline for all of them. Breadth cuts both ways.",
      "External, so no injection into the game process.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam or EA App copy of Apex Legends",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You play several of the covered games and want one purchase",
      "You move between titles often enough that per-game subscriptions have cost you money",
      "A solid Apex feature set is enough and you do not need the deepest one",
    ],
    chooseOther: [
      "If Apex is all you play, Ancient Apex is the fuller Apex product.",
      "If you want no aim features at all, Vector is ESP-only.",
    ],
    faqs: [
      {
        q: "Which games does one subscription cover?",
        a: "Apex, Rust, CS2, ARC Raiders and Palworld among others. The set changes over time — check the current listing before buying specifically for a title.",
      },
      {
        q: "If Apex goes down, do the other games still work?",
        a: "Usually yes, since builds are per-game. A provider-wide detection is the case where everything pauses at once.",
      },
      {
        q: "Is the Apex build as good as a dedicated Apex cheat?",
        a: "It is competent and complete. A product built only for Apex will generally go deeper on Apex-specific tooling, which is the honest trade for the breadth.",
      },
      {
        q: "Can I use different settings per game?",
        a: "Yes, configuration profiles are per game.",
      },
    ],
  },
  {
    key: "call-of-duty/ancient",
    intro: [
      "Ancient for Call of Duty is an external covering ESP, aim assistance and UAV-style information across the current Warzone and multiplayer builds. Call of Duty runs Ricochet, which includes a kernel-level driver, so staying outside the game process is the meaningful design decision here.",
      "Ricochet is also unusual in what it does when it catches you. Rather than banning immediately it may apply mitigations — damage that does nothing, your character becoming invisible to other players, being quarantined into lobbies of other suspected cheaters. If the game starts behaving strangely, that is information, not a bug.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player boxes and skeletons with distance and team colouring",
          "Health and armour plate state",
          "Loot, contract and buy-station indicators for Warzone",
          "Vehicle and killstreak tracking",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Field-of-view-limited assist with smoothing",
          "Recoil control per weapon",
          "Visibility checks before engaging",
          "Bullet-drop compensation at Warzone ranges",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Separate profiles for Warzone and multiplayer",
          "Streamproof rendering",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "Ricochet's kernel driver loads at game start and stays resident. Other kernel-level tools running at the same time cause conflicts, so remove leftover drivers from previous cheats before you launch.",
      "Mitigations come before bans. Damage not registering, or being placed in obviously strange lobbies, generally means you are already flagged — stop, rather than reconfiguring and continuing.",
      "Activision bans by account and by hardware, and hardware bans persist. On Call of Duty a spoofer is close to mandatory if the machine has any history.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Battle.net or Steam copy of the current Call of Duty title",
      "Administrator rights for the loader",
      "No other kernel-level driver or bypass loaded",
    ],
    chooseWhen: [
      "You play Warzone and want loot and contract information as well as combat features",
      "You would rather stay external given Ricochet's kernel component",
      "You want distinct profiles for Warzone and multiplayer",
    ],
    chooseOther: [
      "If you want internal-grade aim and accept the exposure, B07 / WZ Internal is the alternative here.",
      "If the machine has ever been banned, buy a spoofer before buying either.",
    ],
    faqs: [
      {
        q: "What is Ricochet actually doing?",
        a: "Running a kernel-level driver alongside the game and, in many cases, applying in-game mitigations to suspected cheaters instead of banning them straight away. Strange behaviour in a match is a warning sign worth acting on.",
      },
      {
        q: "Why is my damage not registering?",
        a: "That is one of Ricochet's documented mitigations. Treat it as a flag on the account rather than a technical fault.",
      },
      {
        q: "Do I need a spoofer for Call of Duty?",
        a: "If the machine has ever had a banned account on it, yes. Activision hardware bans follow the hardware and a new account will not clear them.",
      },
      {
        q: "Does it work on both Warzone and multiplayer?",
        a: "Yes, with separate profiles, since useful settings differ substantially between the two.",
      },
    ],
  },
  {
    key: "call-of-duty/b07-wz-internal",
    intro: [
      "B07 / WZ Internal loads into the Call of Duty process rather than reading it from outside. That buys frame-accurate tracking, aim behaviour that follows targets rather than correcting toward them, and visuals drawn by the game's own renderer.",
      "It also puts code inside a process guarded by a kernel-level anti-cheat that is actively looking for exactly that. This is the highest-exposure Call of Duty option on the site. Buy it for the performance with the risk understood, or buy the external instead.",
    ],
    featureGroups: [
      {
        heading: "Aimbot",
        items: [
          "Frame-accurate tracking with no polling gap between game state and correction",
          "Configurable field of view, smoothing and bone selection",
          "Bullet-drop and travel prediction at Warzone distances",
          "Visibility checks against the game's own state",
        ],
      },
      {
        heading: "Visuals",
        items: [
          "ESP through the game's renderer — no separate overlay window",
          "Player boxes, skeletons, health and plate state",
          "Loot, contract and buy-station indicators",
          "Chams and visibility colouring",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Warzone and multiplayer profiles",
          "Per-feature toggles, so it can be run close to visuals-only",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "An internal cheat against Ricochet's kernel driver is the highest-risk combination available for this game. There is no configuration that makes it a low-risk purchase.",
      "Use hardware and an account you have already written off, and load a spoofer first.",
      "Ricochet's mitigations apply here as well — damage that does nothing or lobbies full of obvious cheaters means you are flagged. Stop at that point rather than adjusting settings.",
      "Kernel driver conflicts cause mid-match crashes rather than clean errors. Nothing else kernel-level may be loaded.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Battle.net or Steam copy of the current Call of Duty title",
      "Administrator rights for the loader",
      "A spoofer — treat this as required rather than recommended",
    ],
    chooseWhen: [
      "You want the best aim and visual quality available for Call of Duty",
      "The account and the machine are both disposable",
      "You already run a spoofer as a matter of course",
    ],
    chooseOther: [
      "If the account matters, Ancient COD is external and is the sensible default.",
      "If you have not bought a spoofer, buy that first — this is not the product to run on clean hardware you care about.",
    ],
    faqs: [
      {
        q: "How much better is the aim than the external?",
        a: "Noticeably. Internals read the real game state every frame, so tracking is smooth and projectile prediction is accurate rather than estimated. That is the entire reason to accept the extra risk.",
      },
      {
        q: "Can I run it without a spoofer?",
        a: "Technically yes. It is a bad idea — Activision hardware bans persist and this is the product most likely to earn one.",
      },
      {
        q: "It crashes when the match loads.",
        a: "Almost always another kernel-level driver conflicting with Ricochet: a second bypass, an overlay, or remnants of a previous cheat. Remove them and reboot.",
      },
      {
        q: "Does it cover both Warzone and multiplayer?",
        a: "Yes, with separate profiles.",
      },
    ],
  },
  {
    key: "dayz/ancient",
    intro: [
      "Ancient for DayZ is an external covering player ESP, item and vehicle information, and aim assistance. DayZ runs BattlEye, and the external design keeps it clear of the checks aimed at code loaded into the game.",
      "DayZ is not a shooter with a survival theme — it is a game where you can walk for forty minutes and meet nobody, and then lose six hours of gear in two seconds. That asymmetry is what a cheat changes here. Knowing whether the treeline is empty before you cross the field is worth more than winning the gunfight you should never have entered.",
    ],
    featureGroups: [
      {
        heading: "Player and threat information",
        items: [
          "Player ESP with distance and visibility state at long range",
          "Zombie and animal indicators, which matter because noise pulls players as well as infected",
          "Vehicle tracking",
          "Tent, stash and base indicators — the things people spend weeks accumulating",
        ],
      },
      {
        heading: "Loot information",
        items: [
          "Item ESP with category filtering",
          "Weapon and ammunition highlighting",
          "Medical supply filtering, which on DayZ decides whether an injury ends the character",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Field-of-view-limited assist with smoothing",
          "Bullet drop and zeroing compensation at DayZ's genuinely long engagement ranges",
          "Visibility checks before engaging",
        ],
      },
    ],
    safety: [
      "Most DayZ servers are community-run with active admins who watch logs and spectate. That is a very different threat model from an anti-cheat: a person deciding you are suspicious can ban you from their server regardless of what BattlEye thinks.",
      "Official servers apply global BattlEye bans; community servers apply their own. Being clean on one says nothing about the other.",
      "DayZ's engagement ranges make aim assistance conspicuous. A 400-metre first-shot hit on a moving target is remembered and reported.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of DayZ",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You play long sessions and losing geared characters to ambushes is what actually costs you",
      "Stash and tent information is worth more to you than combat features",
      "You want a full toolkit rather than information only",
    ],
    chooseOther: [
      "If you mainly play one heavily-administered community server, consider whether any cheat is worth the account there — admin review is the real risk, not BattlEye.",
      "If you have been hardware banned, a spoofer comes first.",
    ],
    faqs: [
      {
        q: "Does it work on community servers?",
        a: "Generally yes, but community servers have active human admins who spectate and read logs. They are the harder problem, not BattlEye.",
      },
      {
        q: "Is stash ESP the main draw?",
        a: "For most long-term players, yes. Finding what other people have hidden is the difference between a wipe-long grind and a full kit in an afternoon.",
      },
      {
        q: "Does the aimbot handle DayZ's ballistics?",
        a: "It compensates for drop and zeroing, which DayZ models heavily. That is also what makes it visible — nobody first-shots a moving target at 400 metres by accident.",
      },
      {
        q: "Will a server ban follow me to other servers?",
        a: "A community ban is that server's own. A global BattlEye ban from official servers is not.",
      },
    ],
  },
  {
    key: "fivem/macho",
    intro: [
      "Macho is a FiveM menu — a completely different category from the anti-cheat-evading cheats elsewhere on this site. FiveM is GTA V roleplay on community-run servers, and the thing standing between you and a ban is not a kernel driver but a staff team reading logs.",
      "That changes what the product is for and how it should be used. Server-side anti-cheat scripts detect actions rather than software: a teleport, a spawned vehicle, a health change that no in-game event explains. What gets people banned on FiveM is doing something the server logged, not running something the server found.",
    ],
    featureGroups: [
      {
        heading: "Player and world",
        items: [
          "Player ESP with distance and vehicle occupancy",
          "Blip and entity information beyond what the server shares with your client",
          "NPC and vehicle listings",
        ],
      },
      {
        heading: "Self options",
        items: [
          "Movement modifiers",
          "Vehicle handling options",
          "Cosmetic and appearance controls",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Per-server profiles, since what is survivable varies enormously between servers",
          "Adjustable menu key",
          "Feature toggles so intrusive options can stay off entirely",
        ],
      },
    ],
    safety: [
      "FiveM has no kernel anti-cheat. It has server-side detection scripts and staff, and both work on what you did rather than what you are running. Anything that produces an event the server did not authorise is the risk.",
      "Bans are typically per server, but FiveM can also ban at the CFX account and hardware level for serious cases, and that follows you everywhere.",
      "Roleplay servers in particular have large staff teams and a culture of reporting. A menu used visibly is caught by people, quickly.",
      "Read-only features — seeing players and entities — leave nothing in a server log. Anything that changes state does.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "A legitimate copy of GTA V and a working FiveM install",
      "Administrator rights for the loader",
      "Secure Boot disabled",
    ],
    chooseWhen: [
      "You play FiveM and want information the server does not send your client",
      "You understand that the threat is staff and logs, not an anti-cheat",
      "You want per-server profiles because you play on more than one",
    ],
    chooseOther: [
      "If you want to keep a character you have invested months in, think hard — a staff ban usually takes the character with it and there is no appeal worth relying on.",
      "Nothing else on this site covers FiveM; this is the only product for it.",
    ],
    faqs: [
      {
        q: "Can FiveM servers detect this?",
        a: "Server-side scripts detect actions — teleports, spawns, unexplained state changes. They do not scan your machine. What you do is what gets logged.",
      },
      {
        q: "Will a ban from one server affect others?",
        a: "Usually not; bans are typically per server. Serious cases can reach the CFX account or hardware level, and those do follow you.",
      },
      {
        q: "Is it safe on roleplay servers?",
        a: "Roleplay servers have the largest staff teams and the most attentive playerbases on FiveM. Assume more scrutiny there, not less.",
      },
      {
        q: "Does it work on every server?",
        a: "Most, but servers run varying anti-cheat scripts and some block far more than others. Per-server profiles exist because of exactly this.",
      },
    ],
  },
  {
    key: "escape-from-tarkov/coffee-chams",
    intro: [
      "Coffee Chams is a visuals-focused Tarkov product. Chams render players through walls in a solid colour using the game's own materials, which on Tarkov's dark interiors and heavy foliage is more legible than box ESP — a shape you can read at a glance rather than a rectangle you have to interpret.",
      "Tarkov punishes bad information harder than any other game here. A raid is thirty minutes of accumulated risk and a death takes the whole kit, including whatever you insured badly. Seeing the person in the treeline before they see you is the entire game.",
    ],
    featureGroups: [
      {
        heading: "Chams and visuals",
        items: [
          "Player chams through walls with configurable colours",
          "Separate colouring for PMCs, Scavs and bosses — mistaking a player Scav for an AI one is how raids end",
          "Visibility-based colour changes so you know when you are exposed",
          "Distance-based fading to keep a compound readable",
        ],
      },
      {
        heading: "Raid information",
        items: [
          "Extract indicators",
          "Boss and raider spawn awareness",
          "Loot container highlighting",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Per-map profiles — Labs and Woods need entirely different settings",
          "Streamproof rendering",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "Tarkov runs BattlEye and Battlestate enforce aggressively, including publicised ban waves with named accounts. They also act on suspicion from flea-market and raid statistics, not only on detections.",
      "Chams are visible only to you. Nothing about them appears in another player's view, which makes this a quieter product than anything with aim assistance.",
      "The statistical trail is the real risk on Tarkov. Survival rates far above average, and consistent high-value extracts, get accounts looked at by people.",
      "Never run this on an EOD or Unheard account. Battlestate do not restore them.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "A legitimate Escape From Tarkov account and install",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You want visual information and nothing another player could record",
      "You play dark maps and interiors where box ESP is hard to read",
      "Distinguishing player Scavs from AI is what keeps costing you raids",
    ],
    chooseOther: [
      "If you want loot value filtering and a fuller feature set, CRYO covers considerably more.",
      "If your account has EOD or Unheard on it, use a separate account for this — no product here is worth that.",
    ],
    faqs: [
      {
        q: "Why chams instead of boxes?",
        a: "Tarkov's environments are dark and cluttered. A solid coloured player shape is readable instantly; a box around a figure in a shadowed doorway often is not.",
      },
      {
        q: "Can other players see the chams?",
        a: "No. They are rendered on your machine only, which is what makes this a low-visibility product.",
      },
      {
        q: "Will my survival rate get me banned?",
        a: "It can contribute. Battlestate look at statistics as well as detections, and an implausible survival rate is one of the clearest signals there is.",
      },
      {
        q: "Does it separate player Scavs from AI Scavs?",
        a: "Yes, with distinct colouring. That distinction alone prevents a large share of avoidable deaths.",
      },
    ],
  },
  {
    key: "escape-from-tarkov/cryo",
    intro: [
      "CRYO is the fuller Tarkov option: player and loot ESP, value-based item filtering, extract and boss information, and aim assistance. Where Coffee Chams gives you visual clarity, CRYO adds economic information — what is worth carrying out, and what is not worth the slot.",
      "Tarkov is a game about inventory economics as much as gunfights. A raid where you extract with the right two items beats a raid where you kill five people and carry out ammunition. Loot value filtering is the feature that reflects that.",
    ],
    featureGroups: [
      {
        heading: "Loot and economy",
        items: [
          "Item ESP with flea-market value filtering, so only what pays for the raid is drawn",
          "Container and stash highlighting",
          "Quest item indicators, which removes the worst part of task progression",
          "Filtering thresholds you can raise as your stash improves",
        ],
      },
      {
        heading: "Player information",
        items: [
          "PMC, Scav and boss ESP with distinct colouring",
          "Distance and visibility state",
          "Health and gear indication for deciding whether a fight is worth it",
        ],
      },
      {
        heading: "Raid and aim",
        items: [
          "Extract indicators with availability state",
          "Boss and raider spawn awareness",
          "Field-of-view-limited aim assistance with smoothing",
          "Ballistic compensation for Tarkov's heavily modelled ammunition",
        ],
      },
    ],
    safety: [
      "BattlEye plus Battlestate's own statistical review. Tarkov's ban waves are public, name accounts, and take the whole account including edition upgrades.",
      "Aim assistance is where the visible risk is. Tarkov's community records constantly and a death to an impossible shot gets posted and reviewed.",
      "The economic trail matters as much as the gameplay one. Extracting high-value items at an implausible rate, or flea activity that does not match your raid history, is the pattern that draws attention.",
      "Use an account you can lose. Never an EOD or Unheard one.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "A legitimate Escape From Tarkov account and install",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You want loot value filtering — the feature that changes Tarkov most",
      "You are progressing tasks and quest item indicators would save you real time",
      "You want aim assistance as well as information",
    ],
    chooseOther: [
      "If you want the quietest option, Coffee Chams has no aim features and nothing anyone can record.",
      "If your account carries an edition upgrade you would miss, buy a second account before buying this.",
    ],
    faqs: [
      {
        q: "What does value filtering actually do?",
        a: "It draws only items above a price threshold you set, so a dorm room shows the two things worth taking instead of forty things worth nothing.",
      },
      {
        q: "Does it show quest items?",
        a: "Yes. For anyone working through tasks that is often the single most useful feature in the product.",
      },
      {
        q: "How risky is the aim assistance on Tarkov?",
        a: "Higher than on most games. Tarkov players record raids routinely and an implausible kill is shared, watched and reported within hours.",
      },
      {
        q: "Can I run it with only the loot features on?",
        a: "Yes, and for most players that is the sensible configuration — it is where the value is and it leaves nothing visible to anyone else.",
      },
    ],
  },
  {
    key: "delta-force/ancient-delta-force-external",
    intro: [
      "Ancient Delta Force External covers ESP, aim assistance and extraction-mode information for both Warfare and the Operations extraction mode. Delta Force runs Anti-Cheat Expert (ACE), a kernel-level anti-cheat used across several Tencent-published titles and less familiar to most players than EAC or BattlEye.",
      "That unfamiliarity is worth naming. ACE loads a kernel driver at startup and is stricter about co-loaded drivers than most Western anti-cheats — the practical consequence is that setups which work fine on other games conflict here.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Player boxes and skeletons with distance and team colouring",
          "Operator ability and gadget indicators",
          "Vehicle tracking, which matters more in Warfare's larger modes",
          "Loot and extraction point information for Operations",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Field-of-view-limited assist with smoothing",
          "Recoil control per weapon",
          "Ballistic compensation at long ranges",
          "Visibility checks before engaging",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Separate profiles for Warfare and Operations — they reward completely different settings",
          "Streamproof rendering",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "ACE is kernel-level and loads before the game. Other kernel drivers — a second bypass, an overlay, leftovers from another cheat — cause failures at launch rather than clean errors.",
      "Operations is extraction mode: deaths cost gear, so other players pay close attention to how they died and report accordingly. Warfare is more forgiving of an unremarkable session.",
      "Secure Boot must be off, and ACE's behaviour around Windows security settings is stricter than most. Follow the setup instructions exactly rather than adapting a routine from another game.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam or standalone copy of Delta Force",
      "Administrator rights for the loader",
      "No other kernel-level driver loaded",
    ],
    chooseWhen: [
      "You play Operations and losing kit to ambushes is what costs you",
      "You want one product covering both game modes with separate profiles",
      "You want information as well as aim assistance",
    ],
    chooseOther: [
      "If you have been hardware banned, buy a spoofer first — ACE bans reach hardware.",
      "Nothing else here covers Delta Force; this is the only product for it.",
    ],
    faqs: [
      {
        q: "What is ACE?",
        a: "Anti-Cheat Expert, a kernel-level anti-cheat used across several Tencent-published games. It is stricter about co-loaded drivers than EAC or BattlEye, which is the main practical difference.",
      },
      {
        q: "It fails to launch — where do I start?",
        a: "Another kernel driver, almost always. Remove other bypasses and overlays, reboot, and confirm Secure Boot is off before contacting support.",
      },
      {
        q: "Does it work in Operations as well as Warfare?",
        a: "Yes, with separate profiles. Operations rewards information and quiet settings; Warfare tolerates more.",
      },
      {
        q: "Do I need a spoofer?",
        a: "If this machine has had a banned Delta Force account on it, yes. ACE bans reach hardware and a new account will not clear one.",
      },
    ],
  },
  {
    key: "palworld/arcane",
    intro: [
      "Arcane for Palworld is the odd one out on this site, and it is worth being straightforward about why: Palworld has no kernel anti-cheat, and most people play it solo or on a private server with friends. The risk profile is nothing like Rust or Tarkov.",
      "What it does is change how much of the game is grinding. Palworld's later stages are built around resource accumulation, base throughput and breeding for traits — hours of waiting rather than difficulty. Most of the value here is removing that.",
    ],
    featureGroups: [
      {
        heading: "World and creature information",
        items: [
          "Pal ESP with species and rarity indication",
          "Trait and passive visibility before you catch something, rather than after",
          "Ore, resource node and chest highlighting",
          "Dungeon and boss location indicators",
        ],
      },
      {
        heading: "Player options",
        items: [
          "Movement and traversal modifiers",
          "Gathering and crafting speed options",
          "Inventory and resource conveniences",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Profiles for solo versus multiplayer sessions",
          "Feature toggles so multiplayer sessions can run a reduced set",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "Singleplayer and private servers carry essentially no detection risk — there is no anti-cheat to detect anything and no other players to report you.",
      "Public and community servers are a different matter. Server owners can see anomalous progression in save data, and a ban there is at the owner's discretion.",
      "Do not use it on a co-op world with friends who did not agree to it. That is the realistic way this causes a problem for anyone.",
      "One subscription also covers Rust, Apex, CS2 and ARC Raiders — and those absolutely do have anti-cheat. Do not carry Palworld habits into them.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Steam or Xbox/Game Pass copy of Palworld",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You play solo or on a private server and want the grind removed",
      "Breeding for traits is where your hours are going",
      "You already want Arcane for one of the other covered games and Palworld comes with it",
    ],
    chooseOther: [
      "If you only play Palworld solo, consider whether the game's own settings already give you what you want — difficulty and rate multipliers are configurable and free.",
      "If you play on a public community server, ask the owner's rules first; this is the one game here where that is a realistic option.",
    ],
    faqs: [
      {
        q: "Can I be banned for using this in Palworld?",
        a: "Not in singleplayer or on your own server — there is nothing there to ban you. On public community servers the owner can, based on save data.",
      },
      {
        q: "Does trait visibility work before catching a Pal?",
        a: "Yes, which is the point. Palworld breeding is otherwise a long loop of catching, checking and discarding.",
      },
      {
        q: "Is this worth buying just for Palworld?",
        a: "Honestly, often not — Palworld exposes difficulty and rate multipliers in its own settings for free. It makes more sense as part of the multi-game subscription.",
      },
      {
        q: "Which other games does the subscription cover?",
        a: "Rust, Apex, CS2 and ARC Raiders among others. Those have real anti-cheat, so read those product pages before using it there.",
      },
    ],
  },
  {
    key: "valorant/nocturnal",
    intro: [
      "Valorant is the hardest game on this site to cheat on, and anything that does not say so is selling you something. Riot Vanguard loads at boot as a signed kernel driver, runs before Windows finishes starting, and refuses to let the game launch if the machine's security configuration is not what it expects.",
      "Nocturnal is built around that constraint rather than pretending it does not exist. What it means in practice is that the setup is stricter than any other product here, and the requirements below are conditions rather than suggestions.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Agent ESP with distance and visibility state",
          "Health and armour indication",
          "Ability and ultimate charge awareness, which decides more Valorant rounds than aim does",
          "Spike location and defuse tracking",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Tightly limited field of view with heavy smoothing as the default rather than an option",
          "Visibility checks so it will not track through a wall you cannot shoot",
          "Body targeting as the default — headshot snapping on Valorant is the fastest route to a review",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Profiles saved per configuration",
          "Streamproof rendering",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "Vanguard is a boot-start kernel driver. It is resident before anything you load, it is signed, and it checks the state of the system rather than only the game process. This is a fundamentally different problem from EAC or BattlEye.",
      "Vanguard requires Secure Boot and TPM 2.0 on Windows 11. Most cheats on this site require Secure Boot to be *off*. Those two facts are in direct conflict, and resolving it is the whole setup — follow the supplied instructions exactly and do not reuse a routine from another game.",
      "Riot ban by hardware aggressively and permanently, and Vanguard collects hardware identifiers from boot. A spoofer is not optional here in any meaningful sense.",
      "Valorant also records every match and its community reports constantly. Even with everything configured correctly, obvious play is the most common way people are caught.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "A spoofer — treat this as a hard requirement, not a recommendation",
      "System security settings configured exactly as the supplied instructions state, which differs from every other product here",
      "Administrator rights for the loader",
      "Hardware and an account you are fully prepared to lose",
    ],
    chooseWhen: [
      "You understand Vanguard's threat model and are buying with that in mind",
      "You already run a spoofer and treat the hardware as disposable",
      "You want information and restrained aim assistance rather than an obvious aimbot",
    ],
    chooseOther: [
      "If you are not willing to lose the machine's clean status, do not buy a Valorant product at all — this is the game where that outcome is most likely.",
      "If you have not bought a spoofer, buy that first. Nothing here changes that order.",
    ],
    faqs: [
      {
        q: "Is Valorant safe to cheat on?",
        a: "Less than any other game listed here. Vanguard is a boot-start kernel driver with system-wide visibility, and Riot's hardware bans are permanent. Anyone telling you otherwise is selling something.",
      },
      {
        q: "Vanguard needs Secure Boot on, but the loader needs it off. Which is it?",
        a: "That conflict is the core of the setup and why the supplied instructions differ from every other product on this site. Follow them exactly; a routine that worked on Rust or CS2 will not apply.",
      },
      {
        q: "Do I need a spoofer?",
        a: "Yes. Vanguard collects hardware identifiers from boot and Riot ban on them permanently. Buying this without a spoofer is buying a hardware ban.",
      },
      {
        q: "Why is the aimbot so restrained?",
        a: "Because Valorant records every match and its playerbase reports constantly. A snapping aimbot on Valorant does not last, whatever anti-cheat status the build has.",
      },
    ],
  },
  {
    key: "valorant/unnamedtech-external",
    intro: [
      "UnnamedTech Valorant External is an information-first product for a game where information is most of what can safely be taken. It reads Valorant from outside the process and concentrates on ESP and utility awareness rather than aim.",
      "The same warning that applies to any Valorant product applies here: Riot Vanguard is a boot-start kernel driver with system-wide visibility, and this is the highest-risk game on the site regardless of which product you pick. External reduces one category of exposure. It does not make Valorant safe.",
    ],
    featureGroups: [
      {
        heading: "ESP and information",
        items: [
          "Agent boxes and skeletons with distance",
          "Visibility state and health",
          "Ability and ultimate tracking — knowing an ultimate is available changes whether a site take is possible",
          "Spike carrier and plant location",
        ],
      },
      {
        heading: "Round awareness",
        items: [
          "Weapon and economy indication, which tells you whether the enemy is on a save round",
          "Utility usage tracking through the round",
          "Team-wide positional information",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Restrained defaults intended for ranked play",
          "Streamproof rendering",
          "Adjustable menu key",
        ],
      },
    ],
    safety: [
      "Vanguard runs from boot, checks system state as well as the game process, and requires Secure Boot and TPM 2.0 on Windows 11 — which conflicts directly with what most loaders here need. The supplied setup instructions are specific to this and must be followed as written.",
      "Riot hardware bans are permanent and collected from boot. Use a spoofer.",
      "Concentrating on information rather than aim removes the most visible way to be reported, which on a game with saved matches and an attentive playerbase is a real reduction in risk — just not in detection risk.",
      "Use an account with nothing on it. Riot do not restore banned accounts.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "A spoofer — required in practice",
      "System configuration exactly as the supplied instructions state",
      "Administrator rights for the loader",
      "Hardware you are prepared to have permanently flagged",
    ],
    chooseWhen: [
      "You want information rather than aim, which is the sane way to approach Valorant",
      "You already run a spoofer",
      "You want the option with the least visible in-game behaviour",
    ],
    chooseOther: [
      "If you want aim assistance as well, Nocturnal includes it — with correspondingly more exposure.",
      "If you are not prepared to lose the hardware's clean status, do not buy a Valorant product at all.",
    ],
    faqs: [
      {
        q: "Is an external safer against Vanguard?",
        a: "It avoids the checks aimed at code inside the game process. Vanguard's system-wide, boot-start visibility is unaffected by that, so the improvement is real but narrower than on other games.",
      },
      {
        q: "Why no aimbot?",
        a: "Because on Valorant the reporting and review path catches far more people than detection does, and aim is what makes you reportable.",
      },
      {
        q: "Do I need a spoofer for this too?",
        a: "Yes. It applies to every Valorant product without exception.",
      },
      {
        q: "Can I use my main account?",
        a: "No. Riot bans are permanent and unappealable in practice, and they take everything on the account.",
      },
    ],
  },
  {
    key: "hwid-spoofers/desync-perm-spoofer",
    intro: [
      "Desync is a permanent HWID spoofer. It changes the hardware identifiers anti-cheats read — disk serials, motherboard and SMBIOS values, MAC addresses, TPM-derived identifiers — so that a machine carrying a hardware ban presents as a different one.",
      "Permanent means the change persists across reboots rather than being applied per session. That is the practical difference from a temporary spoofer: you set it once and the machine stays changed, which suits someone recovering a banned PC rather than someone cycling identities between sessions.",
    ],
    featureGroups: [
      {
        heading: "What it changes",
        items: [
          "Disk and volume serial numbers",
          "Motherboard, BIOS and SMBIOS identifiers",
          "Network adapter MAC addresses",
          "GPU and peripheral identifiers where anti-cheats read them",
        ],
      },
      {
        heading: "Coverage",
        items: [
          "Effective against the identifier collection used by EAC and BattlEye titles",
          "Persistent across reboots — no reapplication before each session",
          "Cleanup of the traces left by previous cheat and spoofer installations",
        ],
      },
      {
        heading: "Operation",
        items: [
          "Run before the game and before any cheat loader",
          "Reboot when instructed rather than skipping it",
          "Restore point so the original identifiers can be brought back",
        ],
      },
    ],
    safety: [
      "A spoofer does not unban an account. It changes what the machine looks like. Your banned account stays banned — you need a new one as well.",
      "Order matters: spoofer first, reboot if asked, then the game, then the cheat loader. Doing it in any other order leaves the original identifiers already read.",
      "It cannot help if the ban is tied to something it does not touch — a payment method, an email, or a phone number the publisher has associated with you.",
      "Permanent changes are more invasive than temporary ones. Use the restore point rather than trying to undo it manually.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Administrator rights",
      "A reboot as part of first use",
      "A new game account — the spoofer does not recover the banned one",
    ],
    chooseWhen: [
      "You have been hardware banned and want the machine usable again",
      "You would rather set it once than run something before every session",
      "You are also removing the remnants of a previous cheat install",
    ],
    chooseOther: [
      "If you want per-session identities rather than a persistent change, Saturn Spoofer is session-based.",
      "If you have not actually been hardware banned, you probably do not need a spoofer at all — it is another driver and another thing to conflict with.",
    ],
    faqs: [
      {
        q: "Will this unban my account?",
        a: "No. It changes the machine's identifiers, not your account's status. You need a new account as well, every time.",
      },
      {
        q: "Is it really permanent?",
        a: "It persists across reboots rather than needing reapplication each session. It is reversible through the restore point it creates.",
      },
      {
        q: "Which games does it cover?",
        a: "It targets the hardware identifier collection used broadly by EAC and BattlEye titles rather than being written per game. Vanguard-protected games are a stricter case — check the Valorant product pages.",
      },
      {
        q: "Do I run it before or after the cheat loader?",
        a: "Before. Spoofer, reboot if prompted, then the game, then the loader. Anything else and the real identifiers have already been read.",
      },
    ],
  },
  {
    key: "hwid-spoofers/saturn-spoofer-eac",
    intro: [
      "Saturn is a session-based spoofer aimed specifically at Easy Anti-Cheat titles. It applies fresh hardware identifiers for the session and does not persist them, so each run presents as a different machine.",
      "That suits a different problem from a permanent spoofer. If you are cycling accounts and expect some of them to be banned, a fresh identity per session means one ban does not attach to the identifiers you will use next time. If you simply want a banned PC working again, the permanent option is the simpler answer.",
    ],
    featureGroups: [
      {
        heading: "What it changes",
        items: [
          "Disk and volume serials",
          "Motherboard and SMBIOS values",
          "MAC addresses",
          "The identifier set EAC specifically collects",
        ],
      },
      {
        heading: "Session model",
        items: [
          "Fresh identifiers each run rather than a persistent change",
          "Nothing left behind after a reboot",
          "Suits account cycling, where each session should be unlinked from the last",
        ],
      },
      {
        heading: "Operation",
        items: [
          "Run before the game and before the cheat loader, every session",
          "No reboot required for routine use",
          "EAC-focused rather than a general-purpose spoofer",
        ],
      },
    ],
    safety: [
      "EAC-focused. On BattlEye, Ricochet, ACE or Vanguard titles do not assume coverage — check before relying on it, because a spoofer that misses one identifier is worth nothing.",
      "It does not unban accounts. Every new session still needs a new account if the old one is banned.",
      "Because it is per session, forgetting to run it once exposes the real identifiers — and one session is all that takes.",
      "As with any spoofer: spoofer first, then game, then loader.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Administrator rights",
      "An EAC-protected game — this is not a general-purpose spoofer",
      "A fresh game account per banned one",
    ],
    chooseWhen: [
      "You play EAC titles and cycle accounts",
      "You want each session unlinked from the last rather than one persistent new identity",
      "You would rather leave nothing behind on the machine between sessions",
    ],
    chooseOther: [
      "If you want to fix one banned machine and stop thinking about it, Desync Perm Spoofer persists and needs no per-session step.",
      "If your game runs BattlEye, Ricochet, ACE or Vanguard rather than EAC, check coverage with support before buying this one.",
    ],
    faqs: [
      {
        q: "What is the difference from a permanent spoofer?",
        a: "Saturn applies new identifiers per session and leaves nothing behind; a permanent spoofer changes the machine once and keeps it changed. Cycling accounts favours the first, recovering one banned PC favours the second.",
      },
      {
        q: "Does it work on BattlEye games?",
        a: "It is built for EAC. Do not assume BattlEye, Ricochet, ACE or Vanguard coverage — ask support before buying for one of those.",
      },
      {
        q: "What if I forget to run it?",
        a: "Your real identifiers are read that session. One session is enough to link the hardware, so make it part of the routine rather than something you remember.",
      },
      {
        q: "Will it unban my account?",
        a: "No spoofer does. It changes the machine, not the account.",
      },
    ],
  },
  {
    key: "accounts/rust-temporary-account",
    intro: [
      "A temporary Rust account: a Steam account with Rust on it, sold to be used and lost rather than kept. It exists because Rust bans are account bans first, and the sensible way to cheat on Rust is on an account that costs less than the game does.",
      "Temporary means exactly that. It is not yours in any lasting sense, the credentials may stop working, and it should never hold anything you would miss — no skins, no linked payment method, no email you use elsewhere.",
    ],
    featureGroups: [
      {
        heading: "What you get",
        items: [
          "A Steam account with Rust owned on it",
          "Credentials delivered immediately after payment",
          "Ready to play without a purchase wait",
        ],
      },
      {
        heading: "What it is for",
        items: [
          "Cheating on Rust without risking an account you care about",
          "Replacing an account after a ban wave",
          "Trying a cheat before deciding whether it is worth using on anything else",
        ],
      },
      {
        heading: "What it is not",
        items: [
          "Not a permanent account — assume access ends",
          "Not for storing skins, items or purchases",
          "Not linked to anything of yours: no personal email, no payment method",
        ],
      },
    ],
    safety: [
      "Change nothing that ties the account to you. Adding your email or a payment method links your identity to an account that is expected to be banned.",
      "Rust hardware bans exist alongside account bans. A fresh account on already-banned hardware is money wasted — deal with the hardware first.",
      "Do not put skins on it, and do not trade to it from an account you keep. Steam trade history is visible and it links the two.",
      "Access to a temporary account is not guaranteed to last. That is what the price reflects.",
    ],
    requirements: [
      "A Steam installation you can sign into",
      "Steam Guard handled as described in the delivery instructions",
      "A spoofer if this machine has already been hardware banned",
    ],
    chooseWhen: [
      "You want to cheat on Rust and your main account has skins or hours on it",
      "You have just lost an account and want to be playing again in minutes",
      "You are testing a cheat before committing",
    ],
    chooseOther: [
      "If you want an account to keep, Rust Full Access Account transfers the email as well and is intended to last.",
      "If the machine is already hardware banned, buy a spoofer first — no account fixes that.",
    ],
    faqs: [
      {
        q: "How long will it last?",
        a: "Temporary accounts carry no lifetime guarantee. Treat access as something that ends, and never store anything on it.",
      },
      {
        q: "Can I change the email or password?",
        a: "No — that is what separates it from a full-access account, and doing it will not make the account yours.",
      },
      {
        q: "Will it be banned already?",
        a: "It is delivered in working order. It is also a shared-risk product: the fastest way to lose it is obvious cheating in the first session.",
      },
      {
        q: "Do I still need a spoofer?",
        a: "If this machine has ever had a Rust hardware ban, yes. Rust bans reach hardware and a new account does not clear one.",
      },
    ],
  },
  {
    key: "accounts/rust-full-access-account",
    intro: [
      "A full-access Rust account: a Steam account with Rust on it, delivered with the email as well, so you can change the password, change the recovery address and actually own it.",
      "That is the whole difference from the temporary version. Full access means the account can be secured against everyone including the seller, which is what makes it something you can keep rather than something you borrow.",
    ],
    featureGroups: [
      {
        heading: "What you get",
        items: [
          "A Steam account with Rust owned on it",
          "The account email, with access, so recovery is genuinely yours",
          "The ability to change password, email and security settings",
        ],
      },
      {
        heading: "Securing it",
        items: [
          "Change the Steam password immediately",
          "Change the email password immediately",
          "Move the recovery address to one only you control",
          "Enable Steam Guard on your own device",
        ],
      },
      {
        heading: "What it is for",
        items: [
          "A second account you intend to keep and invest in",
          "Replacing a banned main without starting from zero hours",
          "A clean account for a cheat you expect to survive",
        ],
      },
    ],
    safety: [
      "Secure it in the first ten minutes. An account you have not locked down is one anyone with the original credentials can take back.",
      "It is still an account you did not create. Do not link a payment method or store anything expensive on it until it has survived a while.",
      "Full access does not protect against a hardware ban on your machine, and it does not make cheating on it safe. It only means the account is yours.",
      "Steam's own rules prohibit account transfers. That risk is inherent to the product and it is worth knowing before you buy rather than after.",
    ],
    requirements: [
      "A Steam installation you can sign into",
      "Access to the delivered email — check it works before doing anything else",
      "A password manager, or somewhere sensible to keep two new sets of credentials",
    ],
    chooseWhen: [
      "You want an account you can keep and secure",
      "You are replacing a banned main and want somewhere permanent to land",
      "The ability to change the recovery email matters to you",
    ],
    chooseOther: [
      "If you just need somewhere disposable to run a cheat, the temporary account costs less and is the honest fit.",
      "If your hardware is banned, a spoofer comes first regardless of which account you buy.",
    ],
    faqs: [
      {
        q: "What does full access actually include?",
        a: "The account email as well as the account, so you can change every credential and recovery option. That is what makes it yours rather than borrowed.",
      },
      {
        q: "What should I do first?",
        a: "Change the Steam password, then the email password, then the recovery address, then enable Steam Guard on your own device. In that order, before you play.",
      },
      {
        q: "Can it still be banned?",
        a: "Of course. Full access is about ownership, not immunity — cheat on it and it will be banned like any other account.",
      },
      {
        q: "Is buying a Steam account against Steam's rules?",
        a: "Yes, account transfers are against Steam's terms. That is a real risk inherent to the product and you should factor it in rather than discover it later.",
      },
    ],
  },
  {
    key: "accounts/arc-raiders-temporary-account",
    intro: [
      "A temporary ARC Raiders account, sold to be used and lost. ARC Raiders is an extraction shooter where progression carries between raids, which makes an account something worth spending money on — and something worth not risking.",
      "Same rules as any temporary account here: assume access ends, store nothing on it, and link nothing of yours to it.",
    ],
    featureGroups: [
      {
        heading: "What you get",
        items: [
          "A working ARC Raiders account",
          "Credentials delivered immediately after payment",
          "Ready to play without buying the game again",
        ],
      },
      {
        heading: "What it is for",
        items: [
          "Running a cheat without risking progression you care about",
          "Getting back in after a ban",
          "Trying ARC Raiders products before deciding",
        ],
      },
      {
        heading: "What it is not",
        items: [
          "Not permanent — assume access ends",
          "Not somewhere to build progression you would miss",
          "Not to be linked to your email or payment details",
        ],
      },
    ],
    safety: [
      "Change nothing that identifies you. The point of a disposable account is that nothing connects it to anything else you own.",
      "Progression on a temporary account is progression you are going to lose. Play accordingly.",
      "If the machine has a hardware ban, an account does not fix it — the spoofer does.",
      "ARC Raiders is a newer title with anti-cheat still being actively developed. Enforcement patterns change faster than on established games; check the live status before each session.",
    ],
    requirements: [
      "The ARC Raiders client installed",
      "Login handled as described in the delivery instructions",
      "A spoofer if this machine has already been banned",
    ],
    chooseWhen: [
      "You want to cheat on ARC Raiders and your own account has real progression",
      "You have just been banned and want to be playing again immediately",
      "You are testing before committing to a longer subscription",
    ],
    chooseOther: [
      "If your hardware is banned rather than your account, buy a spoofer instead — an account alone will not get you back in.",
      "If you want something lasting, ask support what full-access options exist for this title before buying a temporary one.",
    ],
    faqs: [
      {
        q: "How long does access last?",
        a: "There is no lifetime guarantee on temporary accounts. Treat every session as possibly the last one.",
      },
      {
        q: "Can I keep the progression?",
        a: "Only for as long as the account works, which is not something you can rely on. Do not grind anything you would be annoyed to lose.",
      },
      {
        q: "Do I need a spoofer as well?",
        a: "If this machine has been banned before, yes. Bans that reach hardware are not solved by a new account.",
      },
      {
        q: "Which cheats work with it?",
        a: "Any of the ARC Raiders products here. Check each one's live status first — enforcement on a newer title moves quickly.",
      },
    ],
  },
  {
    key: "accounts/mails",
    intro: [
      "Bulk email accounts, used for registering game accounts that are not connected to your real identity. Every game account needs an address, and using your own is how a publisher links a banned account to the next one you make.",
      "This is infrastructure rather than a product with features. Its value is separation: an email that has nothing to do with you, used once, for one account you expect to lose.",
    ],
    featureGroups: [
      {
        heading: "What you get",
        items: [
          "Email accounts delivered as credentials after payment",
          "Usable for game account registration and verification",
          "Quantity as listed on the product",
        ],
      },
      {
        heading: "What they are for",
        items: [
          "Registering game accounts unconnected to your identity",
          "Receiving verification and confirmation messages",
          "Keeping each disposable account separate from the last",
        ],
      },
      {
        heading: "What they are not",
        items: [
          "Not for anything you need to keep — assume access ends",
          "Not for password recovery you will need in six months",
          "Not to be reused across accounts you want kept unlinked",
        ],
      },
    ],
    safety: [
      "One email per account. Reusing one across several is exactly the link you bought them to avoid.",
      "Never set one as the recovery address for anything you care about. If access ends, so does your recovery path.",
      "Do not route anything sensitive through them. Treat every message in them as readable by someone else.",
      "Publishers also link accounts by payment method, phone number and hardware. Email is one thread of several — changing it alone does not unlink you.",
    ],
    requirements: [
      "Nothing beyond a browser to access them",
      "Somewhere sensible to record which email went with which account",
    ],
    chooseWhen: [
      "You are creating game accounts you expect to lose",
      "You want each account unconnected to your own address",
      "You are setting up several accounts and need addresses in bulk",
    ],
    chooseOther: [
      "If you want an account ready to play rather than the pieces to make one, the ready-made game accounts are the faster route.",
      "If you are trying to escape a hardware ban, this is the wrong product — you need a spoofer.",
    ],
    faqs: [
      {
        q: "What are these actually for?",
        a: "Registering game accounts without using your own address, so a ban on one cannot be linked to the next by email.",
      },
      {
        q: "How long do they last?",
        a: "No guarantee. Use them for registration and verification, not as a long-term inbox.",
      },
      {
        q: "Can I use one email for several accounts?",
        a: "You can, and it defeats the purpose. One per account, or you have simply moved the link rather than removed it.",
      },
      {
        q: "Does this help with a hardware ban?",
        a: "No. Email separation and hardware identifiers are unrelated problems — the spoofers address the second.",
      },
    ],
  },
  {
    key: "accounts/ip-vanish-account",
    intro: [
      "An IPVanish VPN account. A VPN changes the address a game sees you connecting from, which matters when a publisher restricts by region or blocks a range, and when you would rather your home address not be attached to an account you expect to lose.",
      "It is worth being clear about what a VPN does not do. It does not hide a cheat from an anti-cheat, and it does not help with a hardware ban. Anti-cheats read your machine, not your route to the internet.",
    ],
    featureGroups: [
      {
        heading: "What you get",
        items: [
          "An IPVanish account with credentials delivered after payment",
          "Access to the provider's server locations",
          "Usable on the provider's supported platforms",
        ],
      },
      {
        heading: "What it is useful for",
        items: [
          "Keeping your home address off accounts you expect to lose",
          "Connecting from a different region where that matters",
          "Getting around an IP-range block after enforcement action",
        ],
      },
      {
        heading: "What it does not do",
        items: [
          "Does not hide a cheat from an anti-cheat",
          "Does not clear a hardware ban",
          "Does not make a banned account work again",
        ],
      },
    ],
    safety: [
      "IP is one identifier among several. Publishers also match on hardware, payment method, email and phone number, so changing the IP alone rarely unlinks anything on its own.",
      "Some games treat VPN connections as suspicious in themselves, and a few block known VPN ranges outright. It can cost you access rather than gain it.",
      "Expect higher latency. On a competitive shooter that is a real cost, not a footnote.",
      "This is a purchased account rather than one you registered, so treat access as time-limited and put nothing of yours on it.",
    ],
    requirements: [
      "A device that runs the provider's client",
      "Nothing else — this is a service account, not software you install from us",
    ],
    chooseWhen: [
      "You want your home address off disposable game accounts",
      "You have hit an IP-range block",
      "Region matters for how you are connecting",
    ],
    chooseOther: [
      "If you are trying to recover from a hardware ban, buy a spoofer — a VPN does nothing for that.",
      "If you want a different provider, CyberGhost Account is the other option here.",
    ],
    faqs: [
      {
        q: "Will a VPN stop me being detected?",
        a: "No. Anti-cheats inspect your machine and the game process. Your network route is not what they are reading.",
      },
      {
        q: "Will it get me past a ban?",
        a: "Only an IP-based one, which is the rarest kind. Account and hardware bans are unaffected.",
      },
      {
        q: "Will it hurt my ping?",
        a: "Usually yes. Routing through another server adds latency, and on a competitive shooter you will feel it.",
      },
      {
        q: "How is this different from CyberGhost?",
        a: "Different provider, different server network and client. Neither changes anything about detection — pick on locations and speed.",
      },
    ],
  },
  {
    key: "accounts/cyberghost-account",
    intro: [
      "A CyberGhost VPN account. Same category as the IPVanish listing — a way to connect from a different address, with a different provider's server network and client behind it.",
      "And the same honest limits. A VPN changes where your traffic appears to come from. It does not hide software from an anti-cheat and it does not touch a hardware ban, which is what most people are actually trying to solve when they reach for one.",
    ],
    featureGroups: [
      {
        heading: "What you get",
        items: [
          "A CyberGhost account with credentials delivered after payment",
          "Access to the provider's server network",
          "Usable on the provider's supported platforms",
        ],
      },
      {
        heading: "What it is useful for",
        items: [
          "Keeping your home address off accounts you expect to lose",
          "Region selection where it affects access or queue times",
          "Working around an IP-range block",
        ],
      },
      {
        heading: "What it does not do",
        items: [
          "Does not defeat an anti-cheat",
          "Does not clear a hardware ban",
          "Does not restore a banned account",
        ],
      },
    ],
    safety: [
      "Changing your IP moves one identifier. Hardware, email, payment method and phone number are the others, and publishers match on all of them.",
      "Some anti-cheats and some games flag VPN connections as suspicious, and a few block known ranges outright.",
      "Added latency is a real cost on competitive games.",
      "A purchased service account should be treated as time-limited. Do not attach anything of yours to it.",
    ],
    requirements: [
      "A device that runs the provider's client",
      "Nothing installed from us — this is a service account",
    ],
    chooseWhen: [
      "You want a VPN and prefer CyberGhost's network to IPVanish's",
      "You need to connect from another region",
      "You have hit an IP-range block",
    ],
    chooseOther: [
      "If a hardware ban is the actual problem, buy a spoofer instead.",
      "If you have no preference between providers, compare the two listings on price and server locations — nothing else meaningfully differs for this use.",
    ],
    faqs: [
      {
        q: "Does a VPN help me avoid detection?",
        a: "No. Detection happens on your machine, not on the network path.",
      },
      {
        q: "IPVanish or CyberGhost?",
        a: "For this purpose the difference is server locations, speed and client preference. Neither affects detection at all.",
      },
      {
        q: "Can I use it on more than one device?",
        a: "That depends on the provider's own limits for the plan on the account. Check the listing before assuming a device count.",
      },
      {
        q: "Will it unblock a banned account?",
        a: "Only if the block was on the IP specifically, which is uncommon. Account and hardware bans are untouched.",
      },
    ],
  },
  {
    key: "hell-let-loose/fellas",
    intro: [
      "Fellas is the main Hell Let Loose product here: player ESP across the full two-kilometre map, garrison and outpost locations, supply node tracking, and restrained aim assistance. It is external, reading the game from a separate process rather than injecting into it, which keeps it clear of the checks Easy Anti-Cheat runs against its own memory.",
      "The reason to buy it is the garrison layer. Everything else in a Hell Let Loose cheat is a nicety; knowing where the enemy's hidden infantry spawns are is the thing that decides matches, and it is the single hardest piece of information to get legitimately.",
    ],
    featureGroups: [
      {
        heading: "The map layer",
        items: [
          "Garrison ESP — enemy infantry spawns, including ones placed in treelines and behind buildings",
          "Outpost ESP, which move constantly and are what keeps a squad pushing",
          "Supply node locations for manpower, munitions and fuel",
          "Supply drops and construction resources near the line",
          "Commander ability placements once called in",
        ],
      },
      {
        heading: "Player and vehicle information",
        items: [
          "Infantry ESP with distance, readable at the ranges Hell Let Loose actually fights at",
          "Role indication, so a recon sniper is distinguishable from a rifleman",
          "Armour and transport tracking, including which direction a tank is facing",
          "Visibility state through foliage, which is where most deaths in this game come from",
        ],
      },
      {
        heading: "Aim and configuration",
        items: [
          "Field-of-view-limited assist with heavy smoothing as the default",
          "Bullet drop compensation for the long-range rifle engagements",
          "Saveable profiles, so a quieter setup can be used on servers with active admins",
          "Streamproof rendering and an adjustable menu key",
        ],
      },
    ],
    safety: [
      "Hell Let Loose runs Easy Anti-Cheat, the same kernel-level anti-cheat as Rust and Apex. An EAC ban here is a game ban attached to your Steam account and visible on your profile permanently.",
      "The bigger risk is not EAC. Almost all Hell Let Loose is played on community servers with admins in the match, Discord report channels, and a regular playerbase that knows each other by name. Admins act on behaviour, and no anti-cheat status protects you from that.",
      "The specific behaviour that gets noticed is speed. A garrison you attack four minutes after a recon player could plausibly have found it is unremarkable; one you walk to across open ground within ninety seconds of it being placed is a report.",
      "Large server networks share ban lists, so a ban from one major community can reach several servers rather than the one you were playing on.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of Hell Let Loose",
      "Administrator rights for the loader",
      "No other kernel-level driver or bypass loaded",
      "A spoofer if this machine has ever carried an EAC ban",
    ],
    chooseWhen: [
      "You want the full toolkit — garrisons, nodes, players and armour — rather than a subset",
      "You play regularly on the same servers and want profiles you can dial down",
      "You squad-lead or run recon, where information converts directly into map control",
    ],
    chooseOther: [
      "If you play the Vietnam expansion, Vietnam Fellas is built for its maps and factions rather than adapted to them.",
      "If you also play Rust, Apex, CS2 or ARC Raiders, Arcane covers Hell Let Loose and those on one subscription.",
    ],
    faqs: [
      {
        q: "Does Fellas show garrisons?",
        a: "Yes, and it is the reason to buy it. Garrisons are hidden enemy infantry spawns, finding them is the hardest information problem in the game, and destroying them is how objectives actually fall.",
      },
      {
        q: "Will admins notice?",
        a: "They notice behaviour, not software. Acting on information immediately is what gets people removed — take a plausible route, act a few minutes later, and call it to your squad rather than soloing every garrison.",
      },
      {
        q: "Is the aimbot worth using in Hell Let Loose?",
        a: "Less than in almost any other game. One rifle round kills at most ranges, iron sights and bullet drop fight it, and fifty enemies can watch you use it. The defaults are deliberately restrained.",
      },
      {
        q: "Do I need a spoofer?",
        a: "Only if the machine has already carried an EAC ban. Those reach hardware, and a fresh copy of the game will not clear one.",
      },
      {
        q: "Does it work on community servers?",
        a: "Nearly all Hell Let Loose servers are community-run, so yes. Those are also where admin scrutiny is highest, which is what the profile system is for.",
      },
    ],
  },
  {
    key: "hell-let-loose/vietnam-fellas",
    intro: [
      "Vietnam Fellas covers Hell Let Loose's Vietnam content specifically — different maps, different factions, and a different shape of fight from the European theatre the base game is built around.",
      "That distinction matters more than it sounds. Vietnam's maps are dense jungle rather than open farmland, engagement ranges collapse, and the tunnel and ambush play that defines the mode rewards knowing where people are far more than it rewards long-range aim.",
    ],
    featureGroups: [
      {
        heading: "Vietnam-specific information",
        items: [
          "Garrison and spawn ESP across the Vietnam maps",
          "Tunnel and concealed position awareness, which the terrain hides completely",
          "Faction-correct player identification, so friendly and enemy models are never confused in heavy foliage",
          "Supply and resource tracking for the Vietnam logistics layer",
        ],
      },
      {
        heading: "Close-quarters awareness",
        items: [
          "Player ESP tuned for short sightlines, where a contact at forty metres is already inside the fight",
          "Visibility state through dense vegetation — the single biggest difference from the European maps",
          "Trap and ambush indicators",
          "Vehicle and helicopter tracking where the mode uses them",
        ],
      },
      {
        heading: "Configuration",
        items: [
          "Draw distances tuned shorter than the base game, so the screen is readable in jungle",
          "Saveable profiles per map",
          "Streamproof rendering and an adjustable menu key",
        ],
      },
    ],
    safety: [
      "Same enforcement picture as the base game: Easy Anti-Cheat plus community server admins, with the admins being the more likely way anyone is caught.",
      "Vietnam servers tend to be a smaller, tighter community than the main game's, which cuts both ways — fewer players watching, but the regulars know each other and notice a new name that always knows where the ambush is.",
      "Dense terrain makes impossible knowledge more obvious, not less. Walking directly to a concealed position in jungle is far harder to explain than the same move across open ground.",
      "Use an account you can lose, and check the live status the day you play.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of Hell Let Loose with the Vietnam content",
      "Administrator rights for the loader",
      "No other kernel-level driver loaded",
    ],
    chooseWhen: [
      "You mainly play the Vietnam maps rather than the European ones",
      "Close-quarters awareness in dense terrain is what actually kills you",
      "You want draw distances tuned for jungle rather than farmland",
    ],
    chooseOther: [
      "If you play the base game more than Vietnam, Fellas is the one built for those maps.",
      "If you want one subscription across several games, Arcane covers Hell Let Loose alongside Rust, Apex and CS2.",
    ],
    faqs: [
      {
        q: "How is this different from the standard Hell Let Loose product?",
        a: "It is built around the Vietnam maps and factions — shorter sightlines, jungle visibility, tunnel and ambush awareness — rather than the open European terrain the base product is tuned for.",
      },
      {
        q: "Does it work on the base game maps too?",
        a: "Check the product listing for the current coverage. If you split your time evenly, Fellas is the safer purchase for the base maps.",
      },
      {
        q: "Is ESP more or less useful in jungle?",
        a: "More useful and more conspicuous at once. Vegetation hides everyone, so knowing positions is worth more — and acting on it instantly is harder to pass off as observation.",
      },
      {
        q: "Same anti-cheat?",
        a: "Yes, Easy Anti-Cheat, plus the same community-server admin layer that catches most people on this game.",
      },
    ],
  },
  {
    key: "hell-let-loose/arcane-external",
    intro: [
      "Arcane for Hell Let Loose is the multi-game option: one subscription that also covers Rust, Apex, CS2, ARC Raiders and Palworld. If your group rotates between games, it stops you buying separately each time somebody gets bored.",
      "On Hell Let Loose specifically it covers the ground that matters — player ESP, garrison and node information, restrained aim assistance. What it does not have is the depth of a product built only for this game, and it is worth saying that rather than pretending the feature lists are identical.",
    ],
    featureGroups: [
      {
        heading: "Hell Let Loose features",
        items: [
          "Player ESP with distance across the full map",
          "Garrison and outpost locations",
          "Supply node tracking",
          "Vehicle and armour indicators",
        ],
      },
      {
        heading: "Aim assistance",
        items: [
          "Field-of-view-limited assist with smoothing",
          "Bullet drop compensation",
          "Visibility checks before engaging",
        ],
      },
      {
        heading: "Cross-game",
        items: [
          "One subscription across the provider's supported titles",
          "Per-game configuration profiles",
          "A single loader for every covered game",
        ],
      },
    ],
    safety: [
      "Easy Anti-Cheat, plus the community server admins who catch most people on this game. The guidance is the same as for any Hell Let Loose product: delay acting on what you know, call it to your squad, and do not find every garrison.",
      "One consideration specific to multi-game subscriptions: a provider-wide detection takes every covered game offline at once. Breadth cuts both ways.",
      "External, so nothing is injected into the game process.",
    ],
    requirements: [
      "Windows 10 or 11, 64-bit",
      "Secure Boot disabled",
      "Steam copy of Hell Let Loose",
      "Administrator rights for the loader",
    ],
    chooseWhen: [
      "You play several of the covered games and want one purchase",
      "Hell Let Loose is part of your rotation rather than the only thing you play",
      "A solid feature set is enough and you do not need the deepest one",
    ],
    chooseOther: [
      "If Hell Let Loose is what you play, Fellas goes deeper on the garrison and logistics layer that decides matches.",
      "If you play the Vietnam maps, Vietnam Fellas is built for them.",
    ],
    faqs: [
      {
        q: "Which games does one Arcane subscription cover?",
        a: "Hell Let Loose, Rust, Apex, CS2, ARC Raiders and Palworld among others. The set changes over time, so check the current listing before buying specifically for one title.",
      },
      {
        q: "Is it as good as the dedicated Hell Let Loose product?",
        a: "It is competent and covers the important ground. A product built only for this game will generally go deeper on garrison and logistics tooling, which is the honest trade for the breadth.",
      },
      {
        q: "If Hell Let Loose goes down, do the other games still work?",
        a: "Usually yes, since builds are per game. A provider-wide detection is the case where everything pauses together.",
      },
      {
        q: "Can I use different settings per game?",
        a: "Yes, configuration profiles are per game.",
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
  const game = productGameSlug(product);
  // Try the canonical leaf first, then the un-stripped slug. findProductByRoute
  // already tolerates both forms, so a page can render under either — and an
  // entry keyed to one of them would otherwise silently show nothing on the
  // other, which is exactly how the Crusader entry stayed invisible.
  return (
    productSeoContentByKey(`${game}/${productLeafSlug(product)}`) ??
    productSeoContentByKey(`${game}/${productSlugFromName(product.name, product.id)}`)
  );
}

/** Keys that already have content, for tracking coverage across the catalogue. */
export function productSeoContentKeys(): string[] {
  return CONTENT.map((entry) => entry.key);
}
