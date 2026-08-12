import Link from "next/link";
import type { ProductSeoContent } from "@/lib/product-seo-content";
import styles from "./product-seo-sections.module.css";

/**
 * The editorial half of a product page.
 *
 * Rendered inside <main> so it lands in the initial HTML — a crawler reads it
 * without executing any JavaScript, which is the entire point. Plain headings
 * and lists rather than tabs or accordions for the same reason: content hidden
 * behind an interaction is content Google weighs less.
 */
export function ProductSeoSections({
  content,
  productName,
  gameName,
}: {
  content: ProductSeoContent;
  productName: string;
  gameName: string;
}) {
  const heading = gameName ? `${productName} for ${gameName}` : productName;

  return (
    <section className={styles.wrap} aria-label="Product information">
      <h2 className={styles.h2}>What is {heading}?</h2>
      {content.intro.map((p, i) => (
        <p key={i} className={styles.p}>
          {p}
        </p>
      ))}

      {content.featureGroups.map((group) => (
        <div key={group.heading}>
          <h3 className={styles.h3}>{group.heading}</h3>
          <ul className={styles.list}>
            {group.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      <h2 className={styles.h2}>Detection risk and anti-cheat</h2>
      {content.safety.map((p, i) => (
        <p key={i} className={styles.p}>
          {p}
        </p>
      ))}
      <p className={styles.p}>
        Live detection status for every product is on the{" "}
        <Link href="/status" className={styles.link}>
          status page
        </Link>
        , and how detection actually works is covered in{" "}
        <Link href="/blog/how-anti-cheat-detection-works" className={styles.link}>
          our anti-cheat explainer
        </Link>
        .
      </p>

      <h2 className={styles.h2}>System requirements</h2>
      <ul className={styles.list}>
        {content.requirements.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 className={styles.h2}>When to choose {productName}</h2>
      <ul className={styles.list}>
        {content.chooseWhen.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h3 className={styles.h3}>When something else is the better buy</h3>
      <ul className={styles.list}>
        {content.chooseOther.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 className={styles.h2}>Frequently asked questions</h2>
      {content.faqs.map((faq) => (
        <div key={faq.q} className={styles.faq}>
          <h3 className={styles.faqQ}>{faq.q}</h3>
          <p className={styles.p}>{faq.a}</p>
        </div>
      ))}
    </section>
  );
}
