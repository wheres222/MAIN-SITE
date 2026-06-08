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
  /**
   * Body sections, each becomes an <h2>.
   * `body` supports paragraph breaks via `\n\n` — the renderer splits and
   * emits separate <p> tags so long sections read as multiple paragraphs.
   * Optional `bullets` block renders a highlighted feature list under the body.
   */
  sections: Array<{
    heading: string;
    body: string;
    bullets?: { heading?: string; items: string[] };
  }>;
  /** FAQ items — used for FAQPage schema + visible accordion */
  faqs: GameSeoFaq[];
  /** Last tested label, e.g. "Patch 1.42 · May 2026". Updated periodically. */
  lastTested: string;
  /** Optional banner image path for the side-by-side "Accessible & Reliable" section. */
  heroImage?: string;
  /** Optional MP4 path for the side-by-side "Precision Perfected" aimbot section. */
  videoSrc?: string;
  /** Optional poster image shown before the video lazy-loads. WebP/AVIF preferred. */
  videoPoster?: string;
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
    title: "Rust Cheats — Undetected ESP, Aimbot & Wallhack 2026",
    metaDescription:
      "Buy undetected Rust cheats with instant delivery. Rust hacks with ESP/wallhack, aimbot & no-recoil — updated every force wipe, tested against EAC.",
    h1: "Rust Cheats — Undetected ESP, Aimbot & Wallhacks",
    lead:
      "Buy undetected Rust cheats with instant delivery. Every Rust hack includes full player and item ESP (wallhack), a humanised aimbot with bullet-drop prediction, and no-recoil — updated within hours of every force wipe and tested against the current EAC build.",
    sections: [
      {
        heading: "Does the Rust cheat have an aimbot?",
        body:
          "Yes. The Rust aimbot includes a configurable FOV, adjustable smoothing for a natural lock-on, hitbox selection (head/chest), and bullet-drop + travel-time prediction so you land shots on moving targets at range. No-recoil and no-sway modules read each weapon's pattern so the AK, bolt, and MP5 stay on target in full-auto. A toggleable silent-aim mode is available for closer-range wipe-day fights.",
        bullets: {
          heading: "Rust aimbot features",
          items: [
            "Configurable FOV + per-shot smoothing",
            "Head / chest hitbox selection",
            "Bullet-drop & travel-time prediction",
            "Full no-recoil + no-sway",
            "Toggleable silent aim",
            "Hotkey bindable aim key",
          ],
        },
      },
      {
        heading: "Rust ESP & wallhack — players, loot and traps",
        body:
          "The Rust ESP (wallhack) shows every player through walls with distance, health, held weapon, and skeleton lines, plus sleeper highlights for raid scouting. Item ESP colour-codes barrels and crates by loot tier, and deployable ESP reveals auto-turrets, traps, and tool cupboards before you push a base.",
        bullets: {
          heading: "What the Rust wallhack shows",
          items: [
            "Player ESP: box, health, weapon, distance",
            "Sleeper & AFK highlights",
            "Item/loot ESP by rarity",
            "Crate, barrel & monument loot",
            "Turret, trap & cupboard ESP",
            "Animal & scientist ESP",
          ],
        },
      },
      {
        heading: "Are Rust cheats undetected in 2026?",
        body:
          "Every Rust cheat here is tested against the current EasyAntiCheat (EAC) build before release and re-checked after each force wipe.",
      },
      {
        heading: "Best undetected Rust cheats — why buy from Cheat Paradise",
        body:
          "Instant delivery, free updates for the life of your subscription, automatic force-wipe coverage, and 24/7 Discord support. Pay by card or crypto and your license lands in your dashboard the moment payment confirms.",
        bullets: {
          heading: "Every Rust purchase includes",
          items: [
            "Instant automated delivery",
            "Free updates + force-wipe coverage",
            "Stream-proof overlay",
            "24/7 Discord support",
          ],
        },
      },
    ],
    faqs: [
      {
        q: "Are Rust cheats safe to use?",
        a: "Yes, when you run an undetected build. Every Rust cheat here is tested against the live EAC build before release and re-validated after each force wipe.",
      },
      {
        q: "Will I get banned for using Rust cheats?",
        a: "Risk is minimised by legit play and humanised aimbot settings — conservative FOV, smoothing, and not blatantly cheating in front of others. As long as you run the current undetected build and play sensibly, bans are rare.",
      },
      {
        q: "Are there free Rust cheats?",
        a: "Free Rust cheats are almost always detected and get your account permanently EAC-banned. Paid cheats fund the continuous bypass work that keeps the loader undetected — far cheaper than replacing a banned account.",
      },
      {
        q: "Do Rust cheats work after force wipe?",
        a: "Yes. We ship a matched update within hours of every force wipe and major Facepunch patch. Subscriptions roll over automatically — your license picks up the new build on next launch.",
      },
      {
        q: "How fast is delivery?",
        a: "Instant. Your license is delivered automatically to your account dashboard and email the moment your payment confirms — crypto typically clears in 1–5 minutes.",
      },
      {
        q: "Do Rust cheats work on Steam Deck or console?",
        a: "No. Rust cheats are PC-only and require native Windows 10 or 11. Steam Deck/Proton and consoles are not supported.",
      },
    ],
    lastTested: "Force Wipe · May 2026",
    heroImage: "/banners/rust.webp",
    videoSrc: "/footage/rust.mp4",
    videoPoster: "/footage/rust-poster.webp",
  },
  {
    slug: "arc-raiders",
    displayName: "ARC Raiders",
    title: "ARC Raiders Cheats — Undetected ESP & Aimbot 2026",
    metaDescription:
      "Buy undetected ARC Raiders cheats with instant delivery. Full extraction ESP, item ESP, aimbot, and silent aim — verified against the latest Embark patch.",
    h1: "ARC Raiders Cheats: Undetected ESP, Aimbot & Extraction Helper",
    lead:
      "Buy undetected ARC Raiders cheats with instant delivery. Every ARC Raiders hack includes player and ARC-machine ESP, full loot and extraction-point ESP, and a configurable aimbot with silent aim — tested against the latest Embark patch.",
    sections: [
      {
        heading: "Does the ARC Raiders cheat have an aimbot?",
        body:
          "Yes. The ARC Raiders aimbot offers configurable FOV, smoothing, and hitbox selection, plus a silent-aim mode that corrects your shot to the target without visibly moving your crosshair. It works identically in solo, duo, and trio queues, with teammate filtering so you never lock onto your own squad.",
        bullets: {
          heading: "ARC Raiders aimbot features",
          items: [
            "Configurable FOV + smoothing",
            "Hitbox selection",
            "Silent aim (no crosshair snap)",
            "Target prediction",
            "Squad-safe teammate filter",
            "Hotkey bindable",
          ],
        },
      },
      {
        heading: "ARC Raiders ESP & wallhack — loot and extraction",
        body:
          "Full ESP shows rival raiders, ARC machines, loot, and extraction points through walls. The loot filter is configurable by rarity so you can hide common drops and highlight only purple/gold-tier items, ARC tech, and rare schematics — so you extract with the best loot every raid.",
        bullets: {
          heading: "What the ARC Raiders wallhack shows",
          items: [
            "Player (raider) ESP with distance & health",
            "ARC machine ESP",
            "Loot ESP filtered by rarity",
            "Extraction-point markers",
            "Rare tech & schematic highlights",
          ],
        },
      },
      {
        heading: "Are ARC Raiders cheats undetected?",
        body:
          "ARC Raiders relies primarily on Embark's server-side detection. Every cheat here is tested against the current build before release and monitored daily — we pause sales on any loader that shows a detection signal rather than keep selling a flagged build.",
      },
      {
        heading: "Best ARC Raiders cheats — why buy from Cheat Paradise",
        body:
          "Instant delivery, free updates with patch coverage (we retest within hours of each Embark patch), stream-proof overlay, and 24/7 Discord support.",
        bullets: {
          heading: "Every ARC Raiders purchase includes",
          items: [
            "Instant automated delivery",
            "Free updates + patch coverage",
            "Stream-proof overlay",
            "24/7 Discord support",
          ],
        },
      },
    ],
    faqs: [
      {
        q: "Are ARC Raiders cheats safe to use?",
        a: "Yes, when running an undetected build. ARC Raiders uses server-side detection, so humanised aimbot settings plus ESP are the safest setup. Every build is monitored daily.",
      },
      {
        q: "Will I get banned for using ARC Raiders cheats?",
        a: "Risk is minimised by legit play and humanised settings. As long as you run the current undetected build and don't cheat blatantly in front of other raiders, bans are rare.",
      },
      {
        q: "Are there free ARC Raiders cheats?",
        a: "Free ARC Raiders cheats are typically detected quickly and get accounts banned. Paid cheats fund ongoing bypass work and daily monitoring that keep the loader undetected.",
      },
      {
        q: "How does silent aim work in ARC Raiders?",
        a: "Silent aim corrects your bullet to the target's hitbox at the moment of fire without moving your crosshair, so your aim looks natural to spectators and replays — no snap or pull.",
      },
      {
        q: "How fast is delivery?",
        a: "Instant. Your license is delivered automatically to your dashboard and email the moment payment confirms.",
      },
      {
        q: "Do ARC Raiders cheats work on Steam Deck or console?",
        a: "No. ARC Raiders cheats require native Windows 10 or 11. Steam Deck/Proton and consoles are not supported.",
      },
    ],
    lastTested: "Patch 1.6 · May 2026",
    heroImage: "/banners/arc-raiders.webp",
    videoSrc: "/footage/arc.mp4",
    videoPoster: "/footage/arc-poster.webp",
  },
  {
    slug: "rainbow-six-siege",
    displayName: "Rainbow Six Siege",
    title: "Rainbow Six Siege Cheats — Undetected R6 Hacks 2026",
    metaDescription:
      "Buy undetected Rainbow Six Siege cheats with instant delivery. R6 aimbot, operator ESP, drone radar, and BattlEye bypass — verified against the latest season.",
    h1: "Rainbow Six Siege Cheats: Undetected Aimbot & Operator ESP",
    lead:
      "Buy undetected Rainbow Six Siege cheats with instant delivery. Every R6 hack includes a smooth aimbot with hitbox prediction, operator and gadget ESP, and drone radar — tested against the current season's BattlEye build.",
    sections: [
      {
        heading: "Does the R6 cheat have an aimbot?",
        body:
          "Yes. The Rainbow Six Siege aimbot includes configurable FOV, smoothing, hitbox priority (head/neck/chest), line-of-sight vischeck, and prediction for moving targets. Settings are tuned to produce humanised aim that holds up in Ranked and Premier without obvious snapping.",
        bullets: {
          heading: "R6 aimbot features",
          items: [
            "Configurable FOV + smoothing",
            "Head / neck / chest priority",
            "Line-of-sight vischeck",
            "Moving-target prediction",
            "Aim-key bindings",
            "Humanised aim curves",
          ],
        },
      },
      {
        heading: "R6 ESP & wallhack — operators, gadgets and drones",
        body:
          "Operator ESP shows enemies through walls with their gadget loadout (Mira, Kapkan, Lesion, Maestro), so you know what you're walking into. Drone ESP reveals enemy and friendly drones to clear before a push, and defuser ESP marks the bomb carrier in real time.",
        bullets: {
          heading: "What the R6 wallhack shows",
          items: [
            "Operator ESP through walls",
            "Gadget / loadout indicators",
            "Enemy & friendly drone ESP",
            "Defuser / objective ESP",
            "Distance & health",
          ],
        },
      },
      {
        heading: "Are R6 cheats undetected by BattlEye?",
        body:
          "Every R6 cheat here is tested against the current season's BattlEye build before release and monitored for new scan waves.",
      },
      {
        heading: "Best R6 Siege cheats — why buy from Cheat Paradise",
        body:
          "Instant delivery, free updates across mid-season patches and season launches, stream-proof overlay, and 24/7 Discord support. We recommend a dedicated Ubisoft account and humanised settings in Premier for the lowest risk.",
        bullets: {
          heading: "Every R6 purchase includes",
          items: [
            "Instant automated delivery",
            "Free updates + season coverage",
            "Stream-proof overlay",
            "24/7 Discord support",
          ],
        },
      },
    ],
    faqs: [
      {
        q: "Are R6 Siege cheats safe to use?",
        a: "Yes, when running an undetected build. Each cheat is tested against the current BattlEye build and monitored for new scan waves.",
      },
      {
        q: "Will I get banned for using R6 cheats?",
        a: "Risk is minimised by legit play and humanised settings. As long as you run the current undetected build and play sensibly in Ranked and Premier, bans are rare.",
      },
      {
        q: "Are there free R6 cheats?",
        a: "Free R6 cheats are quickly detected by BattlEye and lead to hardware bans. Paid cheats fund the ongoing bypass work that keeps the loader undetected.",
      },
      {
        q: "Do R6 cheats work in Ranked and Premier?",
        a: "Yes. Every feature works across Unranked, Standard, Ranked, and Premier. We recommend humanised aimbot settings in Premier to stay under behavioural detection.",
      },
      {
        q: "How fast is delivery?",
        a: "Instant. Your license is delivered automatically to your dashboard and email the moment payment confirms.",
      },
      {
        q: "Do R6 cheats work on console?",
        a: "No. R6 cheats are PC-only and require native Windows 10 or 11. Xbox and PlayStation are not supported.",
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
      "Buy undetected Fortnite cheats with instant delivery. Every Fortnite hack includes a humanised aimbot with prediction, full enemy and chest/loot ESP, and no-recoil and no-spread — tested against EasyAntiCheat for the latest chapter.",
    sections: [
      {
        heading: "Does the Fortnite cheat have an aimbot?",
        body:
          "Yes. The Fortnite aimbot includes configurable FOV, hitbox priority (head/chest/closest), smoothing for natural movement, line-of-sight vischeck, prediction for moving targets, and a silent-aim mode. No-recoil and no-spread keep your shots on target, and humanised settings keep it subtle on Ranked accounts.",
        bullets: {
          heading: "Fortnite aimbot features",
          items: [
            "Configurable FOV + smoothing",
            "Head / chest / closest priority",
            "Moving-target prediction",
            "Silent aim",
            "No-recoil + no-spread",
            "Line-of-sight vischeck",
          ],
        },
      },
      {
        heading: "Fortnite ESP & wallhack — players, chests and loot",
        body:
          "Player ESP shows enemies through walls with health, shield, distance, and held weapon. Loot ESP reveals chests, supply drops, ammo, and weapons, with rarity filtering so you can highlight only gold/mythic weapons, medallions, and rare consumables.",
        bullets: {
          heading: "What the Fortnite wallhack shows",
          items: [
            "Player ESP: health, shield, distance",
            "Held-weapon indicator",
            "Chest & supply-drop ESP",
            "Loot ESP by rarity",
            "Medallion & mythic highlights",
          ],
        },
      },
      {
        heading: "Are Fortnite cheats undetected against EAC?",
        body:
          "Every Fortnite cheat here is tested against the current EasyAntiCheat build before release and re-tested after each chapter update.",
      },
      {
        heading: "Best Fortnite cheats — why buy from Cheat Paradise",
        body:
          "Instant delivery, free updates with chapter coverage, stream-proof overlay, and 24/7 Discord support. Works across all Epic regions (NA, EU, Asia, OCE, Brazil, ME). Pay by card or crypto and get your license instantly.",
        bullets: {
          heading: "Every Fortnite purchase includes",
          items: [
            "Instant automated delivery",
            "Free updates + chapter coverage",
            "Stream-proof overlay",
            "24/7 Discord support",
          ],
        },
      },
    ],
    faqs: [
      {
        q: "Are Fortnite cheats safe to use?",
        a: "Yes, when running an undetected build. Each cheat is tested against the current EAC build and uses humanised aimbot settings to stay subtle.",
      },
      {
        q: "Will I get banned for using Fortnite cheats?",
        a: "Risk is minimised by legit play and humanised settings. As long as you run the current undetected build and play sensibly, bans are rare.",
      },
      {
        q: "Are there free Fortnite cheats?",
        a: "Free Fortnite cheats are detected fast and get accounts EAC-banned. Paid cheats fund the ongoing bypass work that keeps the loader undetected.",
      },
      {
        q: "Do Fortnite cheats work in Ranked and Zero Build?",
        a: "Yes. Features work across Solo, Duos, Squads, Reload, Zero Build, and Ranked. We recommend humanised settings and lower FOV in Ranked.",
      },
      {
        q: "How fast is delivery?",
        a: "Instant. Your license is delivered automatically to your dashboard and email the moment payment confirms.",
      },
      {
        q: "Do Fortnite cheats work on Xbox or PlayStation?",
        a: "No. Fortnite cheats are PC-only and require native Windows 10 or 11. Consoles are not supported.",
      },
    ],
    lastTested: "Chapter 7 Season 2 · May 2026",
    heroImage: "/banners/fortnite.webp",
    videoSrc: "/footage/fortnite.mp4",
    videoPoster: "/footage/fortnite-poster.webp",
  },
];

export function gameSeoContentFor(slug: string): GameSeoContent | undefined {
  const canonical = canonicalGameSlug(slug);
  return GAME_SEO_CONTENT.find((entry) => entry.slug === canonical);
}

export function allGameSeoSlugs(): string[] {
  return GAME_SEO_CONTENT.map((entry) => entry.slug);
}
