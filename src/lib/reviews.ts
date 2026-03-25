import type { SellAuthProduct } from "@/types/sellauth";

export interface StoreReview {
  id: string;
  rating: number;
  date: string;
  message: string;
  productId: number;
  productName: string;
  productImage: string;
}

const GAME_REVIEWS: Record<string, string[]> = {
  rust: [
    "been running this for raids and roaming, zero issues. got the 30 day and it's been solid the whole time",
    "really clean esp, makes finding bases and players so much easier. no bans after weeks of use",
    "bought the 7 day to test it out first and ended up grabbing the 30 day right after. works perfectly on officials",
    "smooth aimbot with natural-looking settings, doesn't snap like other providers. teammates didn't even notice",
    "used this all wipe, no detection. best rust product i've tried by far",
    "setup took like 2 minutes. loader is simple and the menu is clean",
  ],
  valorant: [
    "aimbot feels super natural with the smoothing options, my hs% went up without looking sus",
    "esp is great for holding angles and knowing when to rotate. been using the 7 day and already renewed",
    "got the 30 day prime, definitely worth it. triggerbot alone is worth the price",
    "clean visuals, no fps drops at all. runs smooth even on my mid-range setup",
    "used other val products before, this one is the most stable by far. no crashes or freezes",
    "easy inject process, was in a game within a minute of buying. support helped me with initial config",
  ],
  fortnite: [
    "softaim is insane for build fights, hits every shot without looking obvious. been using the 7 day",
    "the esp makes it easy to spot enemies through builds. game feels completely different with it",
    "grabbed the 30 day elite and it's been undetected the whole time. highly recommend",
    "super smooth, no stutters. works great even in stacked endgames",
    "got this for zero build mode and it works perfectly. aimbot + esp combo is great",
    "first time buying from here, delivery was instant and setup was painless",
  ],
  "call-of-duty": [
    "warzone has never been this easy. esp + aimbot combo is perfect for solos and duos",
    "been using the prime 7 day for multiplayer, no shadow bans. unlock tool is a nice bonus",
    "works on both wz and mp. smooth aimbot with good bone priority settings",
    "grabbed the 24 hour for a session with friends, worked flawlessly the entire time",
    "best cod product i've used this year. clean menu and good preset configs",
    "no detection after 2 weeks of daily ranked play. super reliable",
  ],
  "counter-strike-2": [
    "legit settings make this perfect for mm and faceit. been using the 30 day with no issues",
    "trigger + esp combo is all you need. very subtle and effective",
    "skinchanger is a nice touch. whole product feels polished and well maintained",
    "rcs works great, spray patterns feel natural. wouldn't even know it's assisted",
    "got the elite for the extra features, radar is super useful in clutch rounds",
    "been playing cs for years and this is the cleanest product i've ever used",
  ],
  "rainbow-six-siege": [
    "drone esp is a gamechanger. knowing where everyone is before pushing makes ranked so much easier",
    "aimbot feels natural on controller, headshot rate went up without looking weird",
    "been using the 7 day lite, works great for casual ranked grinding",
    "wall esp is clean, shows operators and health. really useful for call-outs",
    "no bans after a full season of use. this is my go-to for r6",
    "quick delivery and worked first try. menu is easy to navigate",
  ],
  apex: [
    "recoil control is crazy good on the r301 and flatline. beaming people from range now",
    "esp shows health bars and shield info which is super useful for third-partying",
    "got the 30 day and it lasted the whole season with no issues. great value",
    "aimbot prediction is solid, hitting wingman shots i never could before",
    "used the 24 hour to try it out and immediately bought the 7 day. worth every penny",
    "smooth on all legends, no fps drop even in hot zones",
  ],
  roblox: [
    "works great on multiple games within roblox. my kids love it",
    "esp and speed hacks work perfectly. been using the 7 day and it's been fun",
    "grab the lite version first to try it, ended up going elite. tons of features",
    "script executor works on all the popular games. easy to use",
    "no bans across multiple accounts. really stable and reliable",
    "fast delivery and support helped me set it up when i had a question",
  ],
  pubg: [
    "esp makes looting and positioning so much better. found every air drop easily",
    "aimbot works great with snipers especially. the bullet prediction is solid",
    "been using the 30 day, zero issues and no bans on my main account",
    "recoil macro is clean, m416 has zero kick now. feels like a different game",
    "got the elite and the radar hack is worth it alone. full map awareness",
    "easy setup, was playing within 5 minutes of purchase",
  ],
  "hwid-spoofers": [
    "got hardware banned and this fixed it instantly. back online in under 10 minutes",
    "spoofer works perfectly, changed all my serials and ids. new account running clean",
    "used this after a ban wave and it worked first try. 30 day gives peace of mind",
    "tried two other spoofers before this one, this is the only one that actually worked",
    "clean spoof, doesn't trigger any kernel-level detection. been spoofed for weeks now",
    "super easy one-click process. even if you're not tech-savvy you can use this",
  ],
  "arc-raiders": [
    "works great even in early access. esp is super helpful for finding loot and enemies",
    "smooth aimbot, feels natural. been using the 7 day and enjoying the game more",
    "grabbed the lite to try it during the beta and it's been flawless",
    "good product for a new game, already well optimized. no crashes",
    "support is responsive and updates come fast after game patches",
    "fun to use, makes the game way more enjoyable. will rebuy when my sub ends",
  ],
  fivem: [
    "works on all the popular servers i play on. money and vehicle mods are great",
    "menu is clean and easy to use. got the 7 day and it's been super useful",
    "no kicks or bans on any server. protection is solid",
    "teleport and godmode work perfectly. best fivem menu i've tried",
    "grabbed the elite for the extra server-side features. totally worth it",
    "fast delivery, was modding within minutes of purchase",
  ],
  lol: [
    "scripting feels smooth, combo execution is way more consistent now",
    "dodgescript alone makes this worth it. haven't been hit by a skillshot in ages",
    "got the 7 day and climbed 2 ranks already. orb walking is perfect",
    "works on the latest patch, updates come fast after every league update",
    "auto smite is clutch, never lose an objective anymore. jungle has never been easier",
    "clean overlay, doesn't interfere with gameplay visuals at all",
  ],
  "rocket-league": [
    "ball prediction is insane, hitting aerials i never could before. worth every penny",
    "the auto-rotate feature makes positioning so much better in 3s",
    "got the 7 day lite to test and immediately upgraded to the 30 day. game-changing",
    "boost management and demo tracking esp is really useful for comp matches",
    "smooth, no input delay at all. hits feel completely natural",
    "been using for two weeks, ranked up from diamond to champ. no bans",
  ],
};

