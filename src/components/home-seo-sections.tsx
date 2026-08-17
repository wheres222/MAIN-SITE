import Link from "next/link";
import styles from "./home-seo-sections.module.css";

/**
 * Long-form homepage content.
 *
 * The landing page carried 336 words and a single H2 — almost all of its
 * surface was imagery, tiles and video, which reads to a crawler as a page with
 * nothing to say. Category and product pages had already been brought to
 * competitor depth; the homepage, which is what ranks for the brand and for
 * broad head terms, had been left behind.
 *
 * Deliberately a server component with no client hooks, so every word is in the
 * initial HTML rather than arriving after hydration. Content that only exists
 * after JavaScript runs does not reliably count.
 */

const FAQS = [
  {
    q: "What does 'undetected' actually mean?",
    a: "That the current build has not been flagged by the game's anti-cheat as of the last check. It is a statement about a moment in time, not a guarantee — anti-cheat vendors ship updates constantly, and any provider claiming permanent undetectability is not being straight with you. Every product page shows a live status that syncs from our supplier feed automatically rather than being edited by hand.",
  },
  {
    q: "How fast is delivery?",
    a: "Immediate. Licences are delivered to your account dashboard and your email as soon as payment confirms. Card payments confirm in seconds; crypto typically clears in a few minutes depending on the coin and network congestion.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "Card via Stripe, and seven cryptocurrencies — Bitcoin, Ethereum, Solana, Litecoin, Tether, Binance Coin and Binance USD. You can also pay from your account balance, which is what the deposit page tops up.",
  },
  {
    q: "Will I get banned?",
    a: "Two things get people banned: the anti-cheat detecting the software, and another player reporting behaviour that gets reviewed. The first is why the status page matters. The second is entirely within your control, and it catches more people. Use an account you can afford to lose, and read the guide for the game you play — each one explains what actually gets noticed there.",
  },
  {
    q: "Do I need a HWID spoofer?",
    a: "Only if the machine has already carried a hardware ban. Anti-cheats like EAC, BattlEye and Vanguard record hardware identifiers, and a fresh game account on flagged hardware will be banned as soon as it is recognised. On a clean machine a spoofer is another driver and another thing to conflict with.",
  },
  {
    q: "What happens when a product goes down?",
    a: "It is marked Updating on the status page while the developer rebuilds it, which normally follows a game patch. That is the moment to not play rather than to try a different loader. Subscription time is not lost while a product is paused.",
  },
];

export function HomeSeoSections() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className={`home-shell ${styles.wrap}`} aria-labelledby="home-about">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h2 id="home-about" className={styles.heading}>
        Undetected game cheats with instant delivery
      </h2>
      <p className={styles.body}>
        Cheat Paradise sells game enhancements for{" "}
        <Link href="/categories/rust">Rust</Link>,{" "}
        <Link href="/categories/counter-strike-2">CS2</Link>,{" "}
        <Link href="/categories/arc-raiders">ARC Raiders</Link>,{" "}
        <Link href="/categories/rainbow-six-siege">Rainbow Six Siege</Link>,{" "}
        <Link href="/categories/apex">Apex Legends</Link>,{" "}
        <Link href="/categories/escape-from-tarkov">Escape From Tarkov</Link>,{" "}
        <Link href="/categories/fortnite">Fortnite</Link>,{" "}
        <Link href="/categories/call-of-duty">Call of Duty</Link> and a dozen other
        titles, alongside <Link href="/categories/hwid-spoofers">HWID spoofers</Link>{" "}
        and <Link href="/categories/accounts">accounts</Link>. Every purchase is
        delivered automatically the moment payment confirms — there is no queue, no
        manual approval, and no waiting for someone to come online.
      </p>
      <p className={styles.body}>
        What separates a provider worth paying for is not the feature list. It is
        whether they tell you when something is detected. A product that has never
        been marked down is a product whose status page is decorative, and the cost of
        that dishonesty is your account rather than theirs.
      </p>

      <h2 className={styles.heading}>How the status page works</h2>
      <p className={styles.body}>
        Our <Link href="/status">live status board</Link> reads directly from the
        supplier feed rather than from a spreadsheet someone remembers to update.
        Products show as Undetected, Updating or Detected, and the value changes
        without anyone here touching it.
      </p>
      <p className={styles.body}>
        Check it immediately before you play rather than the day you buy. Detection
        status is accurate for the moment it was read and goes stale in hours,
        particularly around game patches — Rust force wipes on the first Thursday of
        each month, Tarkov wipes every few months, and both reliably put products into
        a rebuild window.
      </p>

      <h2 className={styles.heading}>Choosing between external, internal and DMA</h2>
      <p className={styles.body}>
        An external cheat reads the game from a separate process and never injects
        into it, which keeps it clear of the checks anti-cheats run against their own
        memory. An internal loads inside the game: smoother aim, frame-accurate
        visuals, and a much larger detection surface. A DMA setup reads memory over
        hardware in a second machine, so nothing runs on the gaming PC at all.
      </p>
      <p className={styles.body}>
        For most people an external on a throwaway account is the right answer. We
        wrote{" "}
        <Link href="/blog/internal-vs-external-vs-dma-cheats">
          a full comparison
        </Link>{" "}
        covering what each one costs you in risk, and when DMA stops being exotic and
        starts being the sensible purchase.
      </p>

      <h2 className={styles.heading}>Payments, balance and refunds</h2>
      <p className={styles.body}>
        Pay by card through Stripe, or with Bitcoin, Ethereum, Solana, Litecoin,
        Tether, Binance Coin or Binance USD. You can also{" "}
        <Link href="/account/deposit">top up your account balance</Link> and spend it
        across multiple purchases, which is the usual route for anyone buying
        regularly.
      </p>
      <p className={styles.body}>
        Digital licences are delivered instantly and are non-refundable once issued,
        which is standard across this market for obvious reasons. What we will do is
        extend subscription time when a product is paused for maintenance, and help
        you through setup when a loader will not start — most of those cases are a
        second kernel-level driver rather than a broken build.
      </p>

      <h2 className={styles.heading}>Guides worth reading before you buy</h2>
      <p className={styles.body}>
        Each game punishes different behaviour. Siege runs input analysis alongside
        BattlEye, so aimbot smoothing is a safety setting there rather than a comfort
        one. Tarkov reviews statistics as well as software, so an implausible survival
        rate is its own risk. Hell Let Loose is decided by garrisons rather than
        gunfights. Valorant runs a boot-start kernel driver and is the hardest game we
        list.
      </p>
      <p className={styles.body}>
        Our <Link href="/blog">blog</Link> covers{" "}
        <Link href="/blog/how-anti-cheat-detection-works">
          how anti-cheat detection actually works
        </Link>
        ,{" "}
        <Link href="/blog/hwid-bans-and-spoofers-explained">
          HWID bans and spoofers
        </Link>
        , and{" "}
        <Link href="/blog/will-i-get-banned-using-cheats">
          what actually gets accounts caught
        </Link>
        . The <Link href="/guide">setup guides</Link> cover installation, Secure Boot
        and the driver conflicts that cause most failed launches.
      </p>

      <h2 className={styles.heading}>Frequently asked questions</h2>
      <dl className={styles.faq}>
        {FAQS.map((f) => (
          <div key={f.q} className={styles.faqItem}>
            <dt className={styles.faqQ}>{f.q}</dt>
            <dd className={styles.faqA}>{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
