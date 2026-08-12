/**
 * Affiliate recruitment guides.
 *
 * These are the pages that do the link-building work. A programme page states
 * terms; guides get shared, quoted and linked to by the creators they are aimed
 * at, which is the mechanism competitors use to accumulate backlinks in a niche
 * where ordinary outreach is not available.
 *
 * They are written to be useful to someone promoting anything, not only us. A
 * guide that is transparently a sales pitch gets no links, which defeats the
 * only reason to publish it.
 */

export interface GuideSection {
  heading: string;
  body: string[];
}

export interface AffiliateGuide {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  published: string;
  updated: string;
  readingMinutes: number;
  lead: string;
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
}

export const AFFILIATE_GUIDES: AffiliateGuide[] = [
  {
    slug: "getting-started",
    title: "Getting Started as an Affiliate",
    seoTitle: "How to Start as a Gaming Affiliate — A Practical First-30-Days Guide",
    description:
      "What to do in your first month promoting as an affiliate: where the audience actually is, what converts, and the setup work worth doing before you post anything.",
    published: "2026-08-14",
    updated: "2026-08-14",
    readingMinutes: 7,
    lead:
      "Most people who try affiliate promotion in this space quit in the first month, and almost always for the same reason: they posted a link before they had anywhere to post it.",
    sections: [
      {
        heading: "Build the audience before the link",
        body: [
          "A referral link converts a fraction of the people who see it. If ten people see it, you earn nothing regardless of how good the offer is. The first month is about having somewhere to put the link, not about the link.",
          "Pick one platform. YouTube, TikTok and Discord all work, and splitting attention across all three in month one guarantees you are mediocre at each. YouTube compounds hardest because old videos keep earning; TikTok spikes fastest and decays fastest.",
          "Post consistently at a cadence you can actually keep. Two videos a week for six months beats daily for three weeks and then nothing, and the algorithms on every platform reward the former.",
        ],
      },
      {
        heading: "What converts and what doesn't",
        body: [
          "Gameplay with the product visibly working converts. People buy after seeing the thing do what it claims, not after hearing it described.",
          "Comparisons convert unusually well. 'Which of these three is actually worth it' is a question people search before buying, and answering it honestly — including saying when the answer is none of them — builds the trust that makes the recommendation worth acting on.",
          "Setup and troubleshooting content converts slowly but steadily. Someone searching how to fix a loader problem already owns something similar and is close to buying again.",
          "Pure link-drops convert at approximately zero. A link with no context in a Discord server is spam, and most servers will ban you for it.",
        ],
      },
      {
        heading: "Setup worth doing first",
        body: [
          "Create the account you will promote from and get your referral code before you make content, so you are not retrofitting links into videos that already exist.",
          "Decide what you will not promote. Having a category you refuse to touch is what makes the rest of your recommendations mean anything.",
          "Set up somewhere for people to ask questions — a Discord, or just open comments. Most of your conversions come from the second interaction, not the first.",
          "Learn the product properly. The single fastest way to lose an audience in this niche is to recommend something that gets them banned because you did not check its status before recording.",
        ],
      },
      {
        heading: "Being straight about the numbers",
        body: [
          "Our tiers run from 1% to 3% of referred order value depending on lifetime referred revenue. That is a modest rate by affiliate standards, and it is deliberately stated up front rather than buried.",
          "At those rates this works as a supplement to an audience you are building anyway, not as a primary income. Anyone telling you affiliate percentages in this niche will replace a job is selling you something.",
          "The rate improves as referred revenue grows, so the people it pays best are the ones who were going to make content regardless.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long before I earn anything?",
        a: "Realistically a couple of months, and only if you post consistently. Anyone promising faster is describing an outlier or lying.",
      },
      {
        q: "Do I need a big audience?",
        a: "No, but you need an engaged one. A thousand people who trust you convert better than fifty thousand who scrolled past.",
      },
      {
        q: "Can I promote on Discord servers I don't own?",
        a: "Only where the server rules allow it. Posting referral links into servers that prohibit them gets you banned and reflects badly on the product.",
      },
      {
        q: "Can I refer myself?",
        a: "No. Self-referrals and referrals to your own alternate accounts are not eligible.",
      },
    ],
  },
  {
    slug: "youtube",
    title: "Growing a YouTube Channel in a Restricted Niche",
    seoTitle: "Growing a Gaming YouTube Channel in a Restricted Niche (2026)",
    description:
      "How to build a YouTube channel around content platforms restrict: what gets demonetised, what gets removed, and how creators in this space actually grow.",
    published: "2026-08-16",
    updated: "2026-08-16",
    readingMinutes: 8,
    lead:
      "YouTube is the highest-leverage platform for this niche and the most hostile to it. Both things are true, and understanding the second is what lets you use the first.",
    sections: [
      {
        heading: "What actually gets you removed",
        body: [
          "Explicit sales pitches in the video itself attract far more enforcement than gameplay. A video that is a commercial reads as one; a video where the product happens to be visible reads as gameplay.",
          "Links in descriptions are the most common trigger. Many creators in this space keep the description clean and point to a profile or an off-platform destination instead.",
          "Thumbnails and titles do more damage than content. Aggressive keyword stuffing in the title is what gets a channel classified, and classification is applied to the channel rather than the video.",
          "Repeated strikes compound. One removal is survivable; a pattern gets the channel terminated, and channels are not recoverable in practice.",
        ],
      },
      {
        heading: "How creators here actually grow",
        body: [
          "Lead with the game, not the product. 'How to win more fights in Rust' reaches an audience; 'best Rust cheat 2026' reaches an audience and a moderator.",
          "Retention beats reach. YouTube's recommendation system responds to how long people watch far more than to how many click, and a niche audience that watches to the end outperforms a broad one that bounces.",
          "Series work better than one-offs. A viewer who finishes one video and starts another signals quality more strongly than almost anything else you control.",
          "Consistency over volume. Weekly for a year beats daily for a month, both for the algorithm and for the audience relationship that actually drives conversions.",
        ],
      },
      {
        heading: "Protecting the channel you build",
        body: [
          "Assume you will lose it eventually and build so that losing it is survivable. Get people onto a platform you control — a Discord, a mailing list — from the first video.",
          "Do not put the entire operation on one account. Creators who lose a channel and had no other presence lose everything at once.",
          "Keep a local copy of your content. Re-uploading is painful; re-recording is worse.",
          "Read the platform's policies yourself rather than relying on what other creators tell you. Policies change and secondhand advice ages badly.",
        ],
      },
      {
        heading: "Turning views into referrals",
        body: [
          "Ask once, clearly, and move on. Repeated pleading reduces conversions rather than increasing them.",
          "Put the offer where interested people go looking — pinned comment, profile, Discord — rather than interrupting the content with it.",
          "Answer questions. In this niche the buying decision is anxious, and the people who convert are usually the ones who got a straight answer about ban risk from someone they trust.",
          "Never recommend something you have not checked the status of. One bad recommendation costs you the audience you spent a year building.",
        ],
      },
    ],
    faqs: [
      {
        q: "Will my channel definitely get terminated?",
        a: "Not definitely, but treat it as likely enough to plan for. Creators who last are the ones who moved their audience somewhere they control early.",
      },
      {
        q: "Should I use a separate Google account?",
        a: "Yes. Keep this channel away from anything tied to your identity or to accounts you cannot afford to lose.",
      },
      {
        q: "Is TikTok safer than YouTube?",
        a: "Different rather than safer. TikTok's enforcement is faster and less appealable, but individual videos matter less because reach is not cumulative.",
      },
      {
        q: "Can I be monetised?",
        a: "Usually not through the platform. Affiliate income and direct audience support are how creators in this niche earn, which is precisely why the referral rate matters to them.",
      },
    ],
  },
  {
    slug: "mistakes",
    title: "Nine Mistakes That Kill Affiliate Income",
    seoTitle: "9 Affiliate Mistakes That Kill Your Income (And How to Avoid Them)",
    description:
      "The recurring mistakes that stop affiliate promotion working — from promoting everything to burning trust for a single sale.",
    published: "2026-08-18",
    updated: "2026-08-18",
    readingMinutes: 7,
    lead:
      "Almost every affiliate who fails does so for one of a short list of reasons. None of them are about the commission rate.",
    sections: [
      {
        heading: "The audience mistakes",
        body: [
          "Promoting everything. An affiliate who recommends every product recommends nothing, because the recommendation carries no information. Refusing to promote things is what makes promoting something mean anything.",
          "Chasing the highest rate rather than the best fit. A 3% commission on something your audience actually wants beats 20% on something they don't, every time.",
          "Building on rented land with no exit. If your entire audience lives on one platform and that platform removes you, you had a channel, not a business.",
        ],
      },
      {
        heading: "The content mistakes",
        body: [
          "Leading with the link instead of the value. People decide whether to trust you in the first fifteen seconds, and a pitch in that window ends the decision badly.",
          "Making content only for buyers. The people searching how something works outnumber the people searching where to buy it by an order of magnitude, and they become buyers later.",
          "Never updating anything. In this niche a guide goes stale in weeks. An out-of-date recommendation is worse than none, because someone will act on it.",
        ],
      },
      {
        heading: "The trust mistakes",
        body: [
          "Overstating safety. Telling people something is permanently undetected is the fastest way to lose an audience, because it will eventually be untrue and they will remember who told them.",
          "Hiding the affiliate relationship. Disclose it. Audiences in this niche assume it anyway, and being upfront costs nothing while being caught costs everything.",
          "Not testing what you promote. Recommending something you have not used is obvious to viewers faster than most creators expect, and it is unrecoverable when it gets someone banned.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the single biggest mistake?",
        a: "Promoting something you have not tested. Everything else is recoverable; that one costs you the audience.",
      },
      {
        q: "Should I disclose that I earn commission?",
        a: "Yes. It is expected in most jurisdictions and audiences here assume it regardless. Disclosure costs you nothing and being caught concealing it costs you the channel.",
      },
      {
        q: "How many products should I promote?",
        a: "Few enough that you have genuinely used all of them. That number is usually smaller than people want it to be.",
      },
    ],
  },
];

export function allAffiliateGuideSlugs(): string[] {
  return AFFILIATE_GUIDES.map((g) => g.slug);
}

export function affiliateGuideBySlug(slug: string): AffiliateGuide | null {
  return AFFILIATE_GUIDES.find((g) => g.slug === slug.toLowerCase()) ?? null;
}
