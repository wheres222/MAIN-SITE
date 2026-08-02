import Image from "next/image";

/**
 * Three Trustpilot screenshots fanned out — the middle one square on and in
 * front, the outer two tilted and tucked behind it. Hovering any card
 * straightens it, lifts it and brings it to the front.
 *
 * Deliberately CSS-only: no state, no hydration, so it renders server-side and
 * works before (or without) JavaScript.
 */

const REVIEWS = [
  { src: "/reviews/review-1.png", width: 555, height: 378, alt: "Trustpilot review from slaviex, five stars: “Best site”", position: "left" },
  { src: "/reviews/review-2.png", width: 593, height: 355, alt: "Trustpilot review from PHANTOMMODZZ, five stars: “10/10 mods”", position: "mid" },
  { src: "/reviews/review-3.png", width: 567, height: 301, alt: "Trustpilot review from corro, five stars: “great product and owner is very helpful”", position: "right" },
] as const;

export function ReviewCards() {
  return (
    <section className="review-fan-section" aria-label="Customer reviews">
      <header className="review-fan-heading">
        <h2>What Our Users Say</h2>
        <p>Thousands of satisfied customers across all our products</p>
      </header>

      <div className="review-fan">
        {REVIEWS.map((review) => (
          <figure key={review.src} className={`review-fan-card review-fan-${review.position}`}>
            <Image
              src={review.src}
              alt={review.alt}
              width={review.width}
              height={review.height}
              sizes="(max-width: 900px) 90vw, 380px"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
