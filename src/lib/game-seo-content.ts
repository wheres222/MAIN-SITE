import { canonicalGameSlug } from "@/lib/game-slug";

export interface GameSeoFaq {
  q: string;
  a: string;
}

export interface GameSeoContent {
  /** Canonical slug used in /categories/[slug] */
  slug: string;
  /** Display name for headings */
  displayName: string;
  /** Page <title> */
  title: string;
  /** Meta description — 140-160 chars */
  metaDescription: string;
  /** H1 on the page — should contain primary keyword */
  h1: string;
  /** 40-60 word answer-first lead paragraph. Becomes the AI Overview / SGE quote. */
  lead: string;
  /** Body sections, each becomes an <h2> */
  sections: Array<{ heading: string; body: string }>;
  /** FAQ items — used for FAQPage schema + visible accordion */
  faqs: GameSeoFaq[];
  /** Last tested label, e.g. "Patch 1.42 · May 2026". Updated periodically. */
  lastTested: string;
  /** Optional banner image path for the side-by-side "Accessible & Reliable" section. */
  heroImage?: string;
  /** Optional MP4 path for the side-by-side "Precision Perfected" aimbot section. */
  videoSrc?: string;
}

/**
 * Per-game SEO content. Each entry is a long-tail landing page.
 *
 * Writing principles applied:
 *  - Lead paragraph is the verbatim answer to the primary intent
 *    ("are X cheats undetected") — Google AI Overviews quote this directly.
 *  - Each H2 targets a real "People Also Ask" question.
 *  - FAQs cover commercial + safety + technical queries.
 *  - "Last tested" supplies the Experience signal from the March 2026 core update.
 */