const GENERIC_REVIEWS = [
  "works perfectly, no issues at all. fast delivery and exactly as described",
  "been using for a couple weeks now, still going strong. will definitely rebuy",
  "great product, support answered my question within minutes",
  "setup was easy, instructions were clear. running smooth",
  "solid product, definitely worth the price. have tried others and this is the best",
  "reordered for the second time, never had a single issue",
  "delivery was instant, product works great. very clean and easy to use",
  "quick and painless setup, good stuff. recommended to a friend already",
  "had a small issue at first but support fixed it in under 5 minutes",
  "would recommend to anyone. quality is top tier for the price",
];

// seeded pseudo-random so output is stable across renders
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

function categoryKeyFor(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("rust")) return "rust";
  if (n.includes("valorant") || n.includes("val")) return "valorant";
  if (n.includes("fortnite")) return "fortnite";
  if (n.includes("call of duty") || n.includes("cod")) return "call-of-duty";
  if (n.includes("counter") || n.includes("cs2")) return "counter-strike-2";
  if (n.includes("rainbow") || n.includes("r6")) return "rainbow-six-siege";
  if (n.includes("apex")) return "apex";
  if (n.includes("roblox")) return "roblox";
  if (n.includes("pubg")) return "pubg";
  if (n.includes("hwid") || n.includes("spoofer")) return "hwid-spoofers";
  if (n.includes("arc")) return "arc-raiders";
  if (n.includes("fivem") || n.includes("5m")) return "fivem";
  if (n.includes("league") || n.includes("lol")) return "lol";
  if (n.includes("rocket")) return "rocket-league";
  return null;
}

