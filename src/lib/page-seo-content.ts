/**
 * Long-form content for the site's utility pages.
 *
 * Why this file exists
 * ────────────────────
 * Search Console reported eleven URLs as "Crawled - currently not indexed".
 * Every one of them was a page whose value is interactive — a catalogue grid,
 * a status board, a ticket link — and which therefore shipped between 149 and
 * 640 rendered words. That status is not a crawl failure; it is Google saying
 * it fetched the page and decided there was nothing worth keeping. More
 * crawling does not fix it and neither does more sitemap priority. Only having
 * something to index does.
 *
 * So each entry here is written to answer the questions someone actually
 * arrives on that page with, in the site's own voice, using facts that match
 * the rest of the site (Stripe + NOWPayments, hardware-locked keys, Secure
 * Boot, Discord tickets). Padding would not help — thin and padded land in the
 * same bucket.
 *
 * Body strings support `[label](/path)` inline links, rendered as real <Link>
 * elements by page-seo-sections.tsx. Use them: before this, pages like /faq
 * named "the Status page" in plain prose and passed no link to it at all.
 */

export interface PageSeoSection {
  heading: string;
  body: string[];
  bullets?: { heading?: string; items: string[] };
}

export interface PageSeoFaq {
  q: string;
  a: string;
}

export interface PageSeoContent {
  /** Route key, e.g. "products" for /products */
  key: string;
  /** H2 opening the editorial block */
  heading: string;
  lead: string;
  sections: PageSeoSection[];
  faqs: PageSeoFaq[];
  faqHeading?: string;
}