export const GAME_SEO_CONTENT: GameSeoContent[] = [
  {
    slug: "rust",
    displayName: "Rust",
    title: "Rust Cheats — Undetected External & Internal Hacks 2026",
    metaDescription:
      "Buy undetected Rust cheats with instant delivery. External and internal hacks featuring aimbot, ESP, recoil control, and HWID spoofer support. Verified May 2026.",
    h1: "Rust Cheats: Undetected External & Internal Hacks",
    lead:
      "Cheat Paradise's Rust cheats are external, EAC-safe loaders updated within hours of every Facepunch patch. Each build includes aimbot with prediction, full player and item ESP, recoil control, and bag/cupboard ESP — delivered instantly after purchase and protected by an active HWID spoofer.",
    sections: [
      {
        heading: "Are Rust cheats safe to use in 2026?",
        body:
          "Rust is protected by EasyAntiCheat (EAC) and Facepunch's server-side detections. Every cheat on this page is tested against the current EAC build before release and re-tested after Rust force-wipe Thursdays. We never publish a loader that triggers EAC live detections, and every account ban while running an undetected version is replaced under our policy.",
      },
      {
        heading: "External vs internal — which Rust cheat should I buy?",
        body:
          "External cheats run as a separate process and read game memory without injecting code, making them statistically the safest option against kernel anti-cheats like EAC. Internal cheats inject directly into the game for better visuals (full chams, advanced ESP) but carry slightly higher detection risk. For first-time buyers we recommend external; for streamers and ranked grinders, the latest internal builds are stream-proof and produce no overlay artifacts.",
      },
      {
        heading: "What's included with every Rust cheat purchase?",
        body:
          "Every loader includes the cheat binary, a current-build HWID spoofer, written setup guide, Discord support access, and free version updates for the duration of your license. Active subscriptions roll over through every Rust force-wipe and major Facepunch patch automatically.",
      },
      {
        heading: "How fast is delivery?",
        body:
          "Instant. Once your crypto or card payment is confirmed, your license key appears in your Cheat Paradise account dashboard and is emailed to you. Median time from payment to first launch is under 2 minutes.",
      },
    ],
    faqs: [
      {
        q: "Will I get EAC banned using these Rust cheats?",
        a: "Not while running an undetected build. EAC bans the account, not the hardware, but our included HWID spoofer protects against the rare cases of hardware flagging. Every undetected ban is replaced free under our protection policy.",
      },
      {
        q: "Do Rust cheats work after force wipe?",
        a: "Yes. Every cheat on this page is tested against the new build within the first 2 hours of a force wipe Thursday. Subscriptions roll over automatically with no action required.",
      },
      {
        q: "Can I use a Rust cheat on a streamer account?",
        a: "Yes. Our internal Rust cheats are stream-proof — overlays, menus, and ESP do not appear in OBS, Shadowplay, Discord screen-share, or browser-based capture.",
      },
      {
        q: "Which Rust cheats work on Windows 11?",
        a: "All current builds support Windows 10 (1909+) and Windows 11 23H2 / 24H2. Each product page lists the exact supported builds under its compatibility tab.",
      },
      {
        q: "What's the difference between paid Rust cheats and free ones?",
        a: "Free Rust cheats are detected within hours of release and result in permanent EAC bans. Paid cheats fund continuous EAC bypass research, daily detection monitoring, and the support staff who keep the loader live across patches.",
      },
    ],
    lastTested: "Force Wipe · May 2026",
    heroImage: "/banners/rust.webp",
    videoSrc: "/footage/rust.mp4",
  },
  {
    slug: "arc-raiders",
    displayName: "ARC Raiders",
    title: "ARC Raiders Cheats — Undetected ESP & Aimbot 2026",
    metaDescription:
      "Buy undetected ARC Raiders cheats with instant delivery. Full extraction ESP, item ESP, aimbot, and silent aim — verified against the latest Embark patch.",
    h1: "ARC Raiders Cheats: Undetected ESP, Aimbot & Extraction Helper",
    lead:
      "Cheat Paradise's ARC Raiders cheats are external loaders built specifically for Embark Studios' extraction shooter. Each build includes player and ARC machine ESP, full loot and extraction-point ESP, configurable aimbot with silent aim, and a current-build HWID spoofer — all delivered instantly after purchase.",
    sections: [
      {
        heading: "Are ARC Raiders cheats undetected?",
        body:
          "ARC Raiders launched without a kernel anti-cheat, relying primarily on Embark's server-side detection. Every cheat on this page is tested against the current build before each release and monitored daily for new detection signatures. We pause sales on any product that shows a detection signal — we don't keep selling a flagged loader.",
      },
      {
        heading: "Does the ARC Raiders cheat have item ESP?",
        body:
          "Yes — full loot, extraction point, ARC robot, and PvP player ESP are included in every paid build. The ESP filter is configurable by rarity tier so you can hide low-value common loot and highlight only purple/gold tier items, ARC technology drops, and rare schematics.",
      },
      {
        heading: "Will my ARC Raiders cheat survive Embark patches?",
        body:
          "Embark Studios pushes balance patches weekly and engine updates roughly monthly. Our team retests every build within 4 hours of a patch dropping and pushes a hot-fix loader if anything breaks. Active subscriptions automatically receive the updated version.",
      },
      {
        heading: "Solo or squad mode — does cheat behaviour change?",
        body:
          "The aimbot, ESP, and silent aim work identically in solo, duo, and trio queues. Squad ESP includes teammate filtering so you don't accidentally target your own squadmates while ARC enemies and rival raiders remain highlighted.",
      },
    ],
    faqs: [
      {
        q: "Is ARC Raiders cheating possible without kernel anti-cheat?",
        a: "Yes, and it's substantially easier than cheating in EAC or BattlEye titles. ARC Raiders' server-side detection still bans for blatant cheating, so configurable humanised aimbot and ESP-only setups are the safest play patterns.",
      },
      {
        q: "Do you ban-shield ARC Raiders accounts?",
        a: "Every undetected ban on an active subscription is replaced free. The included HWID spoofer protects against any rare cases of hardware association.",
      },
      {
        q: "Can I use the ARC Raiders cheat on Steam Deck or Linux?",
        a: "No. ARC Raiders cheats currently require Windows 10 or 11 with the standard PC client. Steam Deck Proton compatibility is on the roadmap but not yet supported.",
      },
      {
        q: "How does the silent aim work in ARC Raiders?",
        a: "Silent aim corrects your bullet trajectory toward the target's hitbox at the moment of fire, without visibly moving your crosshair. To replays, teammates, and spectators, your aim looks completely natural — there is no snap or pull effect.",
      },
      {
        q: "Will I see other players using ARC Raiders cheats?",
        a: "ARC Raiders has an active cheater population, especially in higher-tier extraction zones. Running ESP gives you parity — you'll know when another raider is tracking you through walls before they engage.",
      },
    ],
    lastTested: "Patch 1.6 · May 2026",
    heroImage: "/banners/arc-raiders.webp",
    videoSrc: "/footage/arc.mp4",
  },
  {
    slug: "rainbow-six-siege",
    displayName: "Rainbow Six Siege",
    title: "Rainbow Six Siege Cheats — Undetected R6 Hacks 2026",
    metaDescription:
      "Buy undetected Rainbow Six Siege cheats with instant delivery. R6 aimbot, operator ESP, drone radar, and BattlEye bypass — verified against the latest season.",
    h1: "Rainbow Six Siege Cheats: Undetected Aimbot & Operator ESP",
    lead:
      "Cheat Paradise's Rainbow Six Siege cheats are external loaders engineered specifically for Ubisoft's BattlEye implementation. Every build includes a smooth aimbot with hitbox prediction, full operator and gadget ESP, drone radar, and a BattlEye-aware HWID spoofer — instantly delivered after purchase.",
    sections: [
      {
        heading: "Are R6 Siege cheats undetected by BattlEye?",
        body:
          "BattlEye is one of the most aggressive kernel anti-cheats deployed in any FPS. Our R6 cheats run as external loaders that read game memory without injecting code into the BattlEye-protected process, which is the technique that has consistently survived BattlEye scan waves. Every build is tested against the current season's BattlEye signature before release.",
      },
      {
        heading: "Will I get a permanent BattlEye ban?",
        body:
          "BattlEye bans are MAC and hardware-level, not just account-level — which is why every R6 cheat we sell includes an active HWID spoofer. If your account or hardware is flagged while running an undetected version, you're covered by our replacement policy: a new key plus spoofer setup, no questions asked.",
      },
      {
        heading: "What features does the R6 Siege aimbot include?",
        body:
          "Configurable FOV, smoothing curves, hitbox priority (head / neck / chest), aim key bindings, prediction for moving targets, vischeck (line-of-sight verification), and stand-still-only modes. The aimbot is tuned to produce humanised aim curves that don't trigger Ubisoft's behavioural detection systems.",
      },
      {
        heading: "How does the R6 ESP help in ranked?",
        body:
          "Operator ESP highlights enemy positions through walls, including their gadget loadout (Mira, Kapkan, Lesion, Maestro). Drone ESP shows enemy and friendly drones so you can clear them before pushes. Bomb site ESP marks defuser carriers in real time during defuse rounds.",
      },
    ],
    faqs: [
      {
        q: "Do R6 Siege cheats work in ranked and competitive playlists?",
        a: "Yes. Every feature is enabled across Unranked, Ranked, Premier, and Standard playlists. We recommend humanised settings (smoothing + delay) in Premier to avoid behavioural pattern flags.",
      },
      {
        q: "Is the R6 cheat stream-proof?",
        a: "Yes. Menus, ESP overlays, and aimbot indicators do not appear in OBS, Discord screen-share, Shadowplay, or browser capture. Internal R6 cheats use a DirectX-bypass overlay that doesn't render in any standard capture pipeline.",
      },
      {
        q: "How often does the R6 cheat get updated?",
        a: "Every Tuesday after Ubisoft's mid-season patch, every six weeks for season launches, and within hours if BattlEye pushes an emergency signature update. Active subscriptions get every update free.",
      },
      {
        q: "Can I buy an R6 cheat without a HWID spoofer?",
        a: "We bundle the HWID spoofer with every R6 product specifically because BattlEye performs hardware-level bans. Selling R6 cheats without a spoofer would put customers at preventable risk.",
      },
      {
        q: "Will the R6 cheat work on a new Ubisoft account?",
        a: "Yes, and we actually recommend a dedicated cheat account. Fresh Ubisoft accounts have no rank reputation to protect — if anything ever does happen, you've lost nothing of value.",
      },
    ],
    lastTested: "Operation Y10S2 · May 2026",
    heroImage: "/banners/rainbow-six-siege.webp",
  },
  {
    slug: "fortnite",
    displayName: "Fortnite",
    title: "Fortnite Cheats — Undetected Aimbot & ESP for Chapter 7 2026",
    metaDescription:
      "Buy undetected Fortnite cheats with instant delivery. Aimbot with prediction, full player and chest ESP, no-recoil, and EAC bypass — verified for the latest chapter.",
    h1: "Fortnite Cheats: Undetected Aimbot, ESP & EAC Bypass",
    lead:
      "Cheat Paradise's Fortnite cheats are external loaders engineered around Epic Games' EasyAntiCheat (EAC) implementation. Every build includes a humanised aimbot with prediction, full enemy and chest/loot ESP, no-recoil and no-spread modules, and an active HWID spoofer — delivered instantly after purchase.",
    sections: [
      {
        heading: "Are Fortnite cheats safe against EAC in 2026?",
        body:
          "Fortnite runs both EasyAntiCheat and Epic's BattlEye implementation on competitive playlists, plus its own server-side detection. Our Fortnite cheats are external loaders that read game memory without injecting into the EAC-protected process, which is the technique that has consistently survived Epic's detection waves. Every build is tested against the current chapter before release.",
      },
      {
        heading: "What features does the Fortnite aimbot include?",
        body:
          "Configurable FOV, hitbox priority (head / chest / closest), aim key bindings, smoothing curves for natural aim movement, prediction for moving targets, vischeck (line-of-sight validation), and silent aim modes. The aimbot is tuned to produce humanised aim curves that won't trigger Epic's behavioural pattern detection on competitive accounts.",
      },
      {
        heading: "Does the Fortnite ESP show chests and loot?",
        body:
          "Yes — full chest, supply drop, ammo, and weapon ESP are included in every paid build. Loot tier filtering lets you hide common items and highlight only gold and mythic-tier weapons, medallions, and rare consumables. Player ESP includes health, distance, weapon held, and shield status.",
      },
      {
        heading: "Will my Fortnite cheat work after a chapter update?",
        body:
          "Epic pushes major chapter resets roughly every 3 months and hotfix patches weekly. Our team retests every build within 4 hours of a chapter launch and pushes a hotfix loader if anything breaks. Active subscriptions automatically receive the updated version with no action required from you.",
      },
    ],
    faqs: [
      {
        q: "Can I use Fortnite cheats in ranked and competitive playlists?",
        a: "Yes — features work across Solo, Duos, Squads, Reload, Zero Build, and Ranked playlists. We recommend humanised settings (smoothing + delay) and lower FOV values in Ranked to stay below Epic's behavioural detection thresholds.",
      },
      {
        q: "Is the Fortnite cheat stream-proof?",
        a: "Yes. Menus, ESP overlays, and aimbot indicators do not render in OBS, Discord screen-share, Shadowplay, or browser-based capture. Streamers and content creators have been using our internal Fortnite builds for over a year without overlay leakage.",
      },
      {
        q: "Will Epic ban my Fortnite account for using these cheats?",
        a: "Not while running an undetected build. EAC bans the account and IP — which is why every Fortnite product includes an HWID spoofer to protect against hardware-level association. Every undetected ban is replaced free under our policy.",
      },
      {
        q: "Do Fortnite cheats work on the EU and Asia servers?",
        a: "Yes. Region has no impact on cheat functionality. All Epic-hosted Fortnite servers (NA, EU, Asia, OCE, Brazil, ME) are supported on the same loader.",
      },
      {
        q: "Can I use Fortnite cheats on Xbox or PlayStation?",
        a: "No. Console cheating requires hardware-level interception devices and is fundamentally different from PC cheating. Our Fortnite cheats are PC-only — Windows 10 (1909+) and Windows 11 23H2 / 24H2.",
      },
    ],
    lastTested: "Chapter 7 Season 2 · May 2026",
    heroImage: "/banners/fortnite.webp",
    videoSrc: "/footage/fortnite.mp4",
  },
];

export function gameSeoContentFor(slug: string): GameSeoContent | undefined {
  const canonical = canonicalGameSlug(slug);
  return GAME_SEO_CONTENT.find((entry) => entry.slug === canonical);
}

export function allGameSeoSlugs(): string[] {
  return GAME_SEO_CONTENT.map((entry) => entry.slug);
}