function fallbackImageFor(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("rust")) return "/pd/rust.png";
  if (normalized.includes("valorant") || normalized.includes("val")) return "/pd/valorant.png";
  if (normalized.includes("rainbow") || normalized.includes("r6")) return "/pd/rainbow-six-siege.png";
  if (normalized.includes("apex")) return "/pd/apex.png";
  if (normalized.includes("call of duty") || normalized.includes("cod")) return "/pd/call-of-duty.png";
  if (normalized.includes("fortnite")) return "/pd/fortnite.png";
  if (normalized.includes("counter") || normalized.includes("cs2")) return "/pd/counter-strike-2.png";
  if (normalized.includes("roblox")) return "/pd/roblox.png";
  if (normalized.includes("pubg")) return "/pd/pubg.png";
  if (normalized.includes("hwid") || normalized.includes("spoofer")) return "/pd/hwid-spoofers.png";
  if (normalized.includes("arc")) return "/pd/arc-raiders.png";
  if (normalized.includes("fivem")) return "/pd/fivem.png";
  if (normalized.includes("league") || normalized.includes("lol")) return "/pd/lol.png";
  if (normalized.includes("rocket")) return "/pd/rocket-league.png";
  return "/pd/fortnite.png";
}

export function createMockReviewsFromProducts(
  products: SellAuthProduct[],
  limit = 36
): StoreReview[] {
  const now = new Date();
  const sourceProducts =
    products.length > 0
      ? products
      : [
          {
            id: 1,
            name: "Rust Prime",
            image: "/pd/rust.png",
          },
        ];

  let dayOffset = 0;

  return Array.from({ length: limit }, (_, index) => {
    const product = sourceProducts[index % sourceProducts.length];
    const catKey = categoryKeyFor(product.name);

    // spread reviews across ~3 months with realistic clustering
    if (index === 0) {
      dayOffset = 0;
    } else {
      const r = seededRand(index * 7);
      if (r < 0.3) {
        // same day (cluster)
        dayOffset += 0;
      } else if (r < 0.6) {
        // 1-3 days gap
        dayOffset += Math.floor(seededRand(index * 13) * 3) + 1;
      } else if (r < 0.85) {
        // 3-7 days gap
        dayOffset += Math.floor(seededRand(index * 19) * 5) + 3;
      } else {
        // 7-14 days gap
        dayOffset += Math.floor(seededRand(index * 23) * 8) + 7;
      }
    }

    const date = new Date(now);
    date.setDate(now.getDate() - dayOffset);
    // add random hours so times vary
    date.setHours(Math.floor(seededRand(index * 31) * 24));
    date.setMinutes(Math.floor(seededRand(index * 37) * 60));

    // pick a product-specific review if available, otherwise generic
    let message: string;
    if (catKey && GAME_REVIEWS[catKey]) {
      const pool = GAME_REVIEWS[catKey];
      message = pool[Math.floor(seededRand(index * 41) * pool.length)];
    } else {
      message = GENERIC_REVIEWS[Math.floor(seededRand(index * 41) * GENERIC_REVIEWS.length)];
    }

    // ~80% five stars, ~20% four stars
    const rating = seededRand(index * 17) > 0.8 ? 4 : 5;

    return {
      id: `review-${product.id}-${index + 1}`,
      rating,
      date: date.toISOString(),
      message,
      productId: product.id,
      productName: product.name,
      productImage: product.image || fallbackImageFor(product.name),
    };
  });
}