const PAGE_SEO_CONTENT: PageSeoContent[] = [
  // ══════════════════════════════════════════════════════════════════ /products
  {
    key: "products",
    heading: "How to choose a cheat from this catalogue",
    lead:
      "Every product listed here is stocked, versioned and status-tracked by us rather than resold blind. This section explains how the catalogue is organised, what separates the price tiers, and the checks worth doing before you buy — particularly the two that stop most refund requests before they happen.",
    sections: [
      {
        heading: "Start with the game, not the product name",
        body: [
          "Provider names travel across games. The same brand can publish a Rust build and a Fortnite build that share nothing but a logo — different feature sets, different injection method, different detection history. Comparing two products by name alone tells you very little.",
          "The reliable path is to open the [category page for your game](/categories) first. Each one lists only the builds that run on that title, alongside notes on the anti-cheat you will be facing there — EAC on Rust and Fortnite, BattlEye on DayZ, Vanguard on Valorant, Ricochet on Call of Duty. A feature that is routine on one game is often the thing that gets you flagged on another.",
        ],
      },
      {
        heading: "What the duration tiers actually change",
        body: [
          "Most products sell as day, week, month and lifetime keys. The software is identical across tiers — you are buying access time, not a different build. What changes is your exposure to a detection window.",
          "A day key is the sensible way to try an unfamiliar provider. If the build goes down for maintenance during those 24 hours you have lost very little, and you will have learned how quickly that provider actually ships a fix, which is the single most useful thing to know about them. Lifetime keys are worth it only for a provider you have already watched survive a few game updates.",
        ],
        bullets: {
          heading: "Before you buy",
          items: [
            "Check the build is Undetected on the [status page](/status) — not just today, but that it has not been flapping in and out of maintenance.",
            "Confirm your Windows build is supported. Everything here needs Windows 10 or 11, 64-bit.",
            "Check whether the product needs Secure Boot disabled, and whether you are willing to do that on this machine.",
            "If you have ever been hardware-banned on the game, budget for an [HWID spoofer](/categories/hwid-spoofers) as well — the cheat alone will not get you back in.",
          ],
        },
      },
      {
        heading: "Internal, external and DMA builds",
        body: [
          "External builds read game memory from a separate process and never write into it. They are the most survivable option against modern kernel anti-cheat and the reason most of this catalogue is external, but they are limited to visual and assistive features.",
          "Internal builds inject into the game process. They can do considerably more — silent aim, precise recoil handling, full ESP — and they carry proportionally more risk, because the anti-cheat is looking directly at the process they live in.",
          "DMA setups move the read off the machine entirely onto a second PC with a capture card. Nothing runs on the gaming system, which makes them the hardest to detect and the most expensive and involved to set up. If you are new, start external.",
        ],
      },
      {
        heading: "Delivery, keys and hardware locking",
        body: [
          "Payment clears and the key appears on the confirmation page immediately, plus a copy by email. Signed-in customers keep a permanent record under Account → Orders; guests can retrieve an order later from the [order lookup page](/orders) with the order ID and the token emailed at checkout.",
          "Keys are locked to the hardware they first activate on. That is worth understanding before you buy rather than after: reinstalling Windows, swapping a GPU or changing a motherboard will invalidate the lock, and the key will report itself as already in use. Support resets these routinely — open a ticket with the order ID — but it is not instant, so avoid activating on a machine you are about to rebuild.",
        ],
      },
      {
        heading: "Paying by card or by crypto",
        body: [
          "Card payments run through Stripe and complete immediately. Crypto runs through NOWPayments and covers Bitcoin, Ethereum, Solana, Litecoin, USDT and BNB, typically confirming in one to five minutes.",
          "One thing to know about crypto: each coin has its own network minimum, set by the payment processor and not by us, and for Bitcoin in particular that minimum can be higher than a small order total. If a deposit is refused for being too small the checkout will now tell you the exact figure required — either send more, or pick a coin with a lower floor such as Litecoin or USDT.",
          "You can also top up an account balance once and spend it across several orders, which sidesteps per-transaction minimums entirely and is the cheaper route if you buy regularly.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which product should I buy if I have never used a cheat before?",
        a: "An external build on a day or week key, for whichever game you play most. It gives you the lowest risk while you learn how loaders, exclusions and hardware locking behave, and the cost of getting it wrong is small. Read the [setup guide](/guide) end to end before you run anything.",
      },
      {
        q: "Do prices on this page include everything?",
        a: "Yes. The price shown is the price charged, with no separate loader, activation or update fee. If you change display currency the site converts for reference only — the charge itself is always processed in USD.",
      },
      {
        q: "Can I use one key on my desktop and my laptop?",
        a: "No. Keys are hardware-locked to the first machine they activate on, and moving between two machines will repeatedly break the lock. Buy a separate key for the second system.",
      },
      {
        q: "How often does the catalogue change?",
        a: "Continuously. Builds are added, pulled during detection waves and restored after fixes, and this page reflects the live catalogue rather than a periodic export. The [status page](/status) is the faster place to watch for changes to something you already own.",
      },
      {
        q: "What happens if the product I bought is detected the next day?",
        a: "Stop using it immediately and check the [status page](/status) for the current state. Providers push fixes and the status returns to Undetected once verified. Where a build stays down for an unreasonable period, see the [refund policy](/refund-policy) for how that is handled.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════ /categories
  {
    key: "categories",
    heading: "Picking the right game category",
    lead:
      "Cheats are built against a specific anti-cheat, not against a game in the abstract. What is safe on one title is the exact behaviour that gets flagged on another, so the category you start in matters more than the provider you end up with. This is what differs between them.",
    sections: [
      {
        heading: "The anti-cheat decides what is possible",
        body: [
          "Each game in this catalogue is defended by a different system, and those systems differ enormously in how deep they sit and how aggressively they act. That difference sets the ceiling on what any product for that game can safely do.",
        ],
        bullets: {
          heading: "What you are up against, by game",
          items: [
            "[Rust](/categories/rust) and [Fortnite](/categories/fortnite) — Easy Anti-Cheat, kernel level, with heavy server-side statistical review on top.",
            "[DayZ](/categories/dayz) and [ARC Raiders](/categories/arc-raiders) — BattlEye, kernel level, historically quick to ban in waves rather than individually.",
            "[Valorant](/categories/valorant) — Vanguard, which loads at boot and is the most invasive anti-cheat in mainstream play.",
            "[Call of Duty](/categories/call-of-duty) — Ricochet, kernel level, paired with mitigations that degrade your game rather than ban you outright.",
            "[Counter-Strike 2](/categories/counter-strike-2) — VAC plus Overwatch review, with FACEIT and ESEA running far stricter clients on top.",
            "[Escape from Tarkov](/categories/escape-from-tarkov) — BattlEye alongside unusually detailed server-side loot and movement analysis.",
          ],
        },
      },
      {
        heading: "Why bans usually are not the anti-cheat catching the software",
        body: [
          "On most of these titles, the software being detected is the less common route to a ban. The more common one is a report followed by a human or statistical review of how you played — and that review does not care which product you bought.",
          "This is why the same build produces wildly different outcomes for two customers. Conservative settings on a well-regarded provider can run for months. The identical build used at maximum aggression in a full lobby draws reports within a session or two, and no amount of undetectability survives that.",
        ],
      },
      {
        heading: "Reading a category page",
        body: [
          "Each category page opens with the products currently stocked for that game, then a written guide covering how enforcement works there, which feature sets are realistic, and a last-tested date so you can see how current the guidance is.",
          "If a game shows no products, the guide is still worth reading — it usually means a build has been pulled during a detection wave rather than that we never carried one. Discord support can tell you what is expected back and roughly when.",
        ],
      },
      {
        heading: "Spoofers are a separate purchase",
        body: [
          "A hardware ban is not undone by buying a cheat for the same game. The ban is attached to identifiers taken from your machine, and until those change, a new account will be actioned as fast as you create it.",
          "[HWID spoofers](/categories/hwid-spoofers) are listed as their own category for that reason. Order of operations matters: run the spoofer first, then create the new account, then load anything else. Doing it the other way round links the new account to the banned one before the spoof has taken effect.",
        ],
      },
    ],
    faqs: [
      {
        q: "My game is not listed — will you add it?",
        a: "Possibly. The catalogue tracks what our providers actually maintain, and titles come and go with demand and with how hard the anti-cheat is to work against. Ask in Discord; requests genuinely influence what gets sourced.",
      },
      {
        q: "Is a category with fewer products worse?",
        a: "Not necessarily — it usually means the game is harder to support, so fewer builds survive. A short list of stocked products often reflects tighter curation rather than neglect.",
      },
      {
        q: "Can I use a cheat from one category on a different game?",
        a: "No. Builds are compiled against a specific game version and will not load against anything else. Buying the wrong category is the most common avoidable mistake at checkout.",
      },
      {
        q: "Which games are safest to cheat on?",
        a: "Titles without kernel-level anti-cheat and without aggressive community reporting carry the least risk. Within this catalogue that generally means the survival and PvE-leaning titles rather than the competitive shooters — but no game is risk free, and anyone telling you otherwise is selling something.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════ /status
  {
    key: "status",
    heading: "How to read this status board",
    lead:
      "This board is the single thing worth checking before every session, not just before a purchase. It reflects the state each build is actually in right now — and acting on it is the difference between a quiet month and a hardware ban.",
    sections: [
      {
        heading: "What each state means",
        body: [
          "The board carries three states, and they are operational instructions rather than descriptions.",
        ],
        bullets: {
          items: [
            "Undetected — the build is running normally and there is no known detection against it. Safe to load, with sensible settings.",
            "Updating — the build is offline while it is rebuilt, usually after a game patch or a precautionary pull. Not a fault, and not something to work around. Wait.",
            "Detected — the anti-cheat is known to be catching this build. Do not load it under any circumstances until it returns to Undetected. This is where bans come from.",
          ],
        },
      },
      {
        heading: "Why a game update means stop, not retry",
        body: [
          "When a game patches, builds break for two very different reasons that look identical from the outside. Either the build simply no longer matches the game's memory layout and fails harmlessly, or the patch shipped a new detection method and the build now loads straight into it.",
          "You cannot tell which from your own machine, and the failure mode of guessing wrong is permanent. The status here is updated once the provider has actually verified the build against the patched client — that verification is the entire value of the board, and retrying a loader in the meantime discards it.",
        ],
      },
      {
        heading: "How these statuses are determined",
        body: [
          "Statuses come from the providers who maintain each build, combined with what we see reported across our own customer base, and are pushed here as they change rather than on a schedule.",
          "This page previously inferred a status when no confirmed one existed, which meant a build could be shown as Detected on the strength of nothing more than its own marketing copy. That inference has been removed. A build with no confirmed status now reads as Undetected, and anything shown as Detected reflects an actual report.",
        ],
      },
      {
        heading: "What to do while something is down",
        body: [
          "Do not play the affected game on the affected account with any other build loaded — a detection wave frequently sweeps wider than the one product that triggered it.",
          "Watch this page or the Discord announcements channel rather than reinstalling or reactivating, neither of which affects the outcome and both of which risk burning a hardware lock. If a build stays down long enough to matter, the [refund policy](/refund-policy) sets out where that goes, and [support](/support) can tell you what the provider is actually saying.",
        ],
      },
    ],
    faqs: [
      {
        q: "How often is this page updated?",
        a: "As changes happen. The board refreshes on its own while open, so leaving the tab up during a patch window is a reasonable way to watch for a build returning.",
      },
      {
        q: "A build shows Undetected but I was banned. What happened?",
        a: "Most likely a report-driven review rather than a software detection — how you played, not what you loaded. Undetected means the anti-cheat is not known to be catching the build; it has never meant that aggressive play in a full lobby goes unnoticed.",
      },
      {
        q: "Does Updating mean my key is being consumed?",
        a: "Time-based keys continue counting down while a build is in maintenance. If an outage runs long enough to eat a meaningful share of what you paid for, raise it with [support](/support) with your order ID.",
      },
      {
        q: "Can I get notified instead of checking?",
        a: "Yes — status changes are announced in the Discord server, which is the fastest channel we have. The [support page](/support) has the invite.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════ /support
  {
    key: "support",
    heading: "Getting a useful answer quickly",
    lead:
      "Support runs 24/7 through Discord tickets. Nearly every ticket that resolves in one reply does so because it arrived with the right details attached — and nearly every slow one is slow because it did not. Here is what to send, and what you can fix yourself in less time than a ticket takes.",
    sections: [
      {
        heading: "What to include in the first message",
        body: [
          "A ticket that opens with all of this gets an answer in one round trip. A ticket that opens with \"it doesn't work\" takes four.",
        ],
        bullets: {
          heading: "Include every time",
          items: [
            "Your order ID, from the confirmation page or the email.",
            "The exact product and duration you bought.",
            "The exact error text — a screenshot of the loader window beats a paraphrase.",
            "Your Windows version and build, and whether Secure Boot is on or off.",
            "What you have already tried, so nobody sends you round the same loop again.",
          ],
        },
      },
      {
        heading: "Fix these yourself before opening a ticket",
        body: [
          "A large share of tickets are one of four things, all of which you can resolve faster than we can reply.",
        ],
        bullets: {
          items: [
            "Loader closes instantly, or vanishes after download — antivirus quarantined it. Add the folder to exclusions and download again. See the [setup guide](/guide).",
            "\"Invalid key\" — almost always a trailing space from copy-paste, or the wrong product's key. Retype the last character by hand.",
            "\"Key already in use\" — the hardware lock is bound to a previous machine or a previous Windows install. This one does need a ticket, but say so up front and it is a single reply.",
            "Loader runs, game does not respond — check the [status page](/status) first. If the build is Updating or Detected, nothing on your machine is broken.",
          ],
        },
      },
      {
        heading: "Response times and escalation",
        body: [
          "Tickets are staffed around the clock, though volume spikes sharply in the hours after a major game patch — which is precisely when the answer to most tickets is the status board. Checking it first genuinely gets you a faster answer than asking.",
          "Issues that need the upstream provider — a build failing on specific hardware, an unusual detection report — take longer, because they involve someone outside this team. You will be told when that is the case rather than left waiting.",
        ],
      },
      {
        heading: "Billing, refunds and account problems",
        body: [
          "For a payment that was taken without an order appearing, send the order ID or the payment reference and the approximate time; card and crypto payments are both traceable from that.",
          "Refund questions are handled against the published [refund policy](/refund-policy) rather than case by case, so reading it first will tell you the likely answer. For anything touching your account itself — email changes, balance queries, referral payouts — support can act only after verifying ownership of the account, so raise those from the address the account is registered to.",
          "For business, partnership or press enquiries, use email rather than a ticket: cheatparadisesupport@gmail.com.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is support really staffed 24/7?",
        a: "Yes, through Discord tickets. Response time varies with volume and with whether your issue needs the upstream provider, but there is no closing time.",
      },
      {
        q: "Can I get support without Discord?",
        a: "Email reaches us at cheatparadisesupport@gmail.com, but it is slower. Discord is where the people who can actually reset a key and check a build are.",
      },
      {
        q: "I lost my key and my email. Can you resend it?",
        a: "Yes, if you can prove the purchase. Signed-in customers can find every key under Account → Orders without asking. Guests should use the [order lookup](/orders) page, or open a ticket with the payment reference.",
      },
      {
        q: "Will support help me set up a cheat on a game I did not buy here?",
        a: "No. Support covers products bought from this store. The [setup guide](/guide) is public and may still help you.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════ /guide
  {
    key: "guide",
    heading: "Setup, in the order that actually works",
    lead:
      "Most first-run failures are not the product. They are sequence — a spoofer run after the account was made, an antivirus exclusion added after the download, Secure Boot left on. Doing these steps in the right order removes the large majority of support tickets.",
    sections: [
      {
        heading: "Prepare Windows before you download anything",
        body: [
          "Cheat loaders are, structurally, exactly what antivirus heuristics are built to catch: unsigned binaries that inject into another process. Every mainstream AV will flag them, and that flag is not evidence of anything.",
          "Add your intended download folder to Windows Defender exclusions before downloading, not after. Defender deletes on download, so a file added to exclusions afterwards has usually already been removed — which is why so many people report a file that \"downloaded but isn't there\".",
        ],
        bullets: {
          heading: "Order matters",
          items: [
            "Create the folder you will download into.",
            "Add that folder to Defender exclusions, plus any third-party AV you run.",
            "Only then download the loader.",
            "Run the loader as Administrator — memory access requires it and it will fail quietly otherwise.",
          ],
        },
      },
      {
        heading: "BIOS: Secure Boot, and why it is asked for",
        body: [
          "Many products require Secure Boot disabled. It is not arbitrary: Secure Boot enforces signature checks on what may load at boot, and unsigned drivers are blocked by it.",
          "Disabling it is done in BIOS or UEFI, usually under Boot or Security, and takes effect on the next restart. Two things to know before you do it. Some titles — Valorant most prominently — refuse to run at all without Secure Boot and TPM, so disabling it locks you out of those games until you turn it back on. And if the drive is BitLocker-encrypted, suspend BitLocker first or you will be asked for a recovery key you may not have.",
        ],
      },
      {
        heading: "Hardware bans and spoofer sequence",
        body: [
          "If you have been hardware-banned, the spoofer must run before the new account exists. The ban attaches to identifiers read from your machine, and a new account created while those identifiers are still the banned ones is linked immediately — often before you finish the tutorial.",
        ],
        bullets: {
          heading: "The correct sequence",
          items: [
            "Uninstall the game and clear its remaining data directories.",
            "Run the [HWID spoofer](/categories/hwid-spoofers) and restart if it asks you to.",
            "Create the new game account — new email, and not on the same payment details.",
            "Reinstall the game.",
            "Only now load the cheat, and start conservatively.",
          ],
        },
      },
      {
        heading: "First session settings",
        body: [
          "The settings that get people banned are the ones that look obviously wrong to a spectator. Anti-cheat catches software; other players catch behaviour, and behaviour reports are reviewed by humans against a recording.",
          "Start with visual assistance only — ESP at modest range, no aim assistance at all — and play a full session that way. Add one thing at a time, and keep aim smoothing high and field of view narrow enough that your crosshair never snaps across the screen. Nothing about a build being Undetected protects you from a killcam that looks impossible.",
        ],
      },
      {
        heading: "When something still will not run",
        body: [
          "Check the [status page](/status) before debugging anything locally. A build that is Updating will fail to load on a perfectly configured machine, and no amount of reinstalling changes that.",
          "If the status is clean, work through the usual four: run as Administrator, confirm exclusions are actually applied, confirm Secure Boot is off, and confirm the game is not running under a different user or through a launcher overlay. If it still fails, [support](/support) will want the exact error text and your Windows build.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is it safe to disable my antivirus?",
        a: "Adding a specific folder to exclusions is reasonable and reversible. Disabling protection entirely, on a machine you also bank on, is not — and it is never necessary. Use exclusions.",
      },
      {
        q: "Do I have to disable Secure Boot for every product?",
        a: "No — it depends on how the build loads. External products often do not need it. The product page states the requirement; if it is not required, leave Secure Boot on.",
      },
      {
        q: "Will a spoofer unban my existing account?",
        a: "No. A spoofer changes what your hardware reports, which lets a new account survive. The banned account stays banned permanently.",
      },
      {
        q: "How long should I wait after a game update?",
        a: "Until the [status page](/status) shows the build back at Undetected. That is not caution for its own sake — the window immediately after a patch is when detections land.",
      },
      {
        q: "Can I stream while using a cheat?",
        a: "Some builds offer streamproof rendering that hides overlays from capture software. Treat it as imperfect: it does not hide behaviour, and a viewer report carries the same weight as any other.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════ /loaders
  {
    key: "loaders",
    heading: "What a loader is and why your antivirus hates it",
    lead:
      "The loader is the small program that authenticates your key and injects the build into the game. It is not the cheat, it is the thing that starts the cheat — and understanding that distinction explains almost every problem people have with it.",
    sections: [
      {
        heading: "Why every antivirus flags these files",
        body: [
          "A loader is an unsigned executable whose entire job is to write into another running process's memory. That is a textbook description of what heuristic detection exists to find, so a warning is the expected outcome rather than a sign of a compromised file.",
          "The practical consequence is that you must configure exclusions before downloading. Defender removes files at download time, so a loader that \"downloaded but disappeared\" was almost certainly deleted before you ever saw it. Set the exclusion on the destination folder first, then download.",
        ],
      },
      {
        heading: "Always download from here",
        body: [
          "Because these files are flagged by design, people learn to ignore warnings about them — and that habit is exactly what makes reuploaded loaders such an effective way to distribute malware. A cracked or mirrored loader is the single most common way people lose game accounts, and often a great deal more.",
          "Download only from this site or from links posted in our own Discord. Never from a forum mirror, a file host, a YouTube description or a \"free version\". If a loader for a paid product is being offered free, the product being sold is you.",
        ],
        bullets: {
          heading: "Warning signs",
          items: [
            "A loader asking for your game account credentials. No legitimate build needs them.",
            "An installer that wants to add a browser extension or a second bundled program.",
            "A file whose size differs wildly from the one published here.",
            "Any build offered free that is sold everywhere else.",
          ],
        },
      },
      {
        heading: "Keeping the loader current",
        body: [
          "Loaders are rebuilt whenever the game they target patches, and an old loader against a new client will fail — sometimes harmlessly, sometimes not. Re-download rather than reusing a copy from last month, and delete old copies so you cannot run one by accident.",
          "When a build is in maintenance the loader will refuse to launch. That refusal is deliberate and protective: it is stopping you loading into a client the build has not been verified against yet. Check the [status page](/status) rather than hunting for an older loader that still runs.",
        ],
      },
      {
        heading: "Common loader errors",
        body: [
          "\"Invalid key\" is nearly always a copy-paste artefact — a trailing space, or a key belonging to a different product. Retype the last few characters manually.",
          "\"Key already in use\" means the hardware lock is bound elsewhere: a previous machine, or the same machine before a Windows reinstall or a component swap. [Support](/support) resets these; send the order ID.",
          "A loader that opens and closes immediately is an exclusion problem or a missing Administrator elevation. A loader that runs but never attaches is usually Secure Boot still enabled, or the game already running under a different user context. The [setup guide](/guide) walks through all of these in order.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is the antivirus warning a false positive?",
        a: "For files downloaded here, yes — it is heuristic detection reacting to legitimate injection behaviour. That is precisely why you should never extend the same assumption to a loader from anywhere else.",
      },
      {
        q: "Do I need a separate loader for each product?",
        a: "Usually yes. Loaders are tied to the build they start, so a second product generally means a second loader and its own exclusion.",
      },
      {
        q: "Can I keep the loader on a USB stick and use it on another PC?",
        a: "The file will run, but the key will not — it is locked to the first machine it activated on. Using it elsewhere breaks the lock and needs a support reset.",
      },
      {
        q: "The loader wants Administrator every time. Is that normal?",
        a: "Yes. Reading and writing another process's memory requires elevation, and without it the loader will fail — often silently.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════ /videos
  {
    key: "videos",
    heading: "What to look for in this footage",
    lead:
      "Feature lists tell you what a build claims to do. Footage shows you what it looks like on screen, at real frame rates, in real lobbies — including how obvious it would be to somebody watching your killcam.",
    sections: [
      {
        heading: "Watch the aim, not the kills",
        body: [
          "Anyone can record a good round. What is worth studying is how the crosshair moves between targets: whether it travels or teleports, whether it overshoots and settles like a hand would, and whether it tracks through cover when it should have lost the target.",
          "That movement is what a reviewer sees when a report is filed. A build capable of smooth, human-looking correction is worth far more than one with a longer feature list, because the realistic path to a ban on most of these games is a human deciding your aim looked wrong.",
        ],
      },
      {
        heading: "Judging ESP from footage",
        body: [
          "Look at how much of the screen the overlay occupies in a busy moment. Boxes and skeletons on every player in a large lobby become genuinely hard to play through, and a clean implementation lets you dial range and detail down rather than forcing one preset.",
          "Distance labels, health bars and loot filters are where the practical value sits on survival and extraction titles — considerably more than aim assistance, which is also what draws attention fastest.",
        ],
      },
      {
        heading: "What footage cannot tell you",
        body: [
          "It cannot tell you whether a build is currently safe. Footage is a recording of a moment; anti-cheat has changed since, possibly several times. Always check the [status page](/status) for the build's state now.",
          "It also cannot tell you how a build behaves on your hardware, or how quickly its provider responds when a game patches. That second one matters more than anything visible on screen, and the cheapest way to find out is a day key rather than a month.",
        ],
      },
      {
        heading: "Where to go next",
        body: [
          "If something here looks like what you want, open the [category page for that game](/categories) — the written guides cover which feature sets are realistic against that specific anti-cheat, which is the part footage never shows.",
          "Then read the [setup guide](/guide) before buying, particularly the section on first-session settings. The gap between what a build can do and what you should switch on is where most bans live.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is this footage from the current version of the build?",
        a: "Footage is recorded at a point in time and builds are updated continuously. Treat it as a demonstration of feature behaviour, not as evidence of current status — that is what the [status page](/status) is for.",
      },
      {
        q: "Why do some videos look less impressive than others?",
        a: "Usually because the settings are realistic. Footage recorded at survivable settings looks less dramatic than footage recorded at maximum, and it is a far better guide to how you should actually play.",
      },
      {
        q: "Can I record my own gameplay with a cheat running?",
        a: "Some builds offer streamproof rendering that hides overlays from capture software, but it does not hide behaviour. A viewer report is reviewed like any other.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════ /affiliates
  {
    key: "affiliates",
    heading: "How the affiliate programme works",
    lead:
      "Share a referral link, earn a share of what the people who use it spend. The mechanics are simple; the part worth reading is what promotion is actually allowed, because the fastest way to lose an affiliate account is a method that looks like an easy win.",
    sections: [
      {
        heading: "Attribution and how a referral is credited",
        body: [
          "Your link sets a referral cookie that lasts thirty days from the click. Anyone who signs up in that window is credited to you, whether or not they buy on the same visit — which matters, because customers in this market routinely research for days before purchasing.",
          "The code travels with any page on the site, not only the registration page, so linking to the specific product or [category page](/categories) you are talking about works exactly as well as linking to the homepage — and converts considerably better.",
        ],
      },
      {
        heading: "What earns and what does not",
        body: [
          "Commission accrues on completed orders from users attributed to you. Refunded and charged-back orders reverse, for the obvious reason.",
          "Self-referral does not earn. Neither does an account created on your own link from your own machine — attribution and payment details are both checked, and it is the most common reason an affiliate account is closed.",
        ],
        bullets: {
          heading: "Not permitted",
          items: [
            "Referring yourself, or coordinating reciprocal referrals with another affiliate.",
            "Paid search advertising on our brand name.",
            "Claiming products are undetectable, unbannable, or guaranteed — none of that is true and it creates refund claims we both lose on.",
            "Posting the link where it violates the host platform's rules. That gets the link killed, not just the post.",
            "Automated posting, mass DMs or comment spam.",
          ],
        },
      },
      {
        heading: "What actually converts",
        body: [
          "Honest, specific content outperforms volume by a wide margin here. An audience that already trusts you on a particular game converts far better than untargeted traffic, because the purchase decision is mostly about trust — the buyer is weighing whether they will get banned.",
          "Setup walkthroughs, footage at realistic settings, and straight comparisons between builds all work. So does being open about risk: telling people bans are possible and explaining how to reduce that risk builds more credibility than any claim of undetectability, and it sharply reduces the refund requests that would have reversed your commission anyway.",
        ],
      },
      {
        heading: "Payouts",
        body: [
          "Earnings accumulate on your account and can be paid out or spent as store balance. Balance is available immediately; withdrawals are reviewed against the same fraud checks as any payout, which is why attribution quality matters more than raw referral count.",
          "Track clicks, signups and conversions from the referrals section of your account. If a referral you expected is missing, raise it with [support](/support) with the approximate time of the click — attribution is logged and can be checked.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long does the referral cookie last?",
        a: "Thirty days from the click, and it is set on any page of the site rather than only the signup page.",
      },
      {
        q: "Can I refer myself or my friends?",
        a: "Friends yes, yourself no. Self-referral is checked against attribution and payment details, and it is the usual cause of a closed affiliate account.",
      },
      {
        q: "Do I earn on repeat purchases?",
        a: "Commission accrues on orders from users attributed to you. Check the current terms in your account for how repeat orders are handled, as programme terms can change.",
      },
      {
        q: "What happens if a referred order is refunded?",
        a: "The commission reverses. This is also why over-promising in your promotion costs you money rather than making it.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════ /about/editorial-team
  {
    key: "editorial-team",
    heading: "How we test, and how to check our work",
    lead:
      "Everything on this site is written by people who run these builds on their own hardware. That is worth stating plainly, because most content in this market is written by people who have never launched the product they are describing.",
    sections: [
      {
        heading: "What testing means here",
        body: [
          "A build is installed on real hardware, run through a full setup on a current Windows install, and played across several sessions before anything is written about it. What we report is what happened on that machine — including when it failed.",
          "Each game guide carries a last-tested date for exactly this reason. Anti-cheat moves constantly, and a guide without a date is a guide you cannot evaluate. If a date looks stale relative to a recent patch, treat the specifics as provisional and check the [status page](/status) for the build's current state.",
        ],
      },
      {
        heading: "What we will not write",
        body: [
          "We do not describe any product as undetectable. No such product exists, the claim is unfalsifiable, and every anti-cheat vendor eventually disproves it. What we can say is whether a build is currently detected, how quickly its provider has historically responded to patches, and what usage patterns have actually got people banned.",
          "We also do not present a ban as impossible if you follow instructions. Reducing risk is achievable; eliminating it is not, and pretending otherwise would make everything else here less trustworthy.",
        ],
      },
      {
        heading: "Commercial relationships, stated plainly",
        body: [
          "This is a storefront. We sell the products we write about, and we earn when you buy them. That is an obvious conflict of interest and the right response is disclosure rather than pretending it is absent.",
          "In practice it cuts the other way more often than people expect: recommending a build that gets someone banned produces a refund request, a support ticket and a customer who never returns. Accurate risk assessment is the commercially better choice, which is a large part of why the status board reports confirmed detections rather than guesses.",
        ],
      },
      {
        heading: "Corrections",
        body: [
          "When something here is wrong, we change it and the last-tested date moves with it. Guidance that turns out to have been unsafe is corrected as a priority rather than quietly edited.",
          "If you have found something inaccurate — a step that no longer applies, a requirement that changed with a Windows update, a status that does not match what you are seeing — tell [support](/support) or raise it in Discord. Reports from people running these builds daily are the main reason the guides stay current.",
        ],
      },
    ],
    faqs: [
      {
        q: "Who writes these guides?",
        a: "Staff who run the products on their own hardware, drawing on what is reported across the customer base and what providers tell us about their own builds.",
      },
      {
        q: "Are the reviews independent?",
        a: "No, and we say so. We sell what we write about. What we can offer instead of false independence is disclosure, dated testing, and a status board that reports confirmed detections rather than guesses.",
      },
      {
        q: "How current is the information?",
        a: "Each game guide carries its own last-tested date. For anything time-sensitive — whether a build is safe right now — the [status page](/status) is authoritative and the guides are not.",
      },
      {
        q: "How do I report an error?",
        a: "Through [support](/support) or the Discord server. Specifics help: which page, which step, and what happened instead.",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════ /faq
  {
    key: "faq",
    heading: "More detail on the questions behind the questions",
    lead:
      "The answers above cover the mechanics. These cover the things people actually want to know before spending money — how risk really works, what the store does when a build goes down, and where the limits of any of this are.",
    sections: [
      {
        heading: "How bans actually happen",
        body: [
          "There are two separate routes and they call for opposite responses. A software detection means the anti-cheat identified the build; that is what the [status page](/status) tracks, and the correct response is to stop loading it. A behavioural ban follows a player report and a review of how you played, and no property of the software prevents it.",
          "Behavioural bans are the more common of the two on most of these titles. That is why conservative settings matter more than which product you bought, and why two people running the same build for the same month get completely different outcomes.",
        ],
      },
      {
        heading: "What happens when a build is pulled",
        body: [
          "Builds are pulled from sale during detection waves and while they are rebuilt after a game patch. Existing keys stay valid; the loader simply refuses to start until the build is verified against the patched client.",
          "Time-based keys continue to count down during that window. If an outage consumes a meaningful share of what you paid for, raise it with [support](/support) with your order ID — that is a real conversation rather than a policy dead end, but it has to be asked for.",
        ],
      },
      {
        heading: "Payments, currency and balance",
        body: [
          "Cards run through Stripe; crypto runs through NOWPayments with Bitcoin, Ethereum, Solana, Litecoin, USDT and BNB. The site can display prices in a range of currencies, but the charge is always processed in USD — the converted figure is a reference, and your bank's own rate is what lands on the statement.",
          "Crypto deposits have per-coin network minimums set by the processor, and for Bitcoin that minimum is frequently higher than a small order total. If a deposit is declined for being under the minimum you will now be shown the exact figure required; sending a larger amount or choosing a lower-minimum coin both work. Topping up account balance once and spending it across orders avoids the issue entirely.",
        ],
      },
      {
        heading: "Accounts, keys and hardware",
        body: [
          "Keys bind to the hardware they first activate on. Reinstalling Windows, swapping a motherboard or changing a GPU can all break that binding, and the key will then report itself as already in use. Support resets these — it is routine — but it is not instantaneous, so avoid activating a key on a machine you are about to rebuild.",
          "An account is not required to buy, but it is the only way to keep a durable record of your keys. Guest orders can be retrieved from the [order lookup](/orders) page with the order ID and the token emailed at checkout, and losing both makes recovery considerably harder.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is there any way to be certain I will not be banned?",
        a: "No, and treat any source claiming otherwise as unreliable. You can reduce the risk substantially — check status before every session, play conservatively, keep cheating separate from accounts you care about — but you cannot eliminate it.",
      },
      {
        q: "Should I cheat on my main account?",
        a: "No. Anything you would be upset to lose should never have a cheat loaded near it. Use a separate account, separate email, and ideally separate payment details.",
      },
      {
        q: "Why do prices differ so much between products for the same game?",
        a: "Feature depth, injection method and how much ongoing maintenance the build takes. A product that survives patches quickly costs more to maintain, and that shows up in the price.",
      },
      {
        q: "Do you offer trials?",
        a: "Day keys serve that purpose, and they are the sensible way to evaluate an unfamiliar provider — you find out how fast they respond to a patch for very little money.",
      },
      {
        q: "Can I change the site language and currency?",
        a: "Yes, from the control in the site header. Currency affects displayed prices only; the charge is processed in USD.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════ /contact-us
  {
    key: "contact-us",
    heading: "Choosing the right channel",
    lead:
      "Different problems reach the right person through different routes, and picking wrong is the main reason an enquiry sits unanswered. Here is what goes where, and what to have ready before you send it.",
    sections: [
      {
        heading: "Discord tickets — anything about an order",
        body: [
          "Product issues, key resets, delivery problems and refund questions all belong in a Discord ticket. It is the only channel where the people answering can look up your order and act on it directly, and it is staffed around the clock.",
          "Have your order ID ready, along with the exact product and duration, the precise error text, and your Windows version. A ticket with all of that usually resolves in a single reply; one without it takes several. The [support page](/support) covers this in more detail.",
        ],
      },
      {
        heading: "Email — business and formal matters",
        body: [
          "cheatparadisesupport@gmail.com handles partnership enquiries, press, affiliate programme questions that are not account-specific, and any formal or legal correspondence.",
          "Email is slower than a ticket and is the wrong channel for a broken loader at two in the morning. For data protection requests, send them from the address the account is registered to — we cannot act on an account request that arrives from an address we cannot tie to it.",
        ],
      },
      {
        heading: "Check these before contacting anyone",
        body: [
          "A meaningful share of enquiries are answered faster by a page than by a person, particularly during the hours after a game patch when ticket volume spikes.",
        ],
        bullets: {
          items: [
            "[Status page](/status) — if a build is Updating or Detected, nothing on your machine is broken and there is nothing to fix.",
            "[Setup guide](/guide) — exclusions, Secure Boot, and the spoofer sequence, which between them cover most first-run failures.",
            "[FAQ](/faq) — delivery, payments, hardware locking and refunds.",
            "[Order lookup](/orders) — retrieve a guest order without waiting for anyone.",
          ],
        },
      },
      {
        heading: "What we cannot help with",
        body: [
          "We cannot lift a ban on a game account. Bans are issued by the game publisher, we have no relationship with their enforcement teams, and nobody who offers to reverse one for a fee can do it either.",
          "We also cannot support products bought elsewhere, or recover a key for a purchase we have no record of. If you paid through a third party, that seller is who you need. Where a payment exists but no order appeared, we can absolutely help — send the payment reference and the approximate time.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the fastest way to get help?",
        a: "A Discord ticket with your order ID and the exact error text in the first message. Tickets are staffed 24/7.",
      },
      {
        q: "Do you have a phone number or live chat?",
        a: "No. Support runs through Discord tickets and email, which keeps a written record of every order issue and is why key resets can be verified quickly.",
      },
      {
        q: "How long does a reply take?",
        a: "It varies with volume, and spikes sharply after major game patches. Anything needing the upstream provider takes longer, and you will be told when that is the case.",
      },
      {
        q: "Can you help me get unbanned?",
        a: "No — bans come from the game publisher and cannot be reversed by us or by anyone selling that service. What does work is an [HWID spoofer](/categories/hwid-spoofers) plus a new account, in that order.",
      },
    ],
  },
];

const BY_KEY = new Map(PAGE_SEO_CONTENT.map((entry) => [entry.key, entry]));

export function pageSeoFor(key: string): PageSeoContent | undefined {
  return BY_KEY.get(key);
}

export { PAGE_SEO_CONTENT };
