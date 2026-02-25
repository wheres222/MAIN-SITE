/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type { StoreReview } from "@/lib/reviews";
import styles from "@/components/reviews-board.module.css";

interface ReviewsBoardProps {
  reviews: StoreReview[];
}

function formattedDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.starRow} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < rating;
        return (
          <svg
            key={index}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={filled ? styles.starFilled : styles.starEmpty}
            aria-hidden="true"
          >
            <path d="m12 3.2 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.5 2.8 1-6-4.4-4.3 6.1-.9L12 3.2Z" />
          </svg>
        );
      })}
    </span>
  );
}

export function ReviewsBoard({ reviews }: ReviewsBoardProps) {
  return (
    <section className={styles.reviewsPage}>
      <header className={styles.hero}>
        <h1 className={styles.title}>
          <svg viewBox="0 0 24 24" fill="none" className={styles.titleIcon} aria-hidden="true">
            <path
              d="M3 9.2a2.2 2.2 0 0 1 2.2-2.2h13.6A2.2 2.2 0 0 1 21 9.2v7.6a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 16.8V9.2Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M3.5 10.2h17"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="8.3" cy="13.8" r="1.1" fill="currentColor" />
            <circle cx="12" cy="15.4" r="1.1" fill="currentColor" />
            <circle cx="15.8" cy="13.4" r="1.1" fill="currentColor" />
          </svg>
          <span className={styles.titlePrimary}>Customer</span>
          <span className={styles.titleAccent}>Reviews</span>
        </h1>
        <p className={styles.subtitle}>
          Verified buyer feedback including rating, date, and purchased product details.
        </p>
        <p className={styles.integrationNote}>
          <span className={styles.integrationDot} />
          Demo feed now, SellAuth reviews integration next.
        </p>
      </header>

      <section className={styles.grid}>
        {reviews.map((review) => (
          <article key={review.id} className={styles.card}>
            <header className={styles.cardTop}>
              <Stars rating={review.rating} />
              <span className={styles.date}>{formattedDate(review.date)}</span>
            </header>

            <p className={styles.message}>{review.message}</p>

            <footer className={styles.cardBottom}>
              <Link href={`/products/${review.productId}`} className={styles.productLink}>
                <img
                  src={review.productImage}
                  alt={review.productName}
                  className={styles.thumb}
                  loading="lazy"
                />
                {review.productName}
              </Link>
            </footer>
          </article>
        ))}
      </section>
    </section>
  );
}
