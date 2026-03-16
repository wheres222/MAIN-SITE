"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo } from "react";
import { productHref } from "@/lib/product-route";
import type {
  SellAuthCategory,
  SellAuthGroup,
  SellAuthProduct,
} from "@/types/sellauth";
import styles from "@/components/product-status-board.module.css";

type StatusKind = "undetected" | "testing" | "detected";

interface ProductStatusMeta {
  kind: StatusKind;
  label: string;
}

interface GroupedProductEntry {
  key: string;
  product: SellAuthProduct;
}

interface GroupedCategory {
  key: string;
  name: string;
  logo: string;
  items: GroupedProductEntry[];
}

interface ProductStatusBoardProps {
  products: SellAuthProduct[];
  groups?: SellAuthGroup[];
  categories?: SellAuthCategory[];
}

function normalized(value: string): string {
  return value.toLowerCase().trim();
}

function cleanLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function categoryKey(value: string): string {
  const cleaned = normalized(cleanLabel(value)).replace(/[^a-z0-9]+/g, " ").trim();
  return cleaned || "other";
}

function categoryLogoForName(groupName: string): string {
  const source = normalized(groupName);

  if (source.includes("apex")) return "/status-icons/apex.png";
  if (source.includes("arc")) return "/status-icons/arc-raiders.png";
  if (source.includes("battlefield") || source.includes("bf")) return "/pd/call-of-duty.png";
  if (source.includes("valorant") || source.includes("val")) return "/pd/valorant.png";
  if (source.includes("rust")) return "/status-icons/rust.png";
  if (source.includes("rainbow") || source.includes("r6")) return "/status-icons/rainbow-six-siege.png";
  if (source.includes("call of duty") || source.includes("cod")) return "/pd/call-of-duty.png";
  if (source.includes("fortnite")) return "/status-icons/fortnite.png";
  if (source.includes("counter") || source.includes("cs2")) return "/status-icons/counter-strike-2.png";
  if (source.includes("dayz")) return "/status-icons/dayz.png";
  if (source.includes("fivem")) return "/pd/fivem.png";
  if (source.includes("roblox")) return "/pd/roblox.png";
  if (source.includes("pubg")) return "/pd/pubg.png";
  if (source.includes("league") || source.includes("lol")) return "/pd/lol.png";
  if (source.includes("hwid")) return "/status-icons/hwid-spoofers.png";

  return "/pd/misc.svg";
}

function inferStatus(product: SellAuthProduct): ProductStatusMeta {
  const operationalText = normalized(
    `${product.name} ${product.description} ${product.variants.map((variant) => variant.name).join(" ")}`
  );

  if (/(detected|disabled|offline|down|banned|unsafe)/i.test(operationalText)) {
    return {
      kind: "detected",
      label: "DETECTED",
    };
  }

  if (/(updating|testing|maintenance|patching|investigating|beta)/i.test(operationalText)) {
    return {
      kind: "testing",
      label: "TESTING",
    };
  }

  return {
    kind: "undetected",
    label: "UNDETECTED",
  };
}

function pickCategoryName(
  product: SellAuthProduct,
  groupsById: Map<number, string>,
  categoriesById: Map<number, string>
): string {
  const nameFromGroupId =
    typeof product.groupId === "number" ? groupsById.get(product.groupId) || "" : "";
  const nameFromCategoryId =
    typeof product.categoryId === "number"
      ? categoriesById.get(product.categoryId) || ""
      : "";

  const groupName = cleanLabel(product.groupName || "");
  const categoryName = cleanLabel(product.categoryName || "");

  return (
    cleanLabel(nameFromGroupId) ||
    cleanLabel(nameFromCategoryId) ||
    groupName ||
    categoryName ||
    "Other"
  );
}

function shouldHideStatusCategory(name: string, key: string): boolean {
  const source = `${normalized(name)} ${normalized(key)}`;
  return /\baccounts?\b/.test(source) || /\bvpns?\b/.test(source);
}

export function ProductStatusBoard({
  products,
  groups = [],
  categories = [],
}: ProductStatusBoardProps) {
  const grouped = useMemo<GroupedCategory[]>(() => {
    const groupsById = new Map<number, string>(
      groups
        .map((group) => [group.id, cleanLabel(group.name)] as const)
        .filter(([, name]) => Boolean(name))
    );

    const categoriesById = new Map<number, string>(
      categories
        .map((category) => [category.id, cleanLabel(category.name)] as const)
        .filter(([, name]) => Boolean(name))
    );

    const groupedMap = new Map<string, GroupedCategory>();

    products.forEach((product, index) => {
      const resolvedCategoryName = pickCategoryName(product, groupsById, categoriesById);
      const key = categoryKey(resolvedCategoryName);

      const existing = groupedMap.get(key);
      if (existing) {
        if (resolvedCategoryName.length > existing.name.length) {
          existing.name = resolvedCategoryName;
          existing.logo = categoryLogoForName(resolvedCategoryName);
        }
        existing.items.push({ key: `${product.id}-${index}`, product });
        return;
      }

      groupedMap.set(key, {
        key,
        name: resolvedCategoryName,
        logo: categoryLogoForName(resolvedCategoryName),
        items: [{ key: `${product.id}-${index}`, product }],
      });
    });

    return [...groupedMap.values()]
      .filter((group) => !shouldHideStatusCategory(group.name, group.key))
      .map((group) => ({
        ...group,
        items: [...group.items].sort((a, b) => a.product.name.localeCompare(b.product.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, groups, categories]);

  if (!grouped.length) {
    return <div className={styles.empty}>No products available right now.</div>;
  }

  return (
    <section className={styles.statusPage}>
      <div className={styles.board}>
        {grouped.map((category) => (
          <section key={category.key} className={styles.categoryCard}>
            <header className={styles.categoryHeader}>
              <span className={styles.categoryLogoBox} aria-hidden="true">
                <img src={category.logo} alt="" className={styles.categoryLogo} loading="lazy" />
              </span>

              <h2 className={styles.categoryTitle}>{category.name}</h2>

              <span className={styles.countChip}>
                {category.items.length} {category.items.length === 1 ? "product" : "products"}
              </span>
            </header>

            <ul className={styles.productList}>
              {category.items.map(({ key, product }) => {
                const status = inferStatus(product);

                return (
                  <li key={key} className={styles.productRow}>
                    <p className={styles.name}>
                      <Link href={productHref(product)}>{product.name}</Link>
                    </p>

                    <div className={styles.rowRight}>
                      <span
                        className={`${styles.statusPill} ${
                          status.kind === "undetected"
                            ? styles.undetected
                            : status.kind === "detected"
                              ? styles.detected
                              : styles.testing
                        }`}
                      >
                        <span className={styles.dot} aria-hidden="true" />
                        {status.label}
                      </span>

                      <Link href={productHref(product)} className={styles.purchaseBtn}>
                        Purchase Now
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
